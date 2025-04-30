import { InventoryItem } from "@/models/InventoryItem";
import { describe, it, expect, beforeEach } from "@jest/globals";

export class MockInventoryRepository {
  private items: Map<string, InventoryItem> = new Map();

  async findByName(name: string): Promise<InventoryItem[]> {
    const items = Array.from(this.items.values());
    return items.filter(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );
  }

  async findById(id: string): Promise<InventoryItem | null> {
    return this.items.get(id) || null;
  }

  async save(item: InventoryItem): Promise<InventoryItem> {
    this.items.set(item.id, item);
    return item;
  }

  async update(
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem | null> {
    const item = this.items.get(id);
    if (!item) {
      return null;
    }

    const updatedItem = { ...item, ...updates };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async create(item: any): Promise<InventoryItem> {
    if (!item.id) {
      item.id = Math.random().toString(36).substring(2, 15);
    }

    const newItem = { ...item };
    this.items.set(newItem.id, newItem);
    return newItem;
  }

  async delete(id: string): Promise<boolean> {
    const exists = this.items.has(id);
    this.items.delete(id);
    return exists;
  }

  async findAll(): Promise<InventoryItem[]> {
    return Array.from(this.items.values());
  }

  async getAllItems(): Promise<InventoryItem[]> {
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
  async findSimilarItems(
    embedding: number[],
    limit: number = 5
  ): Promise<{ item: InventoryItem; similarity: number }[]> {
    // In the mock, we'll just return all items with a placeholder similarity
    const items = Array.from(this.items.values());
    return items.slice(0, limit).map((item) => ({
      item,
      similarity: 0.85, // Mock similarity value
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

describe("MockInventoryRepository", () => {
  let mockRepo: MockInventoryRepository;

  beforeEach(() => {
    mockRepo = new MockInventoryRepository();
  });

  it("should provide a mock implementation of InventoryRepository", () => {
    expect(mockRepo).toBeDefined();
    expect(typeof mockRepo.findById).toBe("function");
    expect(typeof mockRepo.save).toBe("function");
    expect(typeof mockRepo.update).toBe("function");
    expect(typeof mockRepo.create).toBe("function");
    expect(typeof mockRepo.delete).toBe("function");
    expect(typeof mockRepo.findAll).toBe("function");
    expect(typeof mockRepo.getAllItems).toBe("function");
    expect(typeof mockRepo.findByName).toBe("function");
    expect(typeof mockRepo.findSimilarItems).toBe("function");
    expect(typeof mockRepo.updateQuantity).toBe("function");
  });

  it("should save and retrieve items", async () => {
    const testItem: InventoryItem = {
      id: "test-id",
      name: "Test Item",
      quantity: 10,
      unit: "units",
      category: "Test",
      lastupdated: new Date().toISOString(),
      embedding: [],
    };

    await mockRepo.save(testItem);
    const retrievedItem = await mockRepo.findById("test-id");

    expect(retrievedItem).toEqual(testItem);
  });

  it("should update items", async () => {
    const testItem: InventoryItem = {
      id: "test-id",
      name: "Test Item",
      quantity: 10,
      unit: "units",
      category: "Test",
      lastupdated: new Date().toISOString(),
      embedding: [],
    };

    await mockRepo.save(testItem);

    const updates = {
      name: "Updated Item",
      quantity: 20,
    };

    const updatedItem = await mockRepo.update("test-id", updates);

    expect(updatedItem).toEqual({
      ...testItem,
      ...updates,
    });
  });
});
