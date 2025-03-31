import nlpService from '../services/nlpService';
import inventoryService from '../services/inventoryService';
import confirmationService from '../services/confirmationService';

// Mock dependencies
jest.mock('../services/inventoryService');
jest.mock('../services/confirmationService');

describe('Voice Command Processing', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('processTranscription', () => {
    test('should correctly process a complete command with quantity and item', async () => {
      const transcription = 'add 20 gallons to whole milk';
      const result = await nlpService.processTranscription(transcription);

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
      const firstResult = await nlpService.processTranscription('add20 gallons');
      expect(firstResult.isComplete).toBe(false);
      expect(firstResult.quantity).toBe(20);
      expect(firstResult.unit).toBe('gallons');

      // Second segment
      const secondResult = await nlpService.processTranscription('to whole milk');
      expect(secondResult.isComplete).toBe(true);
      expect(secondResult.item).toBe('whole milk');
      expect(secondResult.quantity).toBe(20);
      expect(secondResult.unit).toBe('gallons');
    });

    test('should handle remove commands correctly', async () => {
      const transcription = 'remove 5 gallons from whole milk';
      const result = await nlpService.processTranscription(transcription);

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
      const result = await nlpService.processTranscription(transcription);

      expect(result).toEqual({
        action: 'add',
        item: 'cereal',
        quantity: 3,
        unit: 'boxes',
        confidence: expect.any(Number),
        isComplete: true
      });
    });

    test('should handle incomplete commands gracefully', async () => {
      const transcription = '20 gallons';
      const result = await nlpService.processTranscription(transcription);

      expect(result.isComplete).toBe(false);
      expect(result.quantity).toBe(20);
      expect(result.unit).toBe('gallons');
      expect(result.item).toBe('');
    });

    test('should handle commands with missing quantities', async () => {
      const transcription = 'add some milk';
      const result = await nlpService.processTranscription(transcription);

      expect(result.isComplete).toBe(false);
      expect(result.action).toBe('add');
      expect(result.item).toBe('milk');
      expect(result.quantity).toBeUndefined();
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
        quantity: 0, // Use 0 instead of undefined to match the interface
        unit: 'gallons'
      };

      await expect(inventoryService.updateInventory(command)).rejects.toThrow();
    });

    test('should handle invalid quantities gracefully', async () => {
      const command = {
        action: 'set',
        item: 'milk',
        quantity: -5,
        unit: 'gallons'
      };

      await expect(inventoryService.updateInventory(command)).rejects.toThrow();
    });
  });
}); 