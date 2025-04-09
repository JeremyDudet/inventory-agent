import { SessionStateService } from '../../services/sessionStateService';
import { SessionState } from '../../types/session';

describe('SessionStateService', () => {
  let sessionStateService: SessionStateService;

  beforeEach(() => {
    sessionStateService = new SessionStateService();
  });

  describe('getState', () => {
    it('should return the current state', () => {
      const state = sessionStateService.getState();
      expect(state).toBeDefined();
      expect(state.currentState).toBe('normal');
      expect(state.pendingConfirmation).toBeNull();
      expect(state.isProcessingVoiceCommand).toBe(false);
    });
  });

  describe('setState', () => {
    it('should update the state', () => {
      const newState: SessionState = {
        currentState: 'waiting_for_clarification',
        pendingConfirmation: {
          command: {
            action: 'add',
            item: 'coffee',
            quantity: 5,
            unit: 'pounds'
          },
          confirmationResult: {
            type: 'voice',
            confidence: 0.8,
            reason: 'Test reason',
            riskLevel: 'low',
            feedbackMode: 'brief',
            timeoutSeconds: 5
          },
          speechFeedback: 'Test feedback'
        },
        isProcessingVoiceCommand: true,
        conversationHistory: [],
        recentCommands: []
      };

      sessionStateService.setState(newState);
      const state = sessionStateService.getState();
      expect(state).toEqual(newState);
    });

    it('should emit state change event', () => {
      const mockCallback = jest.fn();
      sessionStateService.onStateChange(mockCallback);

      const newState: SessionState = {
        currentState: 'waiting_for_clarification',
        pendingConfirmation: null,
        isProcessingVoiceCommand: true,
        conversationHistory: [],
        recentCommands: []
      };

      sessionStateService.setState(newState);
      expect(mockCallback).toHaveBeenCalledWith(newState);
    });
  });

  describe('updateState', () => {
    it('should partially update the state', () => {
      sessionStateService.updateState({
        currentState: 'waiting_for_clarification'
      });

      const state = sessionStateService.getState();
      expect(state.currentState).toBe('waiting_for_clarification');
      expect(state.pendingConfirmation).toBeNull();
      expect(state.isProcessingVoiceCommand).toBe(false);
    });

    it('should preserve existing state values', () => {
      const initialState: SessionState = {
        currentState: 'normal',
        pendingConfirmation: {
          command: {
            action: 'add',
            item: 'coffee',
            quantity: 5,
            unit: 'pounds'
          },
          confirmationResult: {
            type: 'voice',
            confidence: 0.8,
            reason: 'Test reason',
            riskLevel: 'low',
            feedbackMode: 'brief',
            timeoutSeconds: 5
          },
          speechFeedback: 'Test feedback'
        },
        isProcessingVoiceCommand: true,
        conversationHistory: [],
        recentCommands: []
      };

      sessionStateService.setState(initialState);

      sessionStateService.updateState({
        currentState: 'waiting_for_clarification'
      });

      const state = sessionStateService.getState();
      expect(state.currentState).toBe('waiting_for_clarification');
      expect(state.pendingConfirmation).toEqual(initialState.pendingConfirmation);
      expect(state.isProcessingVoiceCommand).toBe(true);
    });
  });

  describe('resetState', () => {
    it('should reset state to initial values', () => {
      const initialState: SessionState = {
        currentState: 'normal',
        pendingConfirmation: null,
        isProcessingVoiceCommand: false,
        conversationHistory: [],
        recentCommands: []
      };

      // Set some non-initial state
      sessionStateService.setState({
        currentState: 'waiting_for_clarification',
        pendingConfirmation: {
          command: {
            action: 'add',
            item: 'coffee',
            quantity: 5,
            unit: 'pounds'
          },
          confirmationResult: {
            type: 'voice',
            confidence: 0.8,
            reason: 'Test reason',
            riskLevel: 'low',
            feedbackMode: 'brief',
            timeoutSeconds: 5
          },
          speechFeedback: 'Test feedback'
        },
        isProcessingVoiceCommand: true,
        conversationHistory: [],
        recentCommands: []
      });

      sessionStateService.resetState();
      expect(sessionStateService.getState()).toEqual(initialState);
    });
  });

  describe('event handling', () => {
    it('should handle multiple state change listeners', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      sessionStateService.onStateChange(mockCallback1);
      sessionStateService.onStateChange(mockCallback2);

      const newState: SessionState = {
        currentState: 'waiting_for_clarification',
        pendingConfirmation: null,
        isProcessingVoiceCommand: true,
        conversationHistory: [],
        recentCommands: []
      };

      sessionStateService.setState(newState);
      expect(mockCallback1).toHaveBeenCalledWith(newState);
      expect(mockCallback2).toHaveBeenCalledWith(newState);
    });

    it('should allow removing state change listeners', () => {
      const mockCallback = jest.fn();
      const removeListener = sessionStateService.onStateChange(mockCallback);

      const newState: SessionState = {
        currentState: 'waiting_for_clarification',
        pendingConfirmation: null,
        isProcessingVoiceCommand: true,
        conversationHistory: [],
        recentCommands: []
      };

      sessionStateService.setState(newState);
      expect(mockCallback).toHaveBeenCalledWith(newState);

      removeListener();
      sessionStateService.setState({
        currentState: 'normal',
        pendingConfirmation: null,
        isProcessingVoiceCommand: false,
        conversationHistory: [],
        recentCommands: []
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });
});    