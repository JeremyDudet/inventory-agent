export type SessionStateType = 'normal' | 'waiting_for_clarification' | 'processing_command' | 'error';

export interface Command {
  action: string;
  item: string;
  quantity: number;
  unit: string;
}

export interface ConfirmationResult {
  type: 'voice' | 'text';
  confidence: number;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  feedbackMode: 'immediate' | 'delayed';
  timeoutSeconds: number;
  suggestedCorrection?: Command;
}

export interface PendingConfirmation {
  command: Command;
  confirmationResult: ConfirmationResult;
  speechFeedback: string;
}

export interface SessionState {
  currentState: SessionStateType;
  pendingConfirmation: PendingConfirmation | null;
  isProcessingVoiceCommand: boolean;
} 