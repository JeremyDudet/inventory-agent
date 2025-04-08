export type SessionStateType =
  | "normal"
  | "waiting_for_clarification"
  | "processing_command"
  | "error";

export interface Command {
  action: "add" | "remove" | "set" | "unknown";
  item: string;
  quantity: number | undefined;
  unit: string;
}

export interface ConfirmationResult {
  type: "voice" | "visual" | "implicit" | "explicit";
  confidence: number;
  reason: string | undefined;
  riskLevel: "low" | "medium" | "high";
  feedbackMode: "silent" | "brief" | "detailed";
  timeoutSeconds?: number;
  suggestedCorrection?: string;
}

export interface PendingConfirmation {
  command: Command;
  confirmationResult: ConfirmationResult;
  speechFeedback?: string | null;
}

export interface SessionState {
  currentState: SessionStateType;
  pendingConfirmation: PendingConfirmation | null;
  isProcessingVoiceCommand: boolean;
}
