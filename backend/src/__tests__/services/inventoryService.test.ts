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
  
  describe('updateItem', () => {
    test('should update an item successfully', async () => {
      const items = mockRepository.getItems();
      const itemToUpdate = items.find(item => item.name === 'Coffee 16 ounce');
      if (!itemToUpdate) {
        fail('Test item not found');
        return;
      }
      
      const updates = { 
        name: 'Premium Coffee 16 ounce',
        quantity: 20
      };
      
      const result = await inventoryService.updateItem(itemToUpdate.id, updates);
      
      expect(result).toEqual(expect.objectContaining({
        id: itemToUpdate.id,
        name: 'Premium Coffee 16 ounce',
        quantity: 20
      }));
      
      const updatedItem = await mockRepository.findById(itemToUpdate.id);
      expect(updatedItem?.name).toBe('Premium Coffee 16 ounce');
      expect(updatedItem?.quantity).toBe(20);
    });
    
    test('should throw ValidationError when update fails', async () => {
      jest.spyOn(mockRepository, 'save').mockResolvedValue(null as unknown as InventoryItem);
      
      await expect(inventoryService.updateItem('non-existent-id', { quantity: 20 }))
        .rejects.toThrow(ValidationError);
    });
  });
  
  describe('fetchInventory', () => {
    test('should return all inventory items', async () => {
      const result = await inventoryService.fetchInventory();
      
      expect(result).toHaveLength(4); // We added 4 items in beforeEach
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Coffee 16 ounce' }),
        expect.objectContaining({ name: 'Coffee 8 ounce' }),
        expect.objectContaining({ name: 'Coffee' }),
        expect.objectContaining({ name: 'Dark Roast Coffee 16 ounce' })
      ]));
    });
  });
  
  describe('addItem', () => {
    test('should add a new item successfully', async () => {
      const newItemData = {
        name: 'Tea',
        quantity: 10,
        unit: 'boxes',
        category: 'Beverages',
        threshold: 3
      };
      
      const result = await inventoryService.addItem(newItemData);
      
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: 'Tea',
        quantity: 10,
        unit: 'boxes',
        category: 'Beverages',
        threshold: 3,
        lastupdated: expect.any(String)
      }));
      
      const items = mockRepository.getItems();
      const addedItem = items.find(item => item.name === 'Tea');
      expect(addedItem).toBeDefined();
    });
    
    test('should throw ValidationError when creation fails', async () => {
      jest.spyOn(mockRepository, 'create').mockRejectedValue(new Error('Failed to create item'));
      
      await expect(inventoryService.addItem({
        name: 'Failed Item',
        quantity: 10,
        unit: 'units',
        category: 'test'
      })).rejects.toThrow(ValidationError);
    });
  });
  
  describe('deleteItem', () => {
    test('should delete an item successfully', async () => {
      const items = mockRepository.getItems();
      const itemToDelete = items.find(item => item.name === 'Coffee 16 ounce');
      if (!itemToDelete) {
        fail('Test item not found');
        return;
      }
      
      jest.spyOn(mockRepository, 'delete').mockResolvedValue(true);
      
      await inventoryService.deleteItem(itemToDelete.id);
      
      expect(mockRepository.delete).toHaveBeenCalledWith(itemToDelete.id);
    });
    
    test('should throw ValidationError when deletion fails', async () => {
      jest.spyOn(mockRepository, 'delete').mockResolvedValue(false);
      
      await expect(inventoryService.deleteItem('non-existent-id'))
        .rejects.toThrow(ValidationError);
    });
  });
  
  describe('getItemQuantity', () => {
    test('should return item quantity in the same unit', async () => {
      const items = mockRepository.getItems();
      const item = items.find(item => item.name === 'Coffee 16 ounce');
      if (!item) {
        fail('Test item not found');
        return;
      }
      
      jest.spyOn(inventoryService, 'findBestMatch').mockResolvedValue(item);
      
      const result = await inventoryService.getItemQuantity('Coffee 16 ounce');
      
      expect(result).toEqual({
        quantity: 10, // Initial quantity from beforeEach
        unit: 'bags'
      });
    });
    
    test('should convert quantity to requested unit when possible', async () => {
      const items = mockRepository.getItems();
      const item = items.find(item => item.name === 'Coffee 16 ounce');
      if (!item) {
        fail('Test item not found');
        return;
      }
      
      jest.spyOn(inventoryService, 'findBestMatch').mockResolvedValue(item);
      
      const unitConversions = require('../../utils/unitConversions');
      jest.spyOn(unitConversions, 'getUnitType')
        .mockImplementation((unit) => unit === 'bags' || unit === 'units' ? 'count' : 'unknown');
      
      jest.spyOn(unitConversions, 'convertQuantity')
        .mockImplementation(() => 20); // 10 bags = 20 units
      
      const result = await inventoryService.getItemQuantity('Coffee 16 ounce', 'units');
      
      expect(result).toEqual({
        quantity: 20,
        unit: 'units'
      });
      
      jest.restoreAllMocks();
    });
  });
});
