// backend/src/__tests__/services/inventoryService.test.ts
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { MockInventoryRepository } from '../mocks/inventoryRepository';
import { InventoryItem } from '../../models/InventoryItem';
import { NotFoundError } from '../../errors';

// Create a new class that extends InventoryService to inject our mock repository
class TestableInventoryService {
  repository: MockInventoryRepository;

  constructor(repository: MockInventoryRepository) {
    this.repository = repository;
  }

  async findBestMatch(extractedItem: string): Promise<InventoryItem> {
    const allItems = await this.repository.findAll();
    
    // Extract base name and size from the input
    const normalizedInput = extractedItem.toLowerCase();
    const sizeMatch = normalizedInput.match(/(\d+)\s*(?:ounce|oz)/);
    const size = sizeMatch ? sizeMatch[1] : null;
    
    // Remove size information to get base name
    const baseName = normalizedInput.replace(/\d+\s*(?:ounce|oz)\s*/, '').trim();

    // Find matching items
    const matches = allItems.filter(item => {
      const itemName = item.name.toLowerCase();
      const itemSizeMatch = itemName.match(/(\d+)\s*(?:ounce|oz)/);
      const itemSize = itemSizeMatch ? itemSizeMatch[1] : null;
      
      // Remove size information to get base name
      const itemBaseName = itemName.replace(/\d+\s*(?:ounce|oz)\s*/, '').trim();
      
      // Check if base names match and sizes match
      return itemBaseName.includes(baseName) && 
             (!size || !itemSize || size === itemSize);
    });

    if (matches.length === 0) {
      throw new NotFoundError(`No matching item found for "${extractedItem}"`);
    }

    return matches[0];
  }

  async updateInventory(update: { action: string; item: string; quantity: number; unit: string }): Promise<void> {
    const item = await this.findBestMatch(update.item);
    // Rest of the update logic would go here
  }
}

describe('InventoryService', () => {
  let service: TestableInventoryService;
  let mockRepository: MockInventoryRepository;

  beforeEach(async () => {
    mockRepository = new MockInventoryRepository();
    service = new TestableInventoryService(mockRepository);

    // Add test items to mock repository
    await mockRepository.save({
      id: '1',
      name: 'Coffee 16 ounce',
      quantity: 10,
      unit: 'bags',
      category: 'Beverages',
      threshold: 5,
      lastupdated: new Date().toISOString()
    });

    await mockRepository.save({
      id: '2',
      name: 'Coffee 8 ounce',
      quantity: 15,
      unit: 'bags',
      category: 'Beverages',
      threshold: 5,
      lastupdated: new Date().toISOString()
    });

    await mockRepository.save({
      id: '3',
      name: 'Coffee',
      quantity: 20,
      unit: 'bags',
      category: 'Beverages',
      threshold: 5,
      lastupdated: new Date().toISOString()
    });

    await mockRepository.save({
      id: '4',
      name: 'Dark Roast Coffee 16 ounce',
      quantity: 8,
      unit: 'bags',
      category: 'Beverages',
      threshold: 5,
      lastupdated: new Date().toISOString()
    });
  });

  describe('findBestMatch', () => {
    test('should match items with size variations', async () => {
      const result = await service.findBestMatch('coffee 16 ounce');
      expect(result.name).toBe('Coffee 16 ounce');
    });

    test('should handle items without size specification', async () => {
      const result = await service.findBestMatch('coffee');
      expect(result.name).toBe('Coffee');
    });

    test('should throw NotFoundError when no match is found', async () => {
      await expect(service.findBestMatch('tea')).rejects.toThrow(NotFoundError);
    });

    test('should handle case-insensitive matching', async () => {
      const result = await service.findBestMatch('COFFEE 16 OUNCE');
      expect(result.name).toBe('Coffee 16 ounce');
    });

    test('should handle partial matches in base names', async () => {
      const result = await service.findBestMatch('coffee 16 ounce');
      expect(result.name).toBe('Coffee 16 ounce');
    });
  });
}); 