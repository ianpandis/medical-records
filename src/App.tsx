import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import PatientDetail from "./pages/PatientDetail";
import Listas from "./pages/Listas";
import NotFound from "./pages/NotFound";
import { AppShell } from "@/components/AppShell";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Al volver del detalle se muestra la lista cacheada sin refetch inmediato
      staleTime: 30_000,
      // Un reintento alcanza; con el default (3) un paciente inexistente tarda ~7s en redirigir
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Cargando…
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/patient/:id" element={<PatientDetail />} />
                <Route path="/listas" element={<Listas />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
