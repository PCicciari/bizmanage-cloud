
import { Building, Package, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InventoryItem } from "@/types/database.types";

interface InventoryCardProps {
  item: InventoryItem;
  branchName: string;
  lowStockThreshold: number;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function InventoryCard({
  item,
  branchName,
  lowStockThreshold,
  onEdit,
  onDelete,
}: InventoryCardProps) {
  return (
    <Card className={item.quantity <= lowStockThreshold ? "border-red-500" : ""}>
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
            {item.quantity <= lowStockThreshold && (
              <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-1 rounded">
                Low Stock
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Price: ${item.price.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">
            Reorder Point: {item.reorder_point}
          </p>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <Building className="h-4 w-4" />
            {branchName}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDelete(item.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
