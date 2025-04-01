export interface ActionLog {
  type: 'add' | 'remove' | 'set';
  itemId: string;
  quantity: number | undefined;
  previousQuantity?: number;
  timestamp?: Date;
} 