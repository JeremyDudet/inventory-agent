export interface NlpResult {
  action: string;
  item: string;
  quantity: number | undefined;
  unit: string;
  confidence: number;
  isComplete: boolean;
  type?: 'undo';
} 