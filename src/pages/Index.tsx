import { useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Sale, Employee, InventoryItem, Branch } from "@/types/database.types";
import { formatDistance } from "date-fns";

const calculateTotalSales = (sales: Sale[]) => {
  return sales.reduce((total, sale) => total + sale.total_amount, 0);
};

const AdminDashboard = () => {
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const [salesActivity, inventoryUpdates] = await Promise.all([
        supabase
          .from("sales")
          .select("*, employees(first_name, last_name)")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("inventory")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      return {
        sales: salesActivity.data || [],
        inventory: inventoryUpdates.data || [],
      };
    },
  });

  const currentMonthSales = sales?.filter(sale => {
    const saleDate = new Date(sale.created_at);
    const now = new Date();
    return saleDate.getMonth() === now.getMonth() && 
           saleDate.getFullYear() === now.getFullYear();
  }) || [];

  const totalMonthlySales = calculateTotalSales(currentMonthSales);
  const monthlyTarget = 30000;
  const salesProgress = (totalMonthlySales / monthlyTarget) * 100;

  const inventoryTurnover = inventory?.reduce((acc, item) => {
    const itemSales = sales?.filter(sale => sale.item_id === item.id) || [];
    const soldQuantity = itemSales.reduce((total, sale) => total + sale.quantity, 0);
    return acc + (soldQuantity / (item.quantity || 1));
  }, 0) || 0;

  const inventoryTurnoverTarget = inventory?.length || 1;
  const turnoverProgress = (inventoryTurnover / inventoryTurnoverTarget) * 100;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card className="bg-primary text-primary-foreground p-8 rounded-3xl">
        <h2 className="text-4xl font-semibold mb-8">Total Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-medium opacity-90">Total Sales</h3>
            <p className="text-3xl font-bold mt-2">
              ${calculateTotalSales(sales || []).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium opacity-90">Total Employees</h3>
            <p className="text-3xl font-bold mt-2">{employees?.length || 0}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium opacity-90">Total Inventory</h3>
            <p className="text-3xl font-bold mt-2">
              {inventory?.reduce((total, item) => total + item.quantity, 0) || 0}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium opacity-90">Total Branches</h3>
            <p className="text-3xl font-bold mt-2">{branches?.length || 0}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity?.sales.map((sale) => (
              <div key={sale.id} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">New Sale</p>
                  <p className="text-sm text-gray-500">
                    ${sale.total_amount.toLocaleString()} by {(sale.employees as any)?.first_name}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {formatDistance(new Date(sale.created_at), new Date(), { addSuffix: true })}
                </p>
              </div>
            ))}
            {recentActivity?.inventory.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Inventory Updated</p>
                  <p className="text-sm text-gray-500">{item.name}: {item.quantity} items</p>
                </div>
                <p className="text-sm text-gray-500">
                  {formatDistance(new Date(item.created_at), new Date(), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Goals</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Monthly Sales Target</span>
                <span className="text-sm font-medium">
                  {salesProgress.toFixed()}% (${totalMonthlySales.toLocaleString()})
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div
                  className="h-2 bg-primary rounded-full"
                  style={{ width: `${Math.min(salesProgress, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Inventory Turnover</span>
                <span className="text-sm font-medium">
                  {turnoverProgress.toFixed()}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div
                  className="h-2 bg-primary rounded-full"
                  style={{ width: `${Math.min(turnoverProgress, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const BranchManagerDashboard = ({ branchId }: { branchId: string }) => {
  const { data: branchSales } = useQuery({
    queryKey: ["branch-sales", branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("branch_id", branchId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!branchId,
  });

  const { data: branchEmployees } = useQuery({
    queryKey: ["branch-employees", branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("branch_id", branchId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!branchId,
  });

  const { data: branchInventory } = useQuery({
    queryKey: ["branch-inventory", branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("branch_id", branchId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!branchId,
  });

  const today = new Date();
  const todaySales = branchSales?.filter(sale => {
    const saleDate = new Date(sale.created_at);
    return saleDate.toDateString() === today.toDateString();
  }) || [];
  
  const dailyTarget = 1000;
  const dailySalesTotal = calculateTotalSales(todaySales);
  const dailySalesProgress = (dailySalesTotal / dailyTarget) * 100;

  const customerSatisfaction = 95;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card className="bg-primary text-primary-foreground p-8 rounded-3xl">
        <h2 className="text-4xl font-semibold mb-8">Branch Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-medium opacity-90">Branch Sales</h3>
            <p className="text-3xl font-bold mt-2">
              ${calculateTotalSales(branchSales || []).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium opacity-90">Branch Employees</h3>
            <p className="text-3xl font-bold mt-2">{branchEmployees?.length || 0}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium opacity-90">Branch Inventory</h3>
            <p className="text-3xl font-bold mt-2">
              {branchInventory?.reduce((total, item) => total + item.quantity, 0) || 0}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Tasks</h3>
          <div className="space-y-4">
            {branchSales?.length === 0 && branchInventory?.length === 0 ? (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-gray-500">No tasks yet for today</p>
              </div>
            ) : (
              <>
                {branchSales && branchSales.length > 0 && (
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-warning"></div>
                      <p className="font-medium">Review Today's Sales</p>
                    </div>
                    <p className="text-sm text-gray-500">Today</p>
                  </div>
                )}
                {branchInventory && branchInventory.length > 0 && (
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-success"></div>
                      <p className="font-medium">Check Inventory Levels</p>
                    </div>
                    <p className="text-sm text-gray-500">Today</p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Daily Sales Goal</span>
                <span className="text-sm font-medium">
                  {dailySalesProgress.toFixed()}% (${dailySalesTotal.toLocaleString()})
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div
                  className="h-2 bg-primary rounded-full"
                  style={{ width: `${Math.min(dailySalesProgress, 100)}%` }}
                ></div>
              </div>
            </div>
            
            {branchInventory && branchInventory.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Top Inventory Items</h4>
                <div className="space-y-2">
                  {branchInventory
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 3)
                    .map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span>{item.quantity} units</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-[200px] rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton className="h-[300px] rounded-2xl" />
      <Skeleton className="h-[300px] rounded-2xl" />
    </div>
  </div>
);

const Index = () => {
  const { user, loading, isAdmin, isBranchManager, branchId } = useAuth();
  
  console.log("Index page rendering with auth state:", { user, loading, isAdmin, isBranchManager, branchId });

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSkeleton />
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <AuthForm />
      </div>
    );
  }

  if (isBranchManager && !branchId) {
    return (
      <DashboardLayout>
        <div className="text-center p-6">
          <h2 className="text-2xl font-semibold text-red-600">Branch Manager Setup Error</h2>
          <p className="mt-2 text-gray-600">
            Your account is configured as a branch manager but no branch is assigned.
            Please contact an administrator to assign you to a branch.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {isAdmin ? (
        <AdminDashboard />
      ) : isBranchManager && branchId ? (
        <BranchManagerDashboard branchId={branchId} />
      ) : (
        <div className="text-center p-6">
          <h2 className="text-2xl font-semibold text-gray-900">Access Error</h2>
          <p className="mt-2 text-gray-600">Invalid user role configuration. Please contact support.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Index;
