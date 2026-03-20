import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import RecruitmentDetail from "@/pages/recruitment-detail";
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setDark((d) => !d)}
      className="h-8 w-8 p-0"
      data-testid="button-theme-toggle"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2.5" data-testid="link-home">
            {/* SDCCE Shield Logo */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="SDCCE Hiring Dashboard"
            >
              <path
                d="M16 2L4 7v9c0 8.5 5.1 16.4 12 18 6.9-1.6 12-9.5 12-18V7L16 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                className="text-primary"
              />
              <path
                d="M16 8L10 10.5v5c0 4.5 2.7 8.7 6 9.5 3.3-.8 6-5 6-9.5v-5L16 8z"
                fill="currentColor"
                className="text-primary"
                opacity="0.15"
              />
              <path
                d="M13 15.5l2 2 4-4"
                stroke="hsl(42, 65%, 48%)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <div className="flex flex-col">
              <span className="font-display font-bold text-sm leading-tight">Hiring Dashboard</span>
              <span className="text-[10px] text-muted-foreground leading-tight">SDCCE · Contract Faculty</span>
            </div>
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>San Diego College of Continuing Education</span>
          <PerplexityAttribution />
        </div>
      </footer>
    </div>
  );
}

function AppRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/:id" component={RecruitmentDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
