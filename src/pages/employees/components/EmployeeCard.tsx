
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Employee, Branch } from "@/types/database.types";

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  branches?: Branch[] | undefined;
}

export function EmployeeCard({
  employee,
  onEdit,
  onDelete,
  branches,
}: EmployeeCardProps) {
  // Get branch name
  const getBranchName = (branchId: string): string => {
    const branch = branches?.find(b => b.id === branchId);
    return branch?.name || "Unknown Branch";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {employee.first_name} {employee.last_name}
        </CardTitle>
        <CardDescription>{employee.position}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Email: {employee.email}
          </p>
          <p className="text-sm text-gray-600">
            Salary: ${employee.salary.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Branch: {getBranchName(employee.branch_id)}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEdit(employee)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDelete(employee.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
