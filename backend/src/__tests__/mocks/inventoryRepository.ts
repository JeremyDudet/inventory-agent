import { InventoryItem } from '../../models/InventoryItem';

export class MockInventoryRepository {
  private items: Map<string, InventoryItem> = new Map();

  async findByName(name: string): Promise<InventoryItem[]> {
    const items = Array.from(this.items.values());
    return items.filter(item => item.name.toLowerCase() === name.toLowerCase());
  }

  async findById(id: string): Promise<InventoryItem | null> {
    return this.items.get(id) || null;
  }

  async save(item: InventoryItem): Promise<InventoryItem> {
    this.items.set(item.id, item);
    return item;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async findAll(): Promise<InventoryItem[]> {
    return Array.from(this.items.values());
  }

  async getCategories(): Promise<string[]> {
    const categories = new Set<string>();
    for (const item of this.items.values()) {
      categories.add(item.category);
    }
    return Array.from(categories);
  }

  // Add the findSimilarItems method that's required by InventoryService
  async findSimilarItems(embedding: number[], limit: number = 5): Promise<{ item: InventoryItem; similarity: number }[]> {
    // In the mock, we'll just return all items with a placeholder similarity
    const items = Array.from(this.items.values());
    return items.slice(0, limit).map(item => ({
      item,
      similarity: 0.85 // Mock similarity value
    }));
  }

  // Add the updateQuantity method that's required by InventoryService
  async updateQuantity(id: string, quantity: number): Promise<boolean> {
    const item = this.items.get(id);
    if (!item) {
      return false;
    }
    
    item.quantity = quantity;
    item.lastupdated = new Date().toISOString();
    this.items.set(id, item);
    return true;
  }

  // Helper method for tests
  addTestItem(item: InventoryItem): void {
    this.items.set(item.id, item);
  }

  // Helper method for tests
  clear(): void {
    this.items.clear();
  }

  // Helper method to expose items for testing
  getItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }
} 