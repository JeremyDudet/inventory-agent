import { SessionState, SessionStateType, RecentCommand } from "../../types/session";
import { jest } from '@jest/globals';

/**
 * Mock implementation of SessionStateService for testing
 */
export class MockSessionStateService {
  private mockState: SessionState = {
    currentState: "normal",
    pendingConfirmation: null,
    isProcessingVoiceCommand: false,
    conversationHistory: [],
    recentCommands: []
  };

  getState = jest.fn(() => ({ ...this.mockState }));
  getStateType = jest.fn(() => this.mockState.currentState);
  getPendingConfirmation = jest.fn(() => this.mockState.pendingConfirmation);
  getProcessingVoiceCommand = jest.fn(() => this.mockState.isProcessingVoiceCommand);
  setState = jest.fn();
  updateState = jest.fn();
  resetState = jest.fn();
  onStateChange = jest.fn(() => () => {});
  setStateType = jest.fn();
  setPendingConfirmation = jest.fn();
  setProcessingVoiceCommand = jest.fn();
  addRecentCommand = jest.fn();
  getRecentCommands = jest.fn(() => []);
  addUserMessage = jest.fn();
  addAssistantMessage = jest.fn();
}
