// frontend/src/components/InventoryGrid.tsx
import React from "react";
import { useInventoryStore } from "../stores/inventoryStore";

// Define the inventory item type
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  threshold?: number;
  lastupdated: string;
}

interface InventoryGridProps {}

const InventoryGrid: React.FC<InventoryGridProps> = () => {
  const items = useInventoryStore((state) => state.items);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        return (
          <div key={item.id}>
            <p>{item.name}</p>
            <p>{item.quantity}</p>
            <p>{item.unit}</p>
          </div>
        );
      })}
    </div>
  );
};

export default InventoryGrid;
