// frontend/src/components/InventoryGrid.tsx
import React, { useState } from 'react';
import InventoryCard from './InventoryCard';

// Define the inventory item type
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  threshold?: number;
  lastUpdated: string;
}

interface InventoryGridProps {
  items: InventoryItem[];
  onItemSelect: (id: string) => void;
  onItemUpdate?: (id: string) => void;
  filterCategory?: string;
  searchTerm?: string;
}

/**
 * InventoryGrid component displays a responsive grid of inventory items
 * with filtering and search capabilities
 */
const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  onItemSelect,
  onItemUpdate,
  filterCategory,
  searchTerm = ''
}) => {
  // Filter items based on category and search term
  const filteredItems = items.filter(item => {
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Handle item selection
  const handleSelect = (id: string) => {
    onItemSelect(id);
  };

  return (
    <div className="w-full">
      {filteredItems.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">No inventory items found</h3>
          <p className="text-base-content/70 mt-2">
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <InventoryCard
              key={item.id}
              id={item.id}
              name={item.name}
              quantity={item.quantity}
              unit={item.unit}
              category={item.category}
              threshold={item.threshold}
              lastUpdated={item.lastUpdated}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryGrid; 