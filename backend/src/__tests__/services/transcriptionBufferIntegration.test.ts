import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import TranscriptionBuffer from '../../services/transcriptionBuffer';
import nlpService from '../../services/nlpService';

// Define the return type for processTranscription
type NlpResultType = {
  action: string;
  item: string;
  quantity: number;
  unit: string;
  confidence: number;
  isComplete: boolean;
};


// Mock the NLP service with a typed mock function
jest.mock('../../services/nlpService', () => ({
  processTranscription: jest.fn<(transcription: string) => Promise<NlpResultType>>()
}));

describe('TranscriptionBuffer Integration Tests', () => {
  let transcriptionBuffer: TranscriptionBuffer;
  let mockProcessTranscription: jest.Mock<(transcription: string) => Promise<NlpResultType>>;

  beforeEach(() => {
    transcriptionBuffer = new TranscriptionBuffer();
    mockProcessTranscription = nlpService.processTranscription as jest.Mock<(transcription: string) => Promise<NlpResultType>>;
    jest.clearAllMocks(); // Reset mock state between tests
  });

  it('should process command through NLP and clear buffer when complete', async () => {
    mockProcessTranscription.mockResolvedValueOnce({
      action: 'add',
      item: 'coffee',
      quantity: 5,
      unit: 'pounds',
      confidence: 0.9,
      isComplete: true
    });

    transcriptionBuffer.addTranscription('add 5 pounds of coffee');
    const buffer = transcriptionBuffer.getCurrentBuffer();
    const nlpResult = await nlpService.processTranscription(buffer);

    if (nlpResult.isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenCalledWith('add 5 pounds of coffee');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('');
  });

  it('should retain buffer content when command is incomplete', async () => {
    mockProcessTranscription.mockResolvedValueOnce({
      action: 'add',
      item: '',
      quantity: 5,
      unit: 'pounds',
      confidence: 0.8,
      isComplete: false
    });

    transcriptionBuffer.addTranscription('add 5 pounds of');
    const buffer = transcriptionBuffer.getCurrentBuffer();
    const nlpResult = await nlpService.processTranscription(buffer);

    if (nlpResult.isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenCalledWith('add 5 pounds of');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('add 5 pounds of');
  });

  it('should combine multiple transcriptions into a complete command', async () => {
    mockProcessTranscription
      .mockResolvedValueOnce({
        action: 'add',
        item: '',
        quantity: 5,
        unit: 'pounds',
        confidence: 0.8,
        isComplete: false
      })
      .mockResolvedValueOnce({
        action: 'add',
        item: 'coffee',
        quantity: 5,
        unit: 'pounds',
        confidence: 0.9,
        isComplete: true
      });

    transcriptionBuffer.addTranscription('add 5 pounds of');
    let buffer = transcriptionBuffer.getCurrentBuffer();
    let nlpResult = await nlpService.processTranscription(buffer);

    if (nlpResult.isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenNthCalledWith(1, 'add 5 pounds of');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('add 5 pounds of');

    transcriptionBuffer.addTranscription('coffee');
    buffer = transcriptionBuffer.getCurrentBuffer();
    nlpResult = await nlpService.processTranscription(buffer);

    if (nlpResult.isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenNthCalledWith(2, 'add 5 pounds of coffee');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('');
  });

  it('should handle split set commands correctly', async () => {
    mockProcessTranscription
      .mockResolvedValueOnce({
        action: 'set',
        item: '16 ounce paper cups',
        quantity: 0,
        unit: '',
        confidence: 0.7,
        isComplete: false
      })
      .mockResolvedValueOnce({
        action: 'set',
        item: 'paper cups',
        quantity: 30,
        unit: 'sleeves',
        confidence: 0.9,
        isComplete: true
      });

    transcriptionBuffer.addTranscription('Set the 16 ounce paper cups');
    let buffer = transcriptionBuffer.getCurrentBuffer();
    let nlpResult = await nlpService.processTranscription(buffer);

    if (nlpResult.isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenNthCalledWith(1, 'Set the 16 ounce paper cups');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('Set the 16 ounce paper cups');

    transcriptionBuffer.addTranscription('to 30 sleeves');
    buffer = transcriptionBuffer.getCurrentBuffer();
    nlpResult = await nlpService.processTranscription(buffer);

    if (nlpResult.isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenNthCalledWith(2, 'Set the 16 ounce paper cups to 30 sleeves');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('');
  });
});