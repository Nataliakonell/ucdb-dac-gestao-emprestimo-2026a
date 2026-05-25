import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Equipamentos from "./pages/Equipamentos";
import Emprestimos from "./pages/Emprestimos";
import Notificacoes from "./pages/Notificacoes";
import Aprovacoes from "./pages/Aprovacoes";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" aria-busy="true" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Carregando sua sessão segura...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== "Administrador") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const HomeRedirect = () => {
  const { user } = useAuth();

  return <Navigate to={user?.role === "Administrador" ? "/dashboard" : "/equipamentos"} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Collaborative/General Routes */}
              <Route path="/" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
              <Route path="/equipamentos" element={<ProtectedRoute><Equipamentos /></ProtectedRoute>} />
              <Route path="/emprestimos" element={<ProtectedRoute><Emprestimos /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />

              {/* Protected Administrative-only Routes */}
              <Route path="/notificacoes" element={<ProtectedRoute adminOnly><Notificacoes /></ProtectedRoute>} />
              <Route path="/aprovacoes" element={<ProtectedRoute adminOnly><Aprovacoes /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
