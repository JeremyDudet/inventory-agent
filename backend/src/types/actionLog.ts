export interface ActionLog {
  type: 'add' | 'remove' | 'set';
  itemId: string;
  quantity: number;
  previousQuantity?: number;
  timestamp?: Date;
} 