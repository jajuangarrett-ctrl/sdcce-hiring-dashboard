import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

// ─── Backend detection ──────────────────────────────────────────────
let backendAvailable: boolean | null = null;
let backendCheckPromise: Promise<boolean> | null = null;

function checkBackend(): Promise<boolean> {
  if (backendCheckPromise) return backendCheckPromise;
  backendCheckPromise = fetch(`${API_BASE}/api/stats`, { method: "GET" })
    .then((res) => {
      backendAvailable = res.ok;
      return res.ok;
    })
    .catch(() => {
      backendAvailable = false;
      return false;
    });
  return backendCheckPromise;
}

checkBackend();

// ─── Lazy-loaded local store (only loaded when backend is down) ─────
let _localStoreModule: typeof import("./localStore") | null = null;

async function getLocalStore() {
  if (!_localStoreModule) {
    _localStoreModule = await import("./localStore");
  }
  return _localStoreModule.localStore;
}

// ─── Local-store router ─────────────────────────────────────────────
async function routeLocal(method: string, url: string, data?: unknown): Promise<unknown> {
  const store = await getLocalStore();

  if (method === "GET" && url === "/api/stats") return store.getStats();
  if (method === "GET" && url === "/api/recruitments") return store.getAllRecruitments();
  if (method === "POST" && url === "/api/recruitments") return store.createRecruitment(data as any);

  const getOne = url.match(/^\/api\/recruitments\/(\d+)$/);
  if (getOne) {
    const id = parseInt(getOne[1]);
    if (method === "GET") {
      const r = store.getRecruitment(id);
      if (!r) throw new Error("404: Recruitment not found");
      return r;
    }
    if (method === "PATCH") {
      const r = store.updateRecruitment(id, data as any);
      if (!r) throw new Error("404: Recruitment not found");
      return r;
    }
    if (method === "DELETE") return store.deleteRecruitment(id);
  }

  const stepMatch = url.match(/^\/api\/recruitments\/(\d+)\/steps\/(\d+)$/);
  if (method === "PATCH" && stepMatch) {
    const r = store.updateStep(parseInt(stepMatch[1]), parseInt(stepMatch[2]), data as any);
    if (!r) throw new Error("404: Step not found");
    return r;
  }

  throw new Error(`Unknown local route: ${method} ${url}`);
}

// ─── Fake Response wrapper ──────────────────────────────────────────
function fakeResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Public API ─────────────────────────────────────────────────────
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  await checkBackend();

  if (!backendAvailable) {
    try {
      const result = await routeLocal(method, url, data);
      return fakeResponse(result, method === "POST" ? 201 : 200);
    } catch (e: any) {
      const status = e.message?.startsWith("404") ? 404 : 500;
      return fakeResponse({ error: e.message }, status);
    }
  }

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    await checkBackend();

    if (!backendAvailable) {
      const url = queryKey.join("/");
      return (await routeLocal("GET", url)) as T;
    }

    const res = await fetch(`${API_BASE}${queryKey.join("/")}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
