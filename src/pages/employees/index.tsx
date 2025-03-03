
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Employee } from "@/types/database.types";
import { useToast } from "@/hooks/use-toast";
import { EmployeeForm } from "./components/EmployeeForm";
import { EmployeeCard } from "./components/EmployeeCard";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

const EmployeesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { user, loading, userProfile } = useAuth();

  // Check if the user is a branch admin
  const isBranchAdmin = userProfile?.role === 'branch_manager';
  const userBranchId = userProfile?.branch_id || "";

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      let query = supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      // For branch admins, only fetch employees from their branch
      if (isBranchAdmin && userBranchId) {
        query = query.eq("branch_id", userBranchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      let query = supabase
        .from("branches")
        .select("*")
        .order("name", { ascending: true });
      
      // For branch admins, only fetch their branch
      if (isBranchAdmin && userBranchId) {
        query = query.eq("id", userBranchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (newEmployee: Omit<Employee, "id" | "created_at">) => {
      // For branch admins, always set the branch_id to their branch
      if (isBranchAdmin && userBranchId) {
        newEmployee.branch_id = userBranchId;
      }

      const { data, error } = await supabase
        .from("employees")
        .insert([newEmployee])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Success", description: "Employee created successfully" });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (employee: Partial<Employee>) => {
      // For branch admins, ensure they can't change the branch_id
      if (isBranchAdmin && userBranchId) {
        employee.branch_id = userBranchId;
      }

      const { data, error } = await supabase
        .from("employees")
        .update(employee)
        .eq("id", editingEmployee?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Success", description: "Employee updated successfully" });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Success", description: "Employee deleted successfully" });
    },
  });

  const handleSubmit = (formData: Partial<Employee>) => {
    if (editingEmployee) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData as Omit<Employee, "id" | "created_at">);
    }
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingEmployee(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold">Loading...</h2>
        </div>
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold">Loading...</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold">Employees</h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <EmployeeForm
                editingEmployee={editingEmployee}
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
                branches={branches}
                isBranchAdmin={isBranchAdmin}
                userBranchId={userBranchId}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees?.map((employee: Employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={(employee) => {
                setEditingEmployee(employee);
                setIsOpen(true);
              }}
              onDelete={(id) => deleteMutation.mutate(id)}
              branches={branches}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeesPage;
