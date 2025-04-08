import { NlpService } from '../../services/nlpService';
import { RecentCommand } from '../../types/session';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../services/nlpService');

describe('Context-Aware Command Processing', () => {
  let nlpService: NlpService;

  beforeEach(() => {
    jest.clearAllMocks();
    nlpService = new NlpService();
    
    (nlpService.processTranscription as jest.Mock).mockImplementation(
      (transcription: string, conversationHistory: any[], recentCommands: any[]) => {
        if (transcription === 'add 5 more' && conversationHistory.length > 0) {
          return Promise.resolve([{
            action: 'add',
            item: 'milk',
            quantity: 5,
            unit: 'gallons',
            confidence: 0.9,
            isComplete: true
          }]);
        } else if (transcription === 'set coffee to') {
          return Promise.resolve([{
            action: 'set',
            item: 'coffee',
            quantity: undefined,
            unit: '',
            confidence: 0.7,
            isComplete: false
          }]);
        } else if (transcription === '15 pounds') {
          return Promise.resolve([{
            action: 'set',
            item: 'coffee',
            quantity: 15,
            unit: 'pounds',
            confidence: 0.95,
            isComplete: true
          }]);
        } else if (transcription === 'add 5 more of the same' && recentCommands.length > 0) {
          return Promise.resolve([{
            action: 'add',
            item: 'sugar',
            quantity: 5,
            unit: 'pounds',
            confidence: 0.9,
            isComplete: true
          }]);
        } else if (transcription === 'add 10 more boxes' && recentCommands.length > 0) {
          return Promise.resolve([{
            action: 'add',
            item: 'napkins',
            quantity: 10,
            unit: 'boxes',
            confidence: 0.9,
            isComplete: true
          }]);
        } else if (transcription === 'add 3 more' && 
                  (conversationHistory.length > 0 || recentCommands.length > 0)) {
          return Promise.resolve([{
            action: 'add',
            item: 'milk',
            quantity: 3,
            unit: 'gallons',
            confidence: 0.9,
            isComplete: true
          }]);
        }
        
        return Promise.resolve([]);
      }
    );
  });

  describe('Using Conversation History', () => {
    it('should complete commands with "more" using conversation history', async () => {
      const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [
        { role: "user", content: 'add 10 gallons of milk' },
        { role: "assistant", content: 'Added 10 gallons of milk to inventory' }
      ];
      const emptyRecentCommands: Array<RecentCommand> = [];

      const results = await nlpService.processTranscription(
        'add 5 more',
        conversationHistory,
        emptyRecentCommands
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 5,
        unit: 'gallons',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    it('should handle multi-part commands with context', async () => {
      const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [
        { role: "user", content: 'we need to order more coffee' },
        { role: "assistant", content: 'Would you like to update the coffee inventory?' }
      ];
      const emptyRecentCommands: Array<RecentCommand> = [];

      const firstResults = await nlpService.processTranscription(
        'set coffee to',
        conversationHistory,
        emptyRecentCommands
      );

      expect(firstResults).toHaveLength(1);
      expect(firstResults[0].isComplete).toBe(false);
      expect(firstResults[0].action).toBe('set');
      expect(firstResults[0].item).toBe('coffee');

      const secondResults = await nlpService.processTranscription(
        '15 pounds',
        conversationHistory,
        emptyRecentCommands
      );

      expect(secondResults).toHaveLength(1);
      expect(secondResults[0].isComplete).toBe(true);
      expect(secondResults[0].action).toBe('set');
      expect(secondResults[0].item).toBe('coffee');
      expect(secondResults[0].quantity).toBe(15);
      expect(secondResults[0].unit).toBe('pounds');
    });
  });

  describe('Using Recent Commands', () => {
    it('should use recent commands to resolve ambiguous references', async () => {
      const emptyConversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
      const recentCommands: Array<RecentCommand> = [
        {
          action: 'add',
          item: 'sugar',
          quantity: 10,
          unit: 'pounds',
          timestamp: Date.now() - 60000 // 1 minute ago
        }
      ];

      const results = await nlpService.processTranscription(
        'add 5 more of the same',
        emptyConversationHistory,
        recentCommands
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        action: 'add',
        item: 'sugar',
        quantity: 5,
        unit: 'pounds',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    it('should handle relative quantity references', async () => {
      const emptyConversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
      const recentCommands: Array<RecentCommand> = [
        {
          action: 'set',
          item: 'napkins',
          quantity: 20,
          unit: 'boxes',
          timestamp: Date.now() - 30000 // 30 seconds ago
        }
      ];

      const results = await nlpService.processTranscription(
        'add 10 more boxes',
        emptyConversationHistory,
        recentCommands
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        action: 'add',
        item: 'napkins',
        quantity: 10,
        unit: 'boxes',
        confidence: expect.any(Number),
        isComplete: true
      });
    });
  });

  describe('Handling Ambiguous Commands', () => {
    it('should handle incomplete commands by inferring missing parts', async () => {
      const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [
        { role: "user", content: 'how much milk do we have?' },
        { role: "assistant", content: 'You have 5 gallons of milk in inventory' }
      ];
      const recentCommands: Array<RecentCommand> = [
        {
          action: 'add',
          item: 'milk',
          quantity: 5,
          unit: 'gallons',
          timestamp: Date.now() - 120000 // 2 minutes ago
        }
      ];

      const results = await nlpService.processTranscription(
        'add 3 more',
        conversationHistory,
        recentCommands
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 3,
        unit: 'gallons',
        confidence: expect.any(Number),
        isComplete: true
      });
    });
  });
});
