import { useEffect } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/auth-gate";
import { onStoreChange } from "@/lib/store";
import { startSync } from "@/lib/sync";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import FittingPage from "@/pages/fitting";
import Reference from "@/pages/reference";
import Outils from "@/pages/outils";
import CoachingDashboard from "@/pages/coaching";
import CoachingSessionPage from "@/pages/coaching-session";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/fitting/:id" component={FittingPage} />
      <Route path="/coaching" component={CoachingDashboard} />
      <Route path="/coaching/:id" component={CoachingSessionPage} />
      <Route path="/reference" component={Reference} />
      <Route path="/outils" component={Outils} />
      <Route component={NotFound} />
    </Switch>
  );
}

/** Relie la base locale au cache de requetes et demarre la synchronisation. */
function useLocalData() {
  useEffect(() => {
    const off = onStoreChange(() => {
      void queryClient.invalidateQueries({ queryKey: ["fittings"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      void queryClient.invalidateQueries({ queryKey: ["coachings"] });
    });
    startSync();
    return () => { off(); };
  }, []);
}

function App() {
  useLocalData();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <AuthGate>
              <Router hook={useHashLocation}>
                <AppRouter />
              </Router>
            </AuthGate>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
