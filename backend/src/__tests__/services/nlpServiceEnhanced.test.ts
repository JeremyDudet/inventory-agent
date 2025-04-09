import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NlpService } from '../../services/nlpService';
import { NlpResult } from '../../types/nlp';
import { createNlpResult } from '../utils/testFixtures';
import { MockSessionStateService } from '../mocks/sessionStateService';
import { RecentCommand } from '../../types/session';
import { ContextProvider } from '../../types/context';

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  };
});

describe('Enhanced NlpService Tests', () => {
  let nlpService: NlpService;
  let mockOpenAI: any;
  let mockSessionState: MockSessionStateService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    nlpService = new NlpService();
    
    mockOpenAI = (nlpService as any).openai;
    
    mockSessionState = new MockSessionStateService();
    
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify([
              createNlpResult({
                action: 'add',
                item: 'milk',
                quantity: 5,
                unit: 'gallons',
                confidence: 0.95,
                isComplete: true
              })
            ])
          }
        }
      ]
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('processTranscription', () => {
    it('should process a simple command correctly', async () => {
      const transcription = 'add 5 gallons of milk';
      const conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
      const recentCommands: RecentCommand[] = [];
      
      const results = await nlpService.processTranscription(transcription, conversationHistory, recentCommands);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(expect.objectContaining({
        action: 'add',
        item: 'milk',
        quantity: 5,
        unit: 'gallons',
        confidence: 0.95,
        isComplete: true
      }));
      
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining(transcription)
            })
          ])
        })
      );
    });
    
    it('should handle multiple commands in a single transcription', async () => {
      const transcription = 'add 5 gallons of milk and remove 2 boxes of cereal';
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                createNlpResult({
                  action: 'add',
                  item: 'milk',
                  quantity: 5,
                  unit: 'gallons',
                  confidence: 0.95,
                  isComplete: true
                }),
                createNlpResult({
                  action: 'remove',
                  item: 'cereal',
                  quantity: 2,
                  unit: 'boxes',
                  confidence: 0.92,
                  isComplete: true
                })
              ])
            }
          }
        ]
      });
      
      const results = await nlpService.processTranscription(transcription, [], []);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(expect.objectContaining({
        action: 'add',
        item: 'milk',
        quantity: 5,
        unit: 'gallons'
      }));
      expect(results[1]).toEqual(expect.objectContaining({
        action: 'remove',
        item: 'cereal',
        quantity: 2,
        unit: 'boxes'
      }));
    });
    
    it('should handle incomplete commands', async () => {
      const transcription = 'add some';
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                createNlpResult({
                  action: 'add',
                  item: '',
                  quantity: 0,
                  unit: '',
                  confidence: 0.6,
                  isComplete: false
                })
              ])
            }
          }
        ]
      });
      
      const results = await nlpService.processTranscription(transcription, [], []);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(expect.objectContaining({
        action: 'add',
        isComplete: false,
        confidence: 0.6
      }));
    });
    
    it('should use conversation history for context', async () => {
      const transcription = 'make it 10';
      const conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [
        { role: 'user', content: 'add 5 gallons of milk' },
        { role: 'assistant', content: 'Added 5 gallons of milk' }
      ];
      const recentCommands: RecentCommand[] = [
        {
          action: 'add',
          item: 'milk',
          quantity: 5,
          unit: 'gallons',
          timestamp: Date.now()
        }
      ];
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                createNlpResult({
                  action: 'update',
                  item: 'milk',
                  quantity: 10,
                  unit: 'gallons',
                  confidence: 0.9,
                  isComplete: true
                })
              ])
            }
          }
        ]
      });
      
      const results = await nlpService.processTranscription(transcription, conversationHistory, recentCommands);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(expect.objectContaining({
        action: 'update',
        item: 'milk',
        quantity: 10,
        unit: 'gallons'
      }));
      
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'add 5 gallons of milk'
            }),
            expect.objectContaining({
              role: 'assistant',
              content: 'Added 5 gallons of milk'
            })
          ])
        })
      );
    });
    
    it('should handle API errors gracefully', async () => {
      const transcription = 'add 5 gallons of milk';
      
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));
      
      await expect(nlpService.processTranscription(transcription, [], []))
        .rejects.toThrow('Failed to process transcription');
    });
    
    it('should handle invalid JSON responses', async () => {
      const transcription = 'add 5 gallons of milk';
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'This is not valid JSON'
            }
          }
        ]
      });
      
      await expect(nlpService.processTranscription(transcription, [], []))
        .rejects.toThrow('Failed to parse NLP response');
    });
    
    it('should use context provider when set', async () => {
      const transcription = 'add 5 gallons of milk';
      
      const mockGetConversationHistory = jest.fn();
      const mockGetRecentCommands = jest.fn();
      const mockAddToHistory = jest.fn();
      const mockAddCommand = jest.fn();
      
      mockGetConversationHistory.mockReturnValue([
        { role: 'user', content: 'What do we have in stock?' },
        { role: 'assistant', content: 'We have milk, eggs, and bread.' }
      ]);
      mockGetRecentCommands.mockReturnValue([]);
      
      const mockContextProvider = {
        getConversationHistory: mockGetConversationHistory,
        getRecentCommands: mockGetRecentCommands,
        addToHistory: mockAddToHistory,
        addCommand: mockAddCommand
      };
      
      nlpService.setContextProvider(mockContextProvider as unknown as ContextProvider);
      
      await nlpService.processTranscription(transcription, [], []);
      
      expect(mockGetConversationHistory).toHaveBeenCalled();
      
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('What do we have in stock?')
            }),
            expect.objectContaining({
              role: 'assistant',
              content: expect.stringContaining('We have milk, eggs, and bread.')
            })
          ])
        })
      );
    });
    
    it('should handle empty transcriptions', async () => {
      const transcription = '';
      
      const results = await nlpService.processTranscription(transcription, [], []);
      
      expect(results).toEqual([]);
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
    });
    
    it('should set confidence to 0 for unrecognized actions', async () => {
      const transcription = 'do something weird';
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  action: 'unknown_action',
                  item: 'something',
                  quantity: null,
                  unit: null,
                  isComplete: false
                }
              ])
            }
          }
        ]
      });
      
      const results = await nlpService.processTranscription(transcription, [], []);
      
      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(0);
      expect(results[0].action).toBe('unknown_action');
    });
  });
});
