
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Branch, Employee } from "@/types/database.types";

interface BranchFormProps {
  editingBranch: Branch | null;
  employees: Employee[] | undefined;
  onSubmit: (formData: Partial<Branch>) => void;
  isLoading: boolean;
}

export function BranchForm({
  editingBranch,
  employees,
  onSubmit,
  isLoading,
}: BranchFormProps) {
  const [formData, setFormData] = useState({
    name: editingBranch?.name || "",
    address: editingBranch?.address || "",
    phone: editingBranch?.phone || "",
    manager_id: editingBranch?.manager_id || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
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
            className="w-full rounded-md border border-input