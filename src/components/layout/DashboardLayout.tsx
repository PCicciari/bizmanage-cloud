
import { Link } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Building, LayoutDashboard, Package, Users } from "lucide-react";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Employees", icon: Users, href: "/employees" },
  { name: "Inventory", icon: Package, href: "/inventory" },
  { name: "Branches", icon: Building, href: "/branches" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <div className="px-4 py-6">
                <h1 className="text-xl font-semibold text-primary">BizManage</h1>
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
