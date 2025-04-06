// backend/src/__tests__/services/inventoryService.test.ts
import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { MockInventoryRepository } from '../mocks/inventoryRepository';
import { InventoryItem } from '../../models/InventoryItem';
import { NotFoundError, ValidationError } from '../../errors';
import inventoryService from '../../services/inventoryService';
import websocketService from '../../services/websocketService';

// Mock the websocket service
jest.mock('../../services/websocketService', () => ({
  broadcastToVoiceClients: jest.fn()
}));

describe('InventoryService', () => {
  let mockRepository: MockInventoryRepository;

  beforeEach(async () => {
    mockRepository = new MockInventoryRepository();
    // Inject mock repository into the service (since repository is private)
    (inventoryService as any).repository = mockRepository;

    // Add test items to mock repository
    await mockRepository.save({
      id: '1',
      name: 'Coffee 16 ounce',
      quantity: 10,
      unit: 'bags',
      category: 'Beverages',
      threshold: 5,
      lastupdated: new Date().toISOString(),
      embedding: [0.1, 0.2, 0.3] // Placeholder embedding
    });

    await mockRepository.save({
      id: '2',
      name: 'Coffee 8 ounce',
      quantity: 15,
      unit: 'bags',
      category: 'Beverages',
      threshold: 5,
      lastupdated: new Date().toISOString(),
      embedding: [0.1, 0.2, 0.25]
    });

    await mockRepository.save({
      id: '3',
      name: 'Coffee',
      quantity: 20,
      unit: 'bags',
      category: 'Beverages',
      threshold: 5,
      lastupdated: new Date().toISOString(),
      embedding: [0.1, 0.2, 0.2]
    });

    await mockRepository.save({
      id: '4',
      name: 'Dark Roast Coffee 16 ounce',
      quantity: 8,
      unit: 'bags',
      category: 'Beverages',
      threshold: 5,
      lastupdated: new Date().toISOString(),
      embedding: [0.15, 0.25, 0.35]
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findBestMatch', () => {
    test('should find exact match', async () => {
      const extractedItem = 'Coffee 16 ounce';
      const items = mockRepository.getItems();
      const expectedItem = items.find(item => item.name === 'Coffee 16 ounce');

      // Mock findSimilarItems to return items with embedding similarities
      jest.spyOn(mockRepository, 'findSimilarItems').mockResolvedValue([
        { item: expectedItem as InventoryItem, similarity: 0.95 },
        { item: items.find(item => item.name === 'Coffee 8 ounce') as InventoryItem, similarity: 0.85 },
        { item: items.find(item => item.name === 'Coffee') as InventoryItem, similarity: 0.80 }
      ]);

      const result = await inventoryService.findBestMatch(extractedItem);
      expect(result).toBe(expectedItem);
    });

    test('should find partial match', async () => {
      const extractedItem = '16 oz coffee';
      const items = mockRepository.getItems();
      const expectedItem = items.find(item => item.name === 'Coffee 16 ounce');

      jest.spyOn(mockRepository, 'findSimilarItems').mockResolvedValue([
        { item: expectedItem as InventoryItem, similarity: 0.90 },
        { item: items.find(item => item.name === 'Coffee 8 ounce') as InventoryItem, similarity: 0.80 },
        { item: items.find(item => item.name === 'Coffee') as InventoryItem, similarity: 0.75 }
      ]);

      const result = await inventoryService.findBestMatch(extractedItem);
      expect(result).toBe(expectedItem);
    });

    test('should throw NotFoundError when no match is found', async () => {
      const extractedItem = 'Sugar';

      jest.spyOn(mockRepository, 'findSimilarItems').mockResolvedValue([]);

      await expect(inventoryService.findBestMatch(extractedItem)).rejects.toThrow(NotFoundError);
    });

    test('should throw ValidationError for ambiguous matches below threshold', async () => {
      const extractedItem = 'Roast Coffee';
      const items = mockRepository.getItems();
      const similarItems = [
        { item: items.find(item => item.name === 'Coffee'), similarity: 0.5 },
        { item: items.find(item => item.name === 'Dark Roast Coffee 16 ounce'), similarity: 0.55 }
      ];
    
      jest.spyOn(mockRepository, 'findSimilarItems').mockResolvedValue(similarItems as { item: InventoryItem; similarity: number }[]);
    
      await expect(inventoryService.findBestMatch(extractedItem)).rejects.toThrow(ValidationError);
    });

    test('should handle case-insensitive matching', async () => {
      const extractedItem = 'coffee 16 OUNCE';
      const items = mockRepository.getItems();
      const expectedItem = items.find(item => item.name === 'Coffee 16 ounce');

      jest.spyOn(mockRepository, 'findSimilarItems').mockResolvedValue([
        { item: expectedItem as InventoryItem, similarity: 0.90 },
        { item: items.find(item => item.name === 'Coffee 8 ounce') as InventoryItem, similarity: 0.80 }
      ]);

      const result = await inventoryService.findBestMatch(extractedItem);
      expect(result).toBe(expectedItem);
    });

    test('should match generic item when no size is specified', async () => {
      const extractedItem = 'Coffee';
      const items = mockRepository.getItems();
      const expectedItem = items.find(item => item.name === 'Coffee');

      jest.spyOn(mockRepository, 'findSimilarItems').mockResolvedValue([
        { item: expectedItem as InventoryItem, similarity: 0.95 },
        { item: items.find(item => item.name === 'Coffee 16 ounce') as InventoryItem, similarity: 0.85 },
        { item: items.find(item => item.name === 'Coffee 8 ounce') as InventoryItem, similarity: 0.85 }
      ]);

      const result = await inventoryService.findBestMatch(extractedItem);
      expect(result).toBe(expectedItem);
    });

    test('should select item with highest combined similarity above threshold', async () => {
      const extractedItem = 'Dark Coffee 16 oz';
      const items = mockRepository.getItems();
      const expectedItem = items.find(item => item.name === 'Dark Roast Coffee 16 ounce');

      jest.spyOn(mockRepository, 'findSimilarItems').mockResolvedValue([
        { item: expectedItem as InventoryItem, similarity: 0.92 },
        { item: items.find(item => item.name === 'Coffee 16 ounce') as InventoryItem, similarity: 0.88 },
        { item: items.find(item => item.name === 'Coffee') as InventoryItem, similarity: 0.70 }
      ]);

      const result = await inventoryService.findBestMatch(extractedItem);
      expect(result).toBe(expectedItem);
    });
  });

  describe('updateInventoryCount', () => {
    test('should update inventory quantity and broadcast WebSocket message', async () => {
      const items = mockRepository.getItems();
      const itemToUpdate = items.find(item => item.name === 'Coffee 16 ounce');
      if (!itemToUpdate) {
        fail('Test item not found');
        return;
      }
      // Initial quantity is 10 from beforeEach
      jest.spyOn(inventoryService, 'findBestMatch').mockResolvedValue(itemToUpdate);
      await inventoryService.updateInventoryCount({
        action: 'add',
        item: 'Coffee 16 ounce',
        quantity: 5,
        unit: 'bags'
      });
      const expectedNewQuantity = 10 + 5; // Explicitly 15
      expect(await mockRepository.findById(itemToUpdate.id)).toHaveProperty('quantity', expectedNewQuantity);
      expect(websocketService.broadcastToVoiceClients).toHaveBeenCalledWith(
        'inventory-updated',
        expect.objectContaining({
          type: 'inventoryUpdate',
          status: 'success',
          data: expect.objectContaining({
            item: itemToUpdate.name,
            quantity: expectedNewQuantity,
            unit: itemToUpdate.unit,
            action: 'add',
            id: itemToUpdate.id
          })
        })
      );
    });
  });
});