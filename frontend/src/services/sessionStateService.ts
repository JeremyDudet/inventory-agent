import { SessionState, SessionStateType, Command, ConfirmationResult, PendingConfirmation } from '../types/session';

class SessionStateService {
  private state: SessionState = {
    currentState: 'normal',
    pendingConfirmation: null,
    isProcessingVoiceCommand: false
  };

  private subscribers: ((state: SessionState) => void)[] = [];

  getState(): SessionState {
    return { ...this.state };
  }

  setState(newState: Partial<SessionState>): void {
    this.state = {
      ...this.state,
      ...newState
    };
    this.notifySubscribers();
  }

  updateState(updater: (state: SessionState) => Partial<SessionState>): void {
    const updates = updater(this.state);
    this.setState(updates);
  }

  resetState(): void {
    this.setState({
      currentState: 'normal',
      pendingConfirmation: null,
      isProcessingVoiceCommand: false
    });
  }

  subscribe(callback: (state: SessionState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.getState()));
  }
}

export const sessionStateService = new SessionStateService(); 