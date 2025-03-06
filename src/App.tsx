import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import EmployeesPage from "./pages/employees";
import InventoryPage from "./pages/inventory";
import BranchesPage from "./pages/branches";
import NotFound from "./pages/NotFound";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const queryClient = new QueryClient();

// Create a protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userProfile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  // Only redirect if we're sure there's no user
  if (!user) {
    console.log("Protected route: redirecting to login because no user");
    return <Navigate to="/login" replace />;
  }
  
  // If we have a user but no profile, show a loading state instead of redirecting
  if (!userProfile) {
    console.log("Protected route: user exists but no profile yet, showing loading");
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Finalizing your profile...</p>
          <p className="text-xs text-muted-foreground mt-2">If this takes too long, please try logging in again.</p>
        </div>
      </div>
    );
  }
  
  console.log("Protected route: rendering children");
  return <>{children}</>;
};

// Create a login route component that redirects if already logged in
const LoginRoute = () => {
  const { user, userProfile, loading } = useAuth();
  
  // During loading, show a loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Checking authentication status...</p>
        </div>
      </div>
    );
  }
  
  // If user exists and we have a profile, redirect to dashboard
  if (user && userProfile) {
    console.log("Login route: redirecting to dashboard because user and profile exist");
    return <Navigate to="/" replace />;
  }
  
  // If user exists but no profile, show loading instead of login form
  if (user && !userProfile) {
    console.log("Login route: user exists but no profile yet, showing loading");
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Setting up your profile...</p>
          <p className="text-xs text-muted-foreground mt-2">If this takes too long, please try logging in again.</p>
        </div>
      </div>
    );
  }
  
  // Otherwise show login form
  console.log("Login route: rendering login form");
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <AuthForm />
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
      <Route path="/branches" element={<ProtectedRoute><BranchesPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
