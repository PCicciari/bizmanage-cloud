
import { useEffect, useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p>Loading...</p>
      </div>
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
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-3xl font-semibold">Welcome back</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quick stats cards */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Total Sales</h3>
            <p className="text-2xl font-semibold text-primary">$24,000</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Employees</h3>
            <p className="text-2xl font-semibold text-primary">15</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Inventory Items</h3>
            <p className="text-2xl font-semibold text-primary">234</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Branches</h3>
            <p className="text-2xl font-semibold text-primary">3</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
