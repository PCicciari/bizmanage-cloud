import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import { AlertCircle, Package, Pencil, Trash, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/types/database.types";
import { useToast } from "@/hooks/use-toast";

const LOW_STOCK_THRESHOLD = 10; // Items below this quantity are considered low stock

const InventoryPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low">("all");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    price: "",
    reorder_point: "",
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Check for low stock items and show notifications
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
  });

  const filteredItems = items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStockFilter = stockFilter === "all" || 
      (stockFilter === "low" && item.quantity <= LOW_STOCK_THRESHOLD);
    return matchesSearch && matchesStockFilter;
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: Omit<InventoryItem, "id" | "created_at" | "branch_id">) => {
      const { data, error } = await supabase
        .from("inventory")
        .insert([{ ...newItem, branch_id: "default" }])
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = {
      ...formData,
      quantity: Number(formData.quantity),
      price: Number(formData.price),
      reorder_point: Number(formData.reorder_point),
    };

    if (editingItem) {
      updateMutation.mutate(item);
    } else {
      createMutation.mutate(item);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      quantity: item.quantity.toString(),
      price: item.price.toString(),
      reorder_point: item.reorder_point.toString(),
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      quantity: "",
      price: "",
      reorder_point: "",
    });
  };

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
          <h2 className="text-3xl font-semibold">Inventory</h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Item" : "Add New Item"}
                </DialogTitle>
                <DialogDescription>
                  Fill in the item details below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
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
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder_point">Reorder Point</Label>
                  <Input
                    id="reorder_point"
                    type="number"
                    min="0"
                    value={formData.reorder_point}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_point: e.target.value })
                    }
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Set the quantity at which you want to be notified to reorder
                  </p>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant={stockFilter === "low" ? "destructive" : "outline"}
            onClick={() => setStockFilter(stockFilter === "low" ? "all" : "low")}
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            {stockFilter === "low" ? "Show All" : "Low Stock"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems?.map((item: InventoryItem) => (
            <Card key={item.id} className={item.quantity <= LOW_STOCK_THRESHOLD ? "border-red-500" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {item.name}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                    {item.quantity <= LOW_STOCK_THRESHOLD && (
                      <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-1 rounded">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Price: ${item.price.toFixed(2)}
                  </p>
                  {item.reorder_point && (
                    <p className="text-sm text-gray-600">
                      Reorder Point: {item.reorder_point}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(item)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteMutation.mutate(item.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InventoryPage;
