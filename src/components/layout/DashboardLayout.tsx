
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Building, LayoutDashboard, Package, Users, LogOut } from "lucide-react";

const getNavigation = (isAdmin: boolean) => {
  const baseNavigation = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  ];

  if (isAdmin) {
    return [
      ...baseNavigation,
      { name: "Employees", icon: Users, href: "/employees" },
      { name: "Inventory", icon: Package, href: "/inventory" },
      { name: "Branches", icon: Building, href: "/branches" },
    ];
  }

  return baseNavigation;
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, isAdmin, loading } = useAuth();
  const navigation = getNavigation(isAdmin);
  
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
              {!loading && navigation.map((item) => (
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
