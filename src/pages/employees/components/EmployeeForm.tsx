
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
import { Employee, Branch } from "@/types/database.types";

interface EmployeeFormProps {
  editingEmployee: Employee | null;
  onSubmit: (formData: Partial<Employee>) => void;
  isLoading: boolean;
  branches?: Branch[] | undefined;
  isBranchAdmin?: boolean;
  userBranchId?: string;
}

export function EmployeeForm({
  editingEmployee,
  onSubmit,
  isLoading,
  branches,
  isBranchAdmin = false,
  userBranchId = "",
}: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    first_name: editingEmployee?.first_name || "",
    last_name: editingEmployee?.last_name || "",
    email: editingEmployee?.email || "",
    position: editingEmployee?.position || "",
    salary: editingEmployee?.salary?.toString() || "",
    branch_id: isBranchAdmin ? userBranchId : (editingEmployee?.branch_id || (branches?.[0]?.id || "")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      salary: Number(formData.salary),
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
          {editingEmployee ? "Edit Employee" : "Add New Employee"}
        </DialogTitle>
        <DialogDescription>
          Fill in the details for the employee.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary">Salary</Label>
          <Input
            id="salary"
            type="number"
            value={formData.salary}
            onChange={(e) =>
              setFormData({ ...formData, salary: e.target.value })
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
        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {editingEmployee ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
