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
    <h2 className="text-3xl font-semibold">Admin Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Sales</h3>
        <p className="text-2xl font-semibold text-primary">$24,000</p>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
        <p className="text-2xl font-semibold text-primary">15</p>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Inventory</h3>
        <p className="text-2xl font-semibold text-primary">234</p>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Branches</h3>
        <p className="text-2xl font-semibold text-primary">3</p>
      </Card>
    </div>
  </div>
);

const BranchManagerDashboard = ({ branchId }: { branchId: string }) => (
  <div className="space-y-6 animate-fadeIn">
    <h2 className="text-3xl font-semibold">Branch Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Branch Sales</h3>
        <p className="text-2xl font-semibold text-primary">$8,000</p>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Branch Employees</h3>
        <p className="text-2xl font-semibold text-primary">5</p>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Branch Inventory</h3>
        <p className="text-2xl font-semibold text-primary">78</p>
      </Card>
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  </div>
);

const Index = () => {
  const { user, loading, isAdmin, isBranchManager, branchId } = useAuth();

  console.log("Auth state:", { loading, user, isAdmin, isBranchManager, branchId });

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
          <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
            {JSON.stringify({ isAdmin, isBranchManager, branchId }, null, 2)}
          </pre>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Index;
