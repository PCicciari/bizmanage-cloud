import { useState, useEffect } from "react";
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
import { InventoryItem, Branch } from "@/types/database.types";
import { useToast } from "@/hooks/use-toast";
import { InventoryForm } from "./components/InventoryForm";
import { InventoryCard } from "./components/InventoryCard";
import { InventoryFilters } from "./components/InventoryFilters";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

const LOW_STOCK_THRESHOLD = 10;

const InventoryPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low">("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const { user, loading, isAdmin, isBranchManager, branchId } = useAuth();
  
  useEffect(() => {
    if (isBranchManager && branchId) {
      setSelectedBranch(branchId);
    }
  }, [isBranchManager, branchId]);

  const { data: items, isLoading } = useQuery({
    queryKey: ["inventory", selectedBranch],
    queryFn: async () => {
      let query = supabase
        .from("inventory")
        .select("*")
        .order("created_at", { ascending: false });

      if (isBranchManager && branchId) {
        query = query.eq("branch_id", branchId);
      } else if (selectedBranch) {
        query = query.eq("branch_id", selectedBranch);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      data?.forEach(item => {
        if (item.quantity <= LOW_STOCK_THRESHOLD) {
          toast({
            title: "Low Stock Alert",
            description: `${item.name} is running low (${item.quantity} remaining)`,
            variant: "destructive",
          });
        }
      });

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
      
      if (isBranchManager && branchId) {
        query = query.eq("id", branchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: Omit<InventoryItem, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("inventory")
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Success", description: "Item added successfully" });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: Partial<InventoryItem>) => {
      const { data, error } = await supabase
        .from("inventory")
        .update(item)
        .eq("id", editingItem?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Success", description: "Item updated successfully" });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Success", description: "Item deleted successfully" });
    },
  });

  const handleSubmit = (formData: Partial<InventoryItem>) => {
    if (isBranchManager && branchId) {
      formData.branch_id = branchId;
    }
    
    if (editingItem) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData as Omit<InventoryItem, "id" | "created_at">);
    }
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingItem(null);
  };

  const getBranchName = (branchId: string) => {
    const branch = branches?.find((b: Branch) => b.id === branchId);
    return branch?.name || "Unknown Branch";
  };

  const filteredItems = items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStockFilter = stockFilter === "all" || 
      (stockFilter === "low" && item.quantity <= LOW_STOCK_THRESHOLD);
    return matchesSearch && matchesStockFilter;
  });

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
          <h2 className="text-3xl font-semibold">Loading inventory...</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold">Inventory</h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <InventoryForm
                editingItem={editingItem}
                branches={branches}
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
                isBranchAdmin={isBranchManager}
                userBranchId={branchId}
              />
            </DialogContent>
          </Dialog>
        </div>

        <InventoryFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          branches={branches}
          isBranchAdmin={isBranchManager}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems?.map((item: InventoryItem) => (
            <InventoryCard
              key={item.id}
              item={item}
              branchName={getBranchName(item.branch_id)}
              lowStockThreshold={LOW_STOCK_THRESHOLD}
              onEdit={(item) => {
                setEditingItem(item);
                setIsOpen(true);
              }}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InventoryPage;
