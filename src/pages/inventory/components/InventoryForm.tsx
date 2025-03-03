
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InventoryItem, Branch } from "@/types/database.types";

interface InventoryFormProps {
  editingItem: InventoryItem | null;
  branches: Branch[] | undefined;
  onSubmit: (formData: Partial<InventoryItem>) => void;
  isLoading: boolean;
  isBranchAdmin?: boolean;
  userBranchId?: string;
}

export function InventoryForm({
  editingItem,
  branches,
  onSubmit,
  isLoading,
  isBranchAdmin = false,
  userBranchId = "",
}: InventoryFormProps) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || "",
    description: editingItem?.description || "",
    quantity: editingItem?.quantity.toString() || "",
    price: editingItem?.price.toString() || "",
    branch_id: isBranchAdmin ? userBranchId : (editingItem?.branch_id || (branches?.[0]?.id || "")),
    reorder_point: editingItem?.reorder_point?.toString() || "0",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      quantity: Number(formData.quantity),
      price: Number(formData.price),
      reorder_point: Number(formData.reorder_point),
    });
  };

  // Get the branch name for display in branch admin mode
  const getBranchName = (branchId: string): string => {
    const branch = branches?.find(b => b.id === branchId);
    return branch?.name || "Unknown Branch";
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {editingItem ? "Edit Item" : "Add New Item"}
        </DialogTitle>
        <DialogDescription>
          Fill in the details for the inventory item.
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
          <Textarea
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
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reorder_point">Reorder Point</Label>
            <Input
              id="reorder_point"
              type="number"
              value={formData.reorder_point}
              onChange={(e) =>
                setFormData({ ...formData, reorder_point: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            {isBranchAdmin ? (
              <Input
                id="branch"
                value={getBranchName(userBranchId)}
                disabled
              />
            ) : (
              <select
                id="branch"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.branch_id}
                onChange={(e) =>
                  setFormData({ ...formData, branch_id: e.target.value })
                }
                required
              >
                <option value="">Select a branch</option>
                {branches?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {editingItem ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
