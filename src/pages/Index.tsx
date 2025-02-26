
import { useEffect, useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => (
  <div className="space-y-6 animate-fadeIn">
    <Card className="bg-primary text-primary-foreground p-8 rounded-3xl">
      <h2 className="text-4xl font-semibold mb-8">Total Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-medium opacity-90">Total Sales</h3>
          <p className="text-3xl font-bold mt-2">$24,000</p>
        </div>
        <div>
          <h3 className="text-lg font-medium opacity-90">Total Employees</h3>
          <p className="text-3xl font-bold mt-2">15</p>
        </div>
        <div>
          <h3 className="text-lg font-medium opacity-90">Total Inventory</h3>
          <p className="text-3xl font-bold mt-2">234</p>
        </div>
        <div>
          <h3 className="text-lg font-medium opacity-90">Total Branches</h3>
          <p className="text-3xl font-bold mt-2">3</p>
        </div>
      </div>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 rounded-2xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">New Employee Added</p>
              <p className="text-sm text-gray-500">Branch: NYC01</p>
            </div>
            <p className="text-sm text-gray-500">2h ago</p>
          </div>
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Inventory Updated</p>
              <p className="text-sm text-gray-500">+50 items</p>
            </div>
            <p className="text-sm text-gray-500">5h ago</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-2xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Goals</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Sales Target</span>
              <span className="text-sm font-medium">75%</span>
            </div>
            <div className="h-2 bg-muted rounded-full">
              <div className="h-2 bg-primary rounded-full" style={{ width: "75%" }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Inventory Turnover</span>
              <span className="text-sm font-medium">60%</span>
            </div>
            <div className="h-2 bg-muted rounded-full">
              <div className="h-2 bg-primary rounded-full" style={{ width: "60%" }}></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

const BranchManagerDashboard = ({ branchId }: { branchId: string }) => (
  <div className="space-y-6 animate-fadeIn">
    <Card className="bg-primary text-primary-foreground p-8 rounded-3xl">
      <h2 className="text-4xl font-semibold mb-8">Branch Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-medium opacity-90">Branch Sales</h3>
          <p className="text-3xl font-bold mt-2">$8,000</p>
        </div>
        <div>
          <h3 className="text-lg font-medium opacity-90">Branch Employees</h3>
          <p className="text-3xl font-bold mt-2">5</p>
        </div>
        <div>
          <h3 className="text-lg font-medium opacity-90">Branch Inventory</h3>
          <p className="text-3xl font-bold mt-2">78</p>
        </div>
      </div>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 rounded-2xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Tasks</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-warning"></div>
              <p className="font-medium">Review Inventory</p>
            </div>
            <p className="text-sm text-gray-500">2:00 PM</p>
          </div>
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <p className="font-medium">Staff Meeting</p>
            </div>
            <p className="text-sm text-gray-500">4:00 PM</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-2xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Daily Sales Goal</span>
              <span className="text-sm font-medium">82%</span>
            </div>
            <div className="h-2 bg-muted rounded-full">
              <div className="h-2 bg-primary rounded-full" style={{ width: "82%" }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Customer Satisfaction</span>
              <span className="text-sm font-medium">95%</span>
            </div>
            <div className="h-2 bg-muted rounded-full">
              <div className="h-2 bg-primary rounded-full" style={{ width: "95%" }}></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

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
