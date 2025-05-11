// backend/src/services/sessionStateService.ts
import {
  SessionState,
  SessionStateType,
  RecentCommand,
} from "@/types";

export class SessionStateService {
  private state: SessionState;
  private stateChangeListeners: ((state: SessionState) => void)[] = [];

  constructor() {
    this.state = {
      currentState: "normal",
      pendingConfirmation: null,
      isProcessingVoiceCommand: false,
      conversationHistory: [],
      recentCommands: [],
    };
  }

  /**
   * Get the current session state
   */
  getState(): SessionState {
    return { ...this.state };
  }

  /**
   * Get the current state type
   */
  getStateType(): SessionStateType {
    return this.state.currentState;
  }

  /**
   * Get the pending confirmation
   */
  getPendingConfirmation(): SessionState["pendingConfirmation"] {
    return this.state.pendingConfirmation;
  }

  /**
   * Get the voice command processing status
   */
  getProcessingVoiceCommand(): boolean {
    return this.state.isProcessingVoiceCommand;
  }

  /**
   * Set the entire session state
   */
  setState(newState: SessionState): void {
    this.state = { ...newState };
    this.notifyStateChange();
  }

  /**
   * Update part of the session state
   */
  updateState(partialState: Partial<SessionState>): void {
    this.state = {
      ...this.state,
      ...partialState,
    };
    this.notifyStateChange();
  }

  /**
   * Reset the session state to initial values
   */
  resetState(): void {
    this.state = {
      currentState: "normal",
      pendingConfirmation: null,
      isProcessingVoiceCommand: false,
      conversationHistory: [],
      recentCommands: [],
    };
    this.notifyStateChange();
  }

  /**
   * Subscribe to state changes
   * @returns Function to unsubscribe
   */
  onStateChange(callback: (state: SessionState) => void): () => void {
    this.stateChangeListeners.push(callback);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Notify all state change listeners
   */
  private notifyStateChange(): void {
    const currentState = this.getState();
    this.stateChangeListeners.forEach((callback) => callback(currentState));
  }

  /**
   * Set the current state type
   */
  setStateType(type: SessionStateType): void {
    this.updateState({ currentState: type });
  }

  /**
   * Set pending confirmation
   */
  setPendingConfirmation(
    confirmation: SessionState["pendingConfirmation"]
  ): void {
    this.updateState({ pendingConfirmation: confirmation });
  }

  /**
   * Set voice command processing status
   */
  setProcessingVoiceCommand(isProcessing: boolean): void {
    this.updateState({ isProcessingVoiceCommand: isProcessing });
  }

  addRecentCommand(command: RecentCommand): void {
    this.state.recentCommands.push(command);
    // Keep only the last 2 commands to avoid excessive memory use
    if (this.state.recentCommands.length > 2) {
      this.state.recentCommands.shift();
    }
    this.notifyStateChange();
  }

  // Add a getter for recent commands
  getRecentCommands(): Array<RecentCommand> {
    return [...this.state.recentCommands];
  }

  addUserMessage(content: string): void {
    this.state.conversationHistory.push({ role: "user", content });
    this.trimConversationHistory();
    this.notifyStateChange();
  }

  addAssistantMessage(content: string): void {
    this.state.conversationHistory.push({ role: "assistant", content });
    this.trimConversationHistory();
    this.notifyStateChange();
  }

  private trimConversationHistory(): void {
    const maxHistory = 8; // Last 4 turns (user + assistant)
    while (this.state.conversationHistory.length > maxHistory) {
      this.state.conversationHistory.shift();
    }
  }
}
