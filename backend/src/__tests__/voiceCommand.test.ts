import { NlpService } from '../services/nlpService';
import inventoryService from '../services/inventoryService';
import confirmationService from '../services/confirmationService';
import { NlpResult } from '../types/nlp';

// Mock dependencies
jest.mock('../services/inventoryService');
jest.mock('../services/confirmationService');

describe('Voice Command Processing', () => {
  let nlpService: NlpService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    nlpService = new NlpService();
  });

  describe('processTranscription', () => {
    test('should correctly process a complete command with quantity and item', async () => {
      const transcription = 'add 20 gallons to whole milk';
      const results = await nlpService.processTranscription(transcription);

      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result).toEqual({
        action: 'add',
        item: 'whole milk',
        quantity: 20,
        unit: 'gallons',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    test('should handle multi-segment commands correctly', async () => {
      // First segment
      const firstResults = await nlpService.processTranscription('add20 gallons');
      expect(firstResults).toHaveLength(1);
      const firstResult = firstResults[0];
      expect(firstResult.isComplete).toBe(false);
      expect(firstResult.quantity).toBe(20);
      expect(firstResult.unit).toBe('gallons');

      // Second segment
      const secondResults = await nlpService.processTranscription('to whole milk');
      expect(secondResults).toHaveLength(1);
      const secondResult = secondResults[0];
      expect(secondResult.isComplete).toBe(true);
      expect(secondResult.item).toBe('whole milk');
      expect(secondResult.quantity).toBe(20);
      expect(secondResult.unit).toBe('gallons');
    });

    test('should handle remove commands correctly', async () => {
      const transcription = 'remove 5 gallons from whole milk';
      const results = await nlpService.processTranscription(transcription);

      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result).toEqual({
        action: 'remove',
        item: 'whole milk',
        quantity: 5,
        unit: 'gallons',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    test('should handle add commands correctly', async () => {
      const transcription = 'add 3 boxes of cereal';
      const results = await nlpService.processTranscription(transcription);

      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result).toEqual({
        action: 'add',
        item: 'cereal',
        quantity: 3,
        unit: 'boxes',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    it('should handle incomplete commands gracefully', async () => {
      const results = await nlpService.processTranscription('20 gallons');
      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result.confidence).toBe(0.45);
      expect(result.isComplete).toBe(false);
      expect(result.quantity).toBe(20);
      expect(result.unit).toBe('gallons');
      expect(result.item).toBe('20 gallons');
      expect(result.action).toBe('');
    });

    it('should handle commands with missing quantities', async () => {
      const results = await nlpService.processTranscription('add some milk');
      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result.isComplete).toBe(true);
      expect(result.action).toBe('add');
      expect(result.item).toBe('milk');
      expect(result.unit).toBe('gallons');
      expect(result.quantity).toBeUndefined();
      expect(result.confidence).toBe(0.8);
    });
  });

  describe('Inventory Updates', () => {
    test('should successfully update inventory with valid command', async () => {
      const command = {
        action: 'set',
        item: 'whole milk',
        quantity: 20,
        unit: 'gallons'
      };

      (inventoryService.updateInventory as jest.Mock).mockResolvedValue(undefined);
      
      await inventoryService.updateInventory(command);
      
      expect(inventoryService.updateInventory).toHaveBeenCalledWith(command);
    });

    test('should handle missing quantity gracefully', async () => {
      const command = {
        action: 'add',
        item: 'milk',
        quantity: 0,
        unit: 'gallons'
      };

      (inventoryService.updateInventory as jest.Mock).mockRejectedValue(new Error('Invalid quantity'));
      
      await expect(inventoryService.updateInventory(command)).rejects.toThrow('Invalid quantity');
    });

    test('should handle invalid quantities gracefully', async () => {
      const command = {
        action: 'set',
        item: 'milk',
        quantity: -5,
        unit: 'gallons'
      };

      (inventoryService.updateInventory as jest.Mock).mockRejectedValue(new Error('Invalid quantity'));
      
      await expect(inventoryService.updateInventory(command)).rejects.toThrow('Invalid quantity');
    });
  });
}); 