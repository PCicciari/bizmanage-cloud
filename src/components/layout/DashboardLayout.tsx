
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarMenuItem, SidebarMenuButton, SidebarMenuSkeleton } from "@/components/ui/sidebar";
import { Building, LayoutDashboard, Package, Users, LogOut } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, isAdmin, isBranchManager, loading, userProfile } = useAuth();
  
  console.log("DashboardLayout rendering", { isAdmin, isBranchManager, loading, userProfile });
  
  // Navigation items for different roles
  const adminNavigation = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/" },
    { name: "Employees", icon: Users, href: "/employees" },
    { name: "Inventory", icon: Package, href: "/inventory" },
    { name: "Branches", icon: Building, href: "/branches" },
  ];
  
  const branchManagerNavigation = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/" },
    { name: "Employees", icon: Users, href: "/employees" },
    { name: "Inventory", icon: Package, href: "/inventory" },
  ];
  
  // Choose navigation based on role
  let navigation = adminNavigation;
  
  if (isBranchManager) {
    navigation = branchManagerNavigation;
  }
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <div className="flex items-center justify-between px-4 py-6">
                <h1 className="text-xl font-semibold text-primary">BizManage</h1>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.href}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-muted rounded-md transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </SidebarProvider>
  );
}
