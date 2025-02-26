import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, MapPin, Phone, UserCircle2, Pencil, Trash, Plus, Package, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Branch, Employee, InventoryItem } from "@/types/database.types";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface BranchStatistics {
  employeeCount: number;
  inventoryItemCount: number;
  totalInventoryValue: number;
}

const BranchesPage = () => {
  console.log("Rendering BranchesPage");
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    manager_id: "",
  });

  const { data: branches, isLoading: branchesLoading, error: branchesError } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      console.log("Fetching branches...");
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching branches:", error);
        throw error;
      }
      console.log("Branches fetched:", data);
      return data;
    },
    enabled: !!user,
  });

  const { data: employees, error: employeesError } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      console.log("Fetching employees...");
      const { data, error } = await supabase
        .from("employees")
        .select("*");

      if (error) {
        console.error("Error fetching employees:", error);
        throw error;
      }
      console.log("Employees fetched:", data);
      return data;
    },
    enabled: !!user,
  });

  const { data: inventory, error: inventoryError } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      console.log("Fetching inventory...");
      const { data, error } = await supabase
        .from("inventory")
        .select("*");

      if (error) {
        console.error("Error fetching inventory:", error);
        throw error;
      }
      console.log("Inventory fetched:", data);
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) {
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

  if (branchesError) console.error("Branches error:", branchesError);
  if (employeesError) console.error("Employees error:", employeesError);
  if (inventoryError) console.error("Inventory error:", inventoryError);

  console.log("Current state:", {
    branchesLoading,
    hasBranches: Boolean(branches),
    branchesCount: branches?.length,
    hasEmployees: Boolean(employees),
    hasInventory: Boolean(inventory)
  });

  const getBranchStatistics = (branchId: string): BranchStatistics => {
    const branchEmployees = employees?.filter((emp: Employee) => emp.branch_id === branchId) || [];
    const branchInventory = inventory?.filter((item: InventoryItem) => item.branch_id === branchId) || [];
    
    const totalValue = branchInventory.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    return {
      employeeCount: branchEmployees.length,
      inventoryItemCount: branchInventory.length,
      totalInventoryValue: totalValue,
    };
  };

  const createMutation = useMutation({
    mutationFn: async (newBranch: Omit<Branch, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("branches")
        .insert([newBranch])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({ title: "Success", description: "Branch added successfully" });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (branch: Partial<Branch>) => {
      const { data, error } = await supabase
        .from("branches")
        .update(branch)
        .eq("id", editingBranch?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({ title: "Success", description: "Branch updated successfully" });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({ title: "Success", description: "Branch deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBranch) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      manager_id: branch.manager_id,
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingBranch(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      manager_id: "",
    });
  };

  const getManagerName = (managerId: string) => {
    const manager = employees?.find((emp: Employee) => emp.id === managerId);
    return manager ? `${manager.first_name} ${manager.last_name}` : "Not assigned";
  };

  if (branchesError || employeesError || inventoryError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold text-red-600">Error loading data</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (branchesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold">Loading branches...</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold">Branches</h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBranch ? "Edit Branch" : "Add New Branch"}
                </DialogTitle>
                <DialogDescription>
                  Fill in the branch details below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager">Branch Manager</Label>
                  <select
                    id="manager"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={formData.manager_id}
                    onChange={(e) =>
                      setFormData({ ...formData, manager_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a manager</option>
                    {employees?.map((employee: Employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingBranch ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches?.map((branch: Branch) => {
            const stats = getBranchStatistics(branch.id);
            return (
              <Card key={branch.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {branch.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {branch.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {branch.phone}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <UserCircle2 className="h-4 w-4" />
                        Manager: {getManagerName(branch.manager_id)}
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-2 pt-2">
                      <h4 className="text-sm font-medium">Branch Statistics</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <UserCircle2 className="h-4 w-4" />
                        Employees: {stats.employeeCount}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Inventory Items: {stats.inventoryItemCount}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Total Inventory Value: ${stats.totalInventoryValue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(branch)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteMutation.mutate(branch.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BranchesPage;
