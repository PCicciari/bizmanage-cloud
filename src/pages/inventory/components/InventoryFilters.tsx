
import { Search, AlertCircle, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Branch } from "@/types/database.types";

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedBranch: string;
  onBranchChange: (value: string) => void;
  stockFilter: "all" | "low";
  onStockFilterChange: (value: "all" | "low") => void;
  branches: Branch[] | undefined;
}

export function InventoryFilters({
  searchQuery,
  onSearchChange,
  selectedBranch,
  onBranchChange,
  stockFilter,
  onStockFilterChange,
  branches,
}: InventoryFiltersProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <select
        className="rounded-md border border-input bg-background px-3 py-2"
        value={selectedBranch}
        onChange={(e) => onBranchChange(e.target.value)}
      >
        <option value="">All Branches</option>
        {branches?.map((branch: Branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      <Button
        variant={stockFilter === "low" ? "destructive" : "outline"}
        onClick={() => onStockFilterChange(stockFilter === "low" ? "all" : "low")}
      >
        <AlertCircle className="mr-2 h-4 w-4" />
        {stockFilter === "low" ? "Show All" : "Low Stock"}
      </Button>
    </div>
  );
}
