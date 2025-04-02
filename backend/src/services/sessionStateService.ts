// backend/src/services/sessionStateService.ts
import { SessionState, SessionStateType } from '../types/session';

export class SessionStateService {
  private state: SessionState;
  private stateChangeListeners: ((state: SessionState) => void)[] = [];

  constructor() {
    this.state = {
      currentState: 'normal',
      pendingConfirmation: null,
      isProcessingVoiceCommand: false
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
  getPendingConfirmation(): SessionState['pendingConfirmation'] {
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
      ...partialState
    };
    this.notifyStateChange();
  }

  /**
   * Reset the session state to initial values
   */
  resetState(): void {
    this.state = {
      currentState: 'normal',
      pendingConfirmation: null,
      isProcessingVoiceCommand: false
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
      this.stateChangeListeners = this.stateChangeListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all state change listeners
   */
  private notifyStateChange(): void {
    const currentState = this.getState();
    this.stateChangeListeners.forEach(callback => callback(currentState));
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
  setPendingConfirmation(confirmation: SessionState['pendingConfirmation']): void {
    this.updateState({ pendingConfirmation: confirmation });
  }

  /**
   * Set voice command processing status
   */
  setProcessingVoiceCommand(isProcessing: boolean): void {
    this.updateState({ isProcessingVoiceCommand: isProcessing });
  }
} 