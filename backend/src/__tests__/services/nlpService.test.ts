import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import axios, { AxiosResponse } from 'axios';
import { NlpService } from '../../services/nlpService';
import { NlpResult } from '../../types/nlp';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NlpService', () => {
  let nlpService: NlpService;

  beforeEach(() => {
    jest.clearAllMocks();
    nlpService = new NlpService();
  });

  describe('processTranscription', () => {
    it('should process a valid add command', async () => {
      const results = await nlpService.processTranscription('add 5 gallons of milk');
      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 5,
        unit: 'gallons',
        confidence: 0.8,
        isComplete: true
      });
    });

    it('should process a valid remove command', async () => {
      const results = await nlpService.processTranscription('remove 3 boxes of cereal');
      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result).toEqual({
        action: 'remove',
        item: 'cereal',
        quantity: 3,
        unit: 'boxes',
        confidence: 0.8,
        isComplete: true
      });
    });

    it('should handle incomplete commands', async () => {
      const results = await nlpService.processTranscription('20 gallons');
      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result).toEqual({
        action: '',
        item: '20 gallons',
        quantity: 20,
        unit: 'gallons',
        confidence: 0.45,
        isComplete: false
      });
    });

    it('should handle invalid commands gracefully', async () => {
      const results = await nlpService.processTranscription('invalid command');
      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result.confidence).toBeLessThan(0.6);
      expect(result.isComplete).toBe(false);
    });

    describe('Command Completeness', () => {
      it('should mark set command as complete when all required fields are present', async () => {
        const results = await nlpService.processTranscription('set pepper cups to 40 sleeves');
        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result).toEqual({
          action: 'set',
          item: 'pepper cups',
          quantity: 40,
          unit: 'sleeves',
          confidence: expect.any(Number),
          isComplete: true
        });
      });

      it('should mark set command as incomplete when quantity is missing', async () => {
        const results = await nlpService.processTranscription('set pepper cups sleeves');
        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result).toEqual({
          action: 'set',
          item: 'pepper cups',
          quantity: undefined,
          unit: 'sleeves',
          confidence: expect.any(Number),
          isComplete: false
        });
      });
    });

    describe('Undo Command Detection', () => {
      it('should detect simple undo command', async () => {
        const results = await nlpService.processTranscription('undo');
        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result).toEqual({
          action: 'undo',
          item: '',
          quantity: undefined,
          unit: '',
          confidence: 0.95,
          isComplete: true,
          type: 'undo'
        });
      });

      it('should detect undo command with item reference', async () => {
        const results = await nlpService.processTranscription('undo the coffee command');
        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result).toEqual({
          action: 'undo',
          item: 'coffee',
          quantity: undefined,
          unit: '',
          confidence: 0.95,
          isComplete: true,
          type: 'undo'
        });
      });

      it('should handle multi-part command with undo', async () => {
        const results = await nlpService.processTranscription('add 10 gallons of milk, undo that');
        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result).toEqual({
          action: 'undo',
          item: 'add 10 gallons of milk',
          quantity: undefined,
          unit: '',
          confidence: 0.95,
          isComplete: true,
          type: 'undo'
        });
      });
    });
  });

  describe('NlpService', () => {
    describe('processTranscription', () => {
      test('should interpret "We have X gallons of Y" as a set command', async () => {
        const nlpService = new NlpService();
        const transcription = 'We have 30 gallons of whole milk';
        
        const results = await nlpService.processTranscription(transcription);
        
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          action: 'set',
          item: 'whole milk',
          quantity: 30,
          unit: 'gallons',
          confidence: expect.any(Number),
          isComplete: true
        });
      });
    });
  }); 

  describe('Multiple Commands Processing', () => {
    it('should process multiple commands in a single transcription', async () => {
      const nlpService = new NlpService();
      const transcription = 'We have 30 gallons of chocolate syrup and 12 packs of paper cups';
      
      const results = await nlpService.processTranscription(transcription);
      
      expect(results).toHaveLength(2);
      
      // First command
      expect(results[0]).toEqual({
        action: 'set',
        item: 'chocolate syrup',
        quantity: 30,
        unit: 'gallons',
        confidence: expect.any(Number),
        isComplete: true
      });
      
      // Second command
      expect(results[1]).toEqual({
        action: 'set',
        item: 'paper cups',
        quantity: 12,
        unit: 'packs',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    it('should handle mixed command types in a single transcription', async () => {
      const results = await nlpService.processTranscription('add 10 gallons of milk, remove 5 bags of coffee, set tea to 20 boxes');
      expect(results).toHaveLength(3);
      
      expect(results[0]).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 10,
        unit: 'gallons',
        confidence: expect.any(Number),
        isComplete: true
      });
      
      expect(results[1]).toEqual({
        action: 'remove',
        item: 'coffee',
        quantity: 5,
        unit: 'bags',
        confidence: expect.any(Number),
        isComplete: true
      });
      
      expect(results[2]).toEqual({
        action: 'set',
        item: 'tea',
        quantity: 20,
        unit: 'boxes',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    it('should handle incomplete commands in a sequence', async () => {
      const results = await nlpService.processTranscription('10 gallons, 5 bags of coffee, 20 boxes');
      expect(results).toHaveLength(3);
      
      expect(results[0]).toEqual({
        action: '',
        item: '10 gallons',
        quantity: 10,
        unit: 'gallons',
        confidence: 0.45,
        isComplete: false
      });
      
      expect(results[1]).toEqual({
        action: 'add',
        item: 'coffee',
        quantity: 5,
        unit: 'bags',
        confidence: expect.any(Number),
        isComplete: true
      });
      
      expect(results[2]).toEqual({
        action: '',
        item: '20 boxes',
        quantity: 20,
        unit: 'boxes',
        confidence: 0.45,
        isComplete: false
      });
    });

    it('should handle undo commands mixed with regular commands', async () => {
      const results = await nlpService.processTranscription('add 10 gallons of milk, undo that, remove 5 bags of coffee');
      expect(results).toHaveLength(3);
      
      expect(results[0]).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 10,
        unit: 'gallons',
        confidence: expect.any(Number),
        isComplete: true
      });
      
      expect(results[1]).toEqual({
        action: 'undo',
        item: 'add 10 gallons of milk',
        quantity: undefined,
        unit: '',
        confidence: 0.95,
        isComplete: true,
        type: 'undo'
      });
      
      expect(results[2]).toEqual({
        action: 'remove',
        item: 'coffee',
        quantity: 5,
        unit: 'bags',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    it('should handle natural language with multiple items and quantities', async () => {
      const results = await nlpService.processTranscription('I need 10 gallons of whole milk, 5 bags of medium roast coffee beans, and 6 boxes of tea');
      expect(results).toHaveLength(3);
      
      expect(results[0]).toEqual({
        action: 'add',
        item: 'whole milk',
        quantity: 10,
        unit: 'gallons',
        confidence: expect.any(Number),
        isComplete: true
      });
      
      expect(results[1]).toEqual({
        action: 'add',
        item: 'medium roast coffee beans',
        quantity: 5,
        unit: 'bags',
        confidence: expect.any(Number),
        isComplete: true
      });
      
      expect(results[2]).toEqual({
        action: 'add',
        item: 'tea',
        quantity: 6,
        unit: 'boxes',
        confidence: expect.any(Number),
        isComplete: true
      });
    });
  });

  describe('OpenAI Processing', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key';
    });

    afterEach(() => {
      delete process.env.OPENAI_API_KEY;
    });

    it('should process multiple commands using OpenAI', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  action: 'add',
                  item: 'milk',
                  quantity: 10,
                  unit: 'gallons',
                  confidence: 0.95
                },
                {
                  action: 'add',
                  item: 'coffee',
                  quantity: 5,
                  unit: 'bags',
                  confidence: 0.95
                }
              ])
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const results = await nlpService.processTranscription('add 10 gallons of milk and 5 bags of coffee');
      
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 10,
        unit: 'gallons',
        confidence: 0.95,
        isComplete: true
      });
      expect(results[1]).toEqual({
        action: 'add',
        item: 'coffee',
        quantity: 5,
        unit: 'bags',
        confidence: 0.95,
        isComplete: true
      });
    });

    it('should handle undo commands using OpenAI', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  action: 'undo',
                  item: '',
                  quantity: undefined,
                  unit: '',
                  confidence: 0.95,
                  type: 'undo'
                }
              ])
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const results = await nlpService.processTranscription('undo the last command');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        action: 'undo',
        item: '',
        quantity: undefined,
        unit: '',
        confidence: 0.95,
        isComplete: true,
        type: 'undo'
      });
    });

    it('should handle mixed command types using OpenAI', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  action: 'add',
                  item: 'milk',
                  quantity: 10,
                  unit: 'gallons',
                  confidence: 0.95
                },
                {
                  action: 'remove',
                  item: 'coffee',
                  quantity: 5,
                  unit: 'bags',
                  confidence: 0.95
                },
                {
                  action: 'set',
                  item: 'tea',
                  quantity: 20,
                  unit: 'boxes',
                  confidence: 0.95
                }
              ])
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const results = await nlpService.processTranscription('add 10 gallons of milk, remove 5 bags of coffee, set tea to 20 boxes');
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 10,
        unit: 'gallons',
        confidence: 0.95,
        isComplete: true
      });
      expect(results[1]).toEqual({
        action: 'remove',
        item: 'coffee',
        quantity: 5,
        unit: 'bags',
        confidence: 0.95,
        isComplete: true
      });
      expect(results[2]).toEqual({
        action: 'set',
        item: 'tea',
        quantity: 20,
        unit: 'boxes',
        confidence: 0.95,
        isComplete: true
      });
    });

    it('should fall back to rule-based processing on OpenAI error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      const results = await nlpService.processTranscription('add 5 gallons of milk');
      
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
  });

  describe('Rule-Based Multiple Command Processing', () => {
    beforeEach(() => {
      // Disable OpenAI to ensure we use rule-based processing
      process.env.OPENAI_API_KEY = '';
    });

    it('should process multiple commands with "and"', async () => {
      const results = await nlpService.processTranscription('add 10 gallons of milk and 5 bags of coffee');
      
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 10,
        unit: 'gallons',
        confidence: 0.95,
        isComplete: true
      });
      expect(results[1]).toEqual({
        action: 'add',
        item: 'coffee',
        quantity: 5,
        unit: 'bags',
        confidence: 0.95,
        isComplete: true
      });
    });

    it('should process multiple commands with commas', async () => {
      const results = await nlpService.processTranscription('add 10 gallons of milk, remove 5 bags of coffee, set tea to 20 boxes');
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 10,
        unit: 'gallons',
        confidence: 0.95,
        isComplete: true
      });
      expect(results[1]).toEqual({
        action: 'remove',
        item: 'coffee',
        quantity: 5,
        unit: 'bags',
        confidence: 0.95,
        isComplete: true
      });
      expect(results[2]).toEqual({
        action: 'set',
        item: 'tea',
        quantity: 20,
        unit: 'boxes',
        confidence: 0.95,
        isComplete: true
      });
    });

    it('should handle undo commands', async () => {
      const results = await nlpService.processTranscription('undo the last command');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        action: '',
        item: '',
        quantity: undefined,
        unit: 'units',
        confidence: 0.95,
        isComplete: true,
        type: 'undo'
      });
    });

    it('should handle incomplete commands', async () => {
      const results = await nlpService.processTranscription('add 10 gallons, remove coffee, set tea');
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        action: 'add',
        item: '10 gallons',
        quantity: 10,
        unit: 'gallons',
        confidence: 0.6,
        isComplete: false
      });
      expect(results[1]).toEqual({
        action: 'remove',
        item: 'coffee',
        quantity: undefined,
        unit: 'units',
        confidence: 0.6,
        isComplete: false
      });
      expect(results[2]).toEqual({
        action: 'set',
        item: 'tea',
        quantity: undefined,
        unit: 'units',
        confidence: 0.6,
        isComplete: false
      });
    });

    it('should handle natural language with multiple items', async () => {
      const results = await nlpService.processTranscription('I need 10 gallons of whole milk, 5 bags of medium roast coffee beans, and 6 boxes of tea');
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        action: 'add',
        item: 'whole milk',
        quantity: 10,
        unit: 'gallons',
        confidence: 0.95,
        isComplete: true
      });
      expect(results[1]).toEqual({
        action: 'add',
        item: 'medium roast coffee beans',
        quantity: 5,
        unit: 'bags',
        confidence: 0.95,
        isComplete: true
      });
      expect(results[2]).toEqual({
        action: 'add',
        item: 'tea',
        quantity: 6,
        unit: 'boxes',
        confidence: 0.95,
        isComplete: true
      });
    });
  });

  describe('Context Merging with Multiple Commands', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = '';
    });

    it('should maintain context across incomplete commands', async () => {
      const results = await nlpService.processTranscription('add 10 gallons');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        action: 'add',
        item: '10 gallons',
        quantity: 10,
        unit: 'gallons',
        confidence: 0.6,
        isComplete: false
      });

      // Second command should merge with previous context
      const nextResults = await nlpService.processTranscription('of milk');
      
      expect(nextResults).toHaveLength(1);
      expect(nextResults[0]).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 10,
        unit: 'gallons',
        confidence: 0.7,
        isComplete: true
      });
    });

    it('should handle undo commands without context merging', async () => {
      const results = await nlpService.processTranscription('add 10 gallons of milk, undo that');
      
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 10,
        unit: 'gallons',
        confidence: 0.95,
        isComplete: true
      });
      expect(results[1]).toEqual({
        action: '',
        item: '',
        quantity: undefined,
        unit: 'units',
        confidence: 0.95,
        isComplete: true,
        type: 'undo'
      });
    });

    it('should clear context after complete commands', async () => {
      // First command - incomplete
      const firstResults = await nlpService.processTranscription('add 10 gallons');
      
      expect(firstResults).toHaveLength(1);
      expect(firstResults[0].isComplete).toBe(false);

      // Second command - complete
      const secondResults = await nlpService.processTranscription('of milk');
      
      expect(secondResults).toHaveLength(1);
      expect(secondResults[0].isComplete).toBe(true);

      // Third command - should not use previous context
      const thirdResults = await nlpService.processTranscription('remove 5 bags');
      
      expect(thirdResults).toHaveLength(1);
      expect(thirdResults[0]).toEqual({
        action: 'remove',
        item: '5 bags',
        quantity: 5,
        unit: 'bags',
        confidence: 0.6,
        isComplete: false
      });
    });

    it('should handle mixed complete and incomplete commands', async () => {
      const results = await nlpService.processTranscription('add 10 gallons, remove 5 bags of coffee, set tea');
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        action: 'add',
        item: '10 gallons',
        quantity: 10,
        unit: 'gallons',
        confidence: 0.6,
        isComplete: false
      });
      expect(results[1]).toEqual({
        action: 'remove',
        item: 'coffee',
        quantity: 5,
        unit: 'bags',
        confidence: 0.95,
        isComplete: true
      });
      expect(results[2]).toEqual({
        action: 'set',
        item: 'tea',
        quantity: undefined,
        unit: 'units',
        confidence: 0.6,
        isComplete: false
      });

      // Next command should only merge with the incomplete set command
      const nextResults = await nlpService.processTranscription('to 20 boxes');
      
      expect(nextResults).toHaveLength(1);
      expect(nextResults[0]).toEqual({
        action: 'set',
        item: 'tea',
        quantity: 20,
        unit: 'boxes',
        confidence: 0.7,
        isComplete: true
      });
    });
  });
}); 