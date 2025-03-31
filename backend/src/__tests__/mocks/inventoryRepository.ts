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

  // Helper method for tests
  addTestItem(item: InventoryItem): void {
    this.items.set(item.id, item);
  }

  // Helper method for tests
  clear(): void {
    this.items.clear();
  }
} 