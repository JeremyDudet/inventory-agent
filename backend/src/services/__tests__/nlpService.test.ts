import { NlpService } from '../nlpService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NlpService', () => {
  let nlpService: NlpService;

  beforeEach(() => {
    nlpService = new NlpService();
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('processWithOpenAI', () => {
    it('should handle valid OpenAI API response', async () => {
      // Mock successful API response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  action: 'add',
                  item: 'milk',
                  quantity: 5,
                  unit: 'gallons',
                  confidence: 0.95
                }
              ])
            }
          }]
        }
      });

      const result = await nlpService.processTranscription('add 5 gallons of milk');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        action: 'add',
        item: 'milk',
        quantity: 5,
        unit: 'gallons',
        confidence: 0.95,
        isComplete: true
      });
    });

    it('should handle malformed OpenAI API response', async () => {
      // Mock malformed API response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: 'invalid json response'
            }
          }]
        }
      });

      const result = await nlpService.processTranscription('add 5 gallons of milk');
      
      // Should fall back to rule-based processing
      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('add');
      expect(result[0].item).toBe('milk');
      expect(result[0].quantity).toBe(5);
      expect(result[0].unit).toBe('gallons');
    });

    it('should handle OpenAI API error', async () => {
      // Mock API error
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      const result = await nlpService.processTranscription('add 5 gallons of milk');
      
      // Should fall back to rule-based processing
      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('add');
      expect(result[0].item).toBe('milk');
      expect(result[0].quantity).toBe(5);
      expect(result[0].unit).toBe('gallons');
    });

    it('should handle empty OpenAI API response', async () => {
      // Mock empty API response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: '[]'
            }
          }]
        }
      });

      const result = await nlpService.processTranscription('add 5 gallons of milk');
      
      // Should fall back to rule-based processing
      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('add');
      expect(result[0].item).toBe('milk');
      expect(result[0].quantity).toBe(5);
      expect(result[0].unit).toBe('gallons');
    });

    it('should handle inventory status statements correctly', async () => {
      // Mock successful API response for inventory status
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  action: 'set',
                  item: 'chocolate syrup',
                  quantity: 40,
                  unit: 'gallons',
                  confidence: 0.95
                }
              ])
            }
          }]
        }
      });

      const result = await nlpService.processTranscription('we have 40 gallons of chocolate syrup');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        action: 'set',
        item: 'chocolate syrup',
        quantity: 40,
        unit: 'gallons',
        confidence: 0.95,
        isComplete: true
      });
    });
  });
}); 