
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/login" element={<AuthForm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
