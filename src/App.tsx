
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create a protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userProfile, loading, forceReload } = useAuth();
  
  console.log("ProtectedRoute: checking auth", { 
    user: user?.id, 
    userProfile: userProfile?.id, 
    loading 
  });
  
  // Show loading state if authentication is still being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-4"
            onClick={() => forceReload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  // Redirect to login if no user found
  if (!user) {
    console.log("Protected route: redirecting to login because no user");
    return <Navigate to="/login" replace />;
  }
  
  // If user exists but profile is missing, try to reload once then show a more helpful UI
  if (!userProfile) {
    console.log("Protected route: user exists but profile missing, forcing reload");
    forceReload();
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground text-center mb-2">Your profile is being loaded...</p>
          <p className="text-xs text-muted-foreground text-center mb-4">
            This may take a moment. If it continues, please try logging out and back in.
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2"
            onClick={() => forceReload()}
          >
            Retry
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/login'}
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }
  
  // User and profile exist, render the page
  console.log("Protected route: rendering children");
  return <>{children}</>;
};

// Create a login route component that redirects if already logged in
const LoginRoute = () => {
  const { user, userProfile, loading } = useAuth();
  
  console.log("LoginRoute: checking auth", { 
    user: user?.id, 
    userProfile: userProfile?.id, 
    loading 
  });
  
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
  
  // Otherwise show login form (even if user exists but no profile)
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
