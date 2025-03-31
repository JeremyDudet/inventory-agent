import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import TranscriptionBuffer from '../../services/transcriptionBuffer';
import { NlpService } from '../../services/nlpService';
import { NlpResult } from '../../types/nlp';

type ProcessTranscriptionFn = (transcription: string) => Promise<NlpResult[]>;

jest.mock('../../services/nlpService', () => {
  return {
    NlpService: jest.fn().mockImplementation(() => ({
      processTranscription: jest.fn<ProcessTranscriptionFn>()
    }))
  };
});

describe('TranscriptionBuffer Integration Tests', () => {
  let nlpService: NlpService;
  let transcriptionBuffer: TranscriptionBuffer;
  let mockProcessTranscription: jest.Mock<ProcessTranscriptionFn>;

  const mockResult: NlpResult = {
    action: 'add',
    item: 'test item',
    quantity: 1,
    unit: 'units',
    confidence: 0.9,
    isComplete: true,
    type: undefined
  };

  beforeEach(() => {
    nlpService = new NlpService();
    mockProcessTranscription = nlpService.processTranscription as jest.Mock<ProcessTranscriptionFn>;
    mockProcessTranscription.mockImplementation(async () => [mockResult]);
    transcriptionBuffer = new TranscriptionBuffer(nlpService);
    jest.clearAllMocks();
  });

  it('should process command through NLP and clear buffer when complete', async () => {
    const result: NlpResult = {
      action: 'add',
      item: 'coffee',
      quantity: 5,
      unit: 'pounds',
      confidence: 0.9,
      isComplete: true,
      type: undefined
    };
    mockProcessTranscription.mockResolvedValueOnce([result]);

    transcriptionBuffer.addTranscription('add 5 pounds of coffee');
    const buffer = transcriptionBuffer.getCurrentBuffer();
    const nlpResults = await nlpService.processTranscription(buffer);

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenCalledWith('add 5 pounds of coffee');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('');
  });

  it('should retain buffer content when command is incomplete', async () => {
    const result: NlpResult = {
      action: 'add',
      item: '',
      quantity: 5,
      unit: 'pounds',
      confidence: 0.8,
      isComplete: false,
      type: undefined
    };
    mockProcessTranscription.mockResolvedValueOnce([result]);

    transcriptionBuffer.addTranscription('add 5 pounds of');
    const buffer = transcriptionBuffer.getCurrentBuffer();
    const nlpResults = await nlpService.processTranscription(buffer);

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenCalledWith('add 5 pounds of');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('add 5 pounds of');
  });

  it('should combine multiple transcriptions into a complete command', async () => {
    const incompleteResult: NlpResult = {
      action: 'add',
      item: '',
      quantity: 5,
      unit: 'pounds',
      confidence: 0.8,
      isComplete: false,
      type: undefined
    };
    const completeResult: NlpResult = {
      action: 'add',
      item: 'coffee',
      quantity: 5,
      unit: 'pounds',
      confidence: 0.9,
      isComplete: true,
      type: undefined
    };
    mockProcessTranscription
      .mockResolvedValueOnce([incompleteResult])
      .mockResolvedValueOnce([completeResult]);

    transcriptionBuffer.addTranscription('add 5 pounds of');
    let buffer = transcriptionBuffer.getCurrentBuffer();
    let nlpResults = await nlpService.processTranscription(buffer);

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenNthCalledWith(1, 'add 5 pounds of');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('add 5 pounds of');

    transcriptionBuffer.addTranscription('coffee');
    buffer = transcriptionBuffer.getCurrentBuffer();
    nlpResults = await nlpService.processTranscription(buffer);

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenNthCalledWith(2, 'add 5 pounds of coffee');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('');
  });

  it('should handle split set commands correctly', async () => {
    const incompleteResult: NlpResult = {
      action: 'set',
      item: '16 ounce paper cups',
      quantity: 0,
      unit: '',
      confidence: 0.7,
      isComplete: false,
      type: undefined
    };
    const completeResult: NlpResult = {
      action: 'set',
      item: 'paper cups',
      quantity: 30,
      unit: 'sleeves',
      confidence: 0.9,
      isComplete: true,
      type: undefined
    };
    mockProcessTranscription
      .mockResolvedValueOnce([incompleteResult])
      .mockResolvedValueOnce([completeResult]);

    transcriptionBuffer.addTranscription('Set the 16 ounce paper cups');
    let buffer = transcriptionBuffer.getCurrentBuffer();
    let nlpResults = await nlpService.processTranscription(buffer);

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenNthCalledWith(1, 'Set the 16 ounce paper cups');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('Set the 16 ounce paper cups');

    transcriptionBuffer.addTranscription('to 30 sleeves');
    buffer = transcriptionBuffer.getCurrentBuffer();
    nlpResults = await nlpService.processTranscription(buffer);

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenNthCalledWith(2, 'Set the 16 ounce paper cups to 30 sleeves');
    expect(transcriptionBuffer.getCurrentBuffer()).toBe('');
  });
});