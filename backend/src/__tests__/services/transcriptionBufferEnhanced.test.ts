import TranscriptionBuffer from '../../services/transcriptionBuffer';
import { NlpService } from '../../services/nlpService';
import { NlpResult } from '../../types/nlp';

// Mock NlpService
jest.mock('../../services/nlpService');

describe('Enhanced TranscriptionBuffer Tests', () => {
  let transcriptionBuffer: TranscriptionBuffer;
  let nlpService: jest.Mocked<NlpService>;
  
  beforeEach(() => {
    // Create a fresh mock NlpService for each test
    nlpService = new NlpService() as jest.Mocked<NlpService>;
    
    // Set up the processTranscription mock
    nlpService.processTranscription = jest.fn().mockImplementation(async (text: string) => {
      // Simple implementation to test various patterns
      if (text.toLowerCase().includes('add') && text.toLowerCase().includes('milk')) {
        return [{
          action: 'add',
          item: 'milk',
          quantity: 5,
          unit: 'gallons',
          confidence: 0.95,
          isComplete: true
        }];
      }
      
      if (text.toLowerCase().includes('we have') && text.toLowerCase().includes('milk')) {
        return [{
          action: 'set',
          item: 'milk',
          quantity: 10,
          unit: 'gallons',
          confidence: 0.95,
          isComplete: true
        }];
      }
      
      // No complete command detected
      return [{
        action: 'unknown',
        item: '',
        quantity: undefined,
        unit: '',
        confidence: 0.3,
        isComplete: false
      }];
    });
    
    transcriptionBuffer = new TranscriptionBuffer(nlpService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should emit completeCommand event with combined transcriptions', async () => {
    // Set up event listener
    const completeCommandHandler = jest.fn();
    transcriptionBuffer.on('completeCommand', completeCommandHandler);
    
    // Add first part of a command
    await transcriptionBuffer.addTranscription('We have');
    
    // Nothing should be processed yet
    expect(nlpService.processTranscription).not.toHaveBeenCalled();
    expect(completeCommandHandler).not.toHaveBeenCalled();
    
    // Add second part
    await transcriptionBuffer.addTranscription('10 gallons');
    
    // Nothing should be processed yet (not a complete command)
    expect(nlpService.processTranscription).not.toHaveBeenCalled();
    expect(completeCommandHandler).not.toHaveBeenCalled();
    
    // Add third part which completes the command
    await transcriptionBuffer.addTranscription('of milk.');
    
    // Now the buffer should process the complete command
    expect(nlpService.processTranscription).toHaveBeenCalledWith('We have 10 gallons of milk.');
    expect(completeCommandHandler).toHaveBeenCalledTimes(1);
    
    // Verify the emitted data
    const emittedArgs = completeCommandHandler.mock.calls[0];
    expect(emittedArgs[0]).toEqual([{
      action: 'set',
      item: 'milk',
      quantity: 10,
      unit: 'gallons',
      confidence: 0.95,
      isComplete: true
    }]);
    expect(emittedArgs[1]).toBe('We have 10 gallons of milk.');
  });
  
  test('should process command after timeout if no new transcriptions arrive', async () => {
    // Mock timers
    jest.useFakeTimers();
    
    // Set up event listener
    const completeCommandHandler = jest.fn();
    transcriptionBuffer.on('completeCommand', completeCommandHandler);
    
    // Add an incomplete command
    await transcriptionBuffer.addTranscription('We have 10 gallons');
    
    // Nothing should be processed yet
    expect(nlpService.processTranscription).not.toHaveBeenCalled();
    expect(completeCommandHandler).not.toHaveBeenCalled();
    
    // Fast-forward time by 3 seconds (command timeout)
    jest.advanceTimersByTime(3000);
    
    // Now the buffer should process due to timeout
    expect(nlpService.processTranscription).toHaveBeenCalledWith('We have 10 gallons');
    expect(completeCommandHandler).toHaveBeenCalledTimes(1);
    
    // Cleanup
    jest.useRealTimers();
  });
  
  test('should detect likely complete commands and process immediately', async () => {
    // Set up event listener
    const completeCommandHandler = jest.fn();
    transcriptionBuffer.on('completeCommand', completeCommandHandler);
    
    // Add a command that ends with period (complete sentence)
    await transcriptionBuffer.addTranscription('Add 5 gallons of milk.');
    
    // Should be processed immediately due to ending period
    expect(nlpService.processTranscription).toHaveBeenCalledWith('Add 5 gallons of milk.');
    expect(completeCommandHandler).toHaveBeenCalledTimes(1);
    
    // Verify the emitted data
    const emittedArgs = completeCommandHandler.mock.calls[0];
    expect(emittedArgs[0]).toEqual([{
      action: 'add',
      item: 'milk',
      quantity: 5,
      unit: 'gallons',
      confidence: 0.95,
      isComplete: true
    }]);
  });
  
  test('should handle errors from NLP service', async () => {
    // Set up a mock implementation that throws an error
    nlpService.processTranscription.mockImplementationOnce(() => {
      throw new Error('NLP processing failed');
    });
    
    // Set up event listeners
    const completeCommandHandler = jest.fn();
    const errorHandler = jest.fn();
    transcriptionBuffer.on('completeCommand', completeCommandHandler);
    transcriptionBuffer.on('error', errorHandler);
    
    // Add a command
    await transcriptionBuffer.addTranscription('Add 5 gallons of milk.');
    
    // Should have called NLP service
    expect(nlpService.processTranscription).toHaveBeenCalled();
    
    // Should have emitted error event
    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler.mock.calls[0][0].message).toBe('NLP processing failed');
    
    // Should NOT have emitted completeCommand event
    expect(completeCommandHandler).not.toHaveBeenCalled();
  });
  
  test('should clear buffer after processing', async () => {
    // Add and process a command
    await transcriptionBuffer.addTranscription('Add 5 gallons of milk.');
    
    // Buffer should be cleared after processing
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('');
    
    // Add a new command
    await transcriptionBuffer.addTranscription('We have 10 gallons of milk.');
    
    // NLP service should be called a second time with only the new command
    expect(nlpService.processTranscription).toHaveBeenCalledTimes(2);
    expect(nlpService.processTranscription).toHaveBeenLastCalledWith('We have 10 gallons of milk.');
  });
}); 