export interface InventoryUpdate {
  action: 'add' | 'remove' | 'set';
  item: string;
  quantity: number;
  unit: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lastUpdated: Date;
} 