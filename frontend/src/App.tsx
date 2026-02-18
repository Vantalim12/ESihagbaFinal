import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import PublicPortal from "./pages/PublicPortal";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import { BackendProvider } from "./context/BackendContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BackendProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/transparency" element={<PublicPortal />} />
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </HashRouter>
        </TooltipProvider>
      </BackendProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
