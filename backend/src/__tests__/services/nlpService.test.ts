import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import axios, { AxiosResponse } from 'axios';
import NlpService from '../../services/nlpService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NLP Service', () => {
  let nlpService: typeof NlpService;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    jest.clearAllMocks();
    nlpService = NlpService;
  });

  describe('processTranscription', () => {
    it('should process add command', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                action: 'add',
                item: 'coffee',
                quantity: 5,
                unit: 'pounds',
                confidence: 0.95
              })
            }
          }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

      const result = await nlpService.processTranscription('add 5 pounds of coffee');
      
      expect(result).toEqual({
        action: 'add',
        item: 'coffee',
        quantity: 5,
        unit: 'pounds',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    it('should process set command', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                action: 'set',
                item: 'coffee beans',
                quantity: 10,
                unit: 'pounds',
                confidence: 0.95
              })
            }
          }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

      const result = await nlpService.processTranscription('set coffee beans to 10 pounds');
      
      expect(result).toEqual({
        action: 'set',
        item: 'coffee beans',
        quantity: 10,
        unit: 'pounds',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    it('should handle conversational commands', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                action: 'add',
                item: 'coffee',
                quantity: 5,
                unit: 'pounds',
                confidence: 0.85
              })
            }
          }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

      const result = await nlpService.processTranscription('I need to add 5 pounds of coffee');
      
      expect(result).toEqual({
        action: 'add',
        item: 'coffee',
        quantity: 5,
        unit: 'pounds',
        confidence: expect.any(Number),
        isComplete: true
      });
      expect(result.confidence).toBeGreaterThan(0.75);
    });

    it('should infer add action when not explicitly stated', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                action: 'add',
                item: 'coffee',
                quantity: 2,
                unit: 'pounds',
                confidence: 0.85
              })
            }
          }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

      const result = await nlpService.processTranscription('2 pounds of coffee');
      
      expect(result).toEqual({
        action: 'add',
        item: 'coffee',
        quantity: 2,
        unit: 'pounds',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    it('should handle invalid transcription', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                action: 'unknown',
                item: 'unknown',
                quantity: 1,
                unit: 'units',
                confidence: 0.1
              })
            }
          }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

      const result = await nlpService.processTranscription('blah blah blah');
      
      expect(result).toEqual({
        action: '',
        item: '',
        quantity: 1,
        unit: 'units',
        confidence: expect.any(Number),
        isComplete: false
      });
    });

    describe('OpenAI Integration', () => {
      it('should use OpenAI when API key is available', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'add',
                  item: 'coffee',
                  quantity: 2,
                  unit: 'pounds',
                  confidence: 0.95
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('add 2 pounds of coffee');
        expect(mockedAxios.post).toHaveBeenCalled();
        expect(result.confidence).toBeGreaterThan(0.7);
        expect(result.isComplete).toBe(true);
      });

      it('should fall back to rule-based when OpenAI fails', async () => {
        // Temporarily silence console.error
        const originalError = console.error;
        console.error = jest.fn();

        mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

        const result = await nlpService.processTranscription('add 2 gal of milk');
        
        expect(result).toEqual({
          action: 'add',
          item: 'milk',
          quantity: 2,
          unit: 'gallons',
          confidence: expect.any(Number),
          isComplete: true
        });

        // Restore console.error
        console.error = originalError;
      });
    });

    describe('Item Name Cleaning', () => {
      it('should remove filler words', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'add',
                  item: 'coffee beans',
                  quantity: 1,
                  unit: 'pounds',
                  confidence: 0.9
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('please add some more of the coffee beans');
        
        expect(result.item).toBe('coffee beans');
      });

      it('should remove action words from item name', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'add',
                  item: 'coffee beans',
                  quantity: 1,
                  unit: 'pounds',
                  confidence: 0.9
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('add coffee add beans');
        
        expect(result.item).toBe('coffee beans');
      });

      it('should handle items with spaces', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'add',
                  item: 'almond milk',
                  quantity: 1,
                  unit: 'gallons',
                  confidence: 0.9
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('add almond milk');
        
        expect(result.item).toBe('almond milk');
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid numbers gracefully', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'add',
                  item: 'coffee',
                  quantity: 1,
                  unit: 'pounds',
                  confidence: 0.9
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('add zero point five pounds of coffee');
        
        expect(result.quantity).toBe(1); // Default to 1 for unparseable numbers
      });

      it('should handle missing quantities gracefully', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'add',
                  item: 'coffee',
                  quantity: 1,
                  unit: 'pounds',
                  confidence: 0.9
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('add coffee');
        
        expect(result.quantity).toBe(1); // Default quantity
        expect(result.unit).toBe('pounds'); // Default unit for coffee
      });

      it('should handle missing units gracefully', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'add',
                  item: 'coffee',
                  quantity: 5,
                  unit: 'pounds',
                  confidence: 0.9
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('add 5 coffee');
        
        expect(result.unit).toBe('pounds'); // Default unit for coffee
      });
    });

    describe('Command Completeness', () => {
      it('should mark command as incomplete when action is missing', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: '',
                  item: 'coffee',
                  quantity: 1,
                  unit: 'units',
                  confidence: 0.8
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('coffee');
        
        expect(result).toEqual({
          action: '',
          item: 'coffee',
          quantity: 1,
          unit: 'units',
          isComplete: false,
          confidence: expect.any(Number)
        });
      });

      it('should mark command as complete when all required fields are present', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'add',
                  item: 'coffee',
                  quantity: 2,
                  unit: 'pounds',
                  confidence: 0.8
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('add 2 pounds of coffee');
        
        expect(result).toEqual({
          action: 'add',
          item: 'coffee',
          quantity: 2,
          unit: 'pounds',
          isComplete: true,
          confidence: expect.any(Number)
        });
      });

      it('should mark set command as complete when all required fields are present', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'set',
                  item: 'pepper cups',
                  quantity: 40,
                  unit: 'sleeves',
                  confidence: 0.95
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('Set the 12 ounce pepper cups to 40 sleeves');
        
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
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'set',
                  item: 'pepper cups',
                  quantity: 0,
                  unit: 'sleeves',
                  confidence: 0.6
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('Set the pepper cups to sleeves');
        
        expect(result).toEqual({
          action: 'set',
          item: 'pepper cups',
          quantity: 0,
          unit: 'sleeves',
          confidence: expect.any(Number),
          isComplete: false
        });
      });

      it('should mark add command as complete with just item and default quantity', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'add',
                  item: 'coffee',
                  quantity: 1,
                  unit: 'pounds',
                  confidence: 0.9
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('add coffee');
        
        expect(result).toEqual({
          action: 'add',
          item: 'coffee',
          quantity: 1,
          unit: 'pounds',
          confidence: expect.any(Number),
          isComplete: true
        });
      });

      it('should mark add command as complete with explicit quantity', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'add',
                  item: 'coffee',
                  quantity: 5,
                  unit: 'pounds',
                  confidence: 0.95
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('add 5 pounds of coffee');
        
        expect(result).toEqual({
          action: 'add',
          item: 'coffee',
          quantity: 5,
          unit: 'pounds',
          confidence: expect.any(Number),
          isComplete: true
        });
      });

      it('should mark command as incomplete when item is missing', async () => {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            choices: [{
              message: {
                content: JSON.stringify({
                  action: 'add',
                  item: 'unknown',
                  quantity: 1,
                  unit: 'units',
                  confidence: 0.3
                })
              }
            }]
          }
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse as AxiosResponse);

        const result = await nlpService.processTranscription('add something');
        
        expect(result).toEqual({
          action: 'add',
          item: '',
          quantity: 1,
          unit: 'units',
          confidence: expect.any(Number),
          isComplete: false
        });
      });
    });
  });
}); 