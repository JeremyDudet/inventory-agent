// backend/src/__tests__/repositories/InventoryRepository.test.ts
import { InventoryRepository } from "@/repositories/InventoryRepository";
import db from "@/db";
import { inventory_items, inventory_updates } from "@/db/schema";
import { eq, ilike, desc, isNull } from "drizzle-orm";

// Mock the db module
jest.mock("@/db");

// Mock Drizzle operators
jest.mock("drizzle-orm", () => ({
  eq: jest.fn((field, value) => ({ type: "eq", field, value })),
  ilike: jest.fn((field, value) => ({ type: "ilike", field, value })),
  desc: jest.fn((field) => ({ type: "desc", field })),
  isNull: jest.fn((field) => ({ type: "isNull", field })),
  sql: jest.fn((strings, ...values) => ({ type: "sql", strings, values })),
}));

describe("InventoryRepository", () => {
  let repository: InventoryRepository;
  
  // Create mock chain methods
  const mockSelectChain = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
  };

  const mockUpdateChain = {
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };

  const mockInsertChain = {
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };

  const mockDeleteChain = {
    where: jest.fn(),
  };

  const mockSelectDistinctChain = {
    from: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    repository = new InventoryRepository();
    jest.clearAllMocks();
    
    // Reset all mocks
    (db.select as jest.Mock).mockReturnValue(mockSelectChain);
    (db.update as jest.Mock).mockReturnValue(mockUpdateChain);
    (db.insert as jest.Mock).mockReturnValue(mockInsertChain);
    (db.delete as jest.Mock).mockReturnValue(mockDeleteChain);
    (db.selectDistinct as jest.Mock).mockReturnValue(mockSelectDistinctChain);
  });

  describe("findById", () => {
    it("should return the item when found by ID", async () => {
      // Arrange
      const mockDbItem = {
        id: "123",
        name: "Test Item",
        quantity: "10",
        unit: "kg",
        category: "Test",
        threshold: "5",
        last_updated: "2024-01-01T00:00:00Z",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      mockSelectChain.limit.mockResolvedValue([mockDbItem]);

      // Act
      const result = await repository.findById("123");

      // Assert
      expect(result).toEqual({
        ...mockDbItem,
        quantity: "10",
        threshold: "5",
      });
      expect(db.select).toHaveBeenCalled();
      expect(mockSelectChain.from).toHaveBeenCalledWith(inventory_items);
      expect(mockSelectChain.where).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith(inventory_items.id, "123");
      expect(mockSelectChain.limit).toHaveBeenCalledWith(1);
    });

    it("should return null when item is not found", async () => {
      // Arrange
      mockSelectChain.limit.mockResolvedValue([]);

      // Act
      const result = await repository.findById("123");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("findByName", () => {
    it("should find items by name with case-insensitive partial match", async () => {
      // Arrange
      const mockItems = [
        {
          id: "1",
          name: "Test Item 1",
          quantity: "5",
          unit: "kg",
          category: "Test",
        },
        {
          id: "2",
          name: "Test Item 2",
          quantity: "10",
          unit: "kg",
          category: "Test",
        },
      ];
      mockSelectChain.limit.mockResolvedValue(mockItems);

      // Act
      const result = await repository.findByName("Test");

      // Assert
      expect(result).toHaveLength(2);
      expect(ilike).toHaveBeenCalledWith(inventory_items.name, "%Test%");
      expect(mockSelectChain.limit).toHaveBeenCalledWith(1);
    });

    it("should return empty array when no items match", async () => {
      // Arrange
      mockSelectChain.limit.mockResolvedValue([]);

      // Act
      const result = await repository.findByName("Nonexistent");

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle empty search string", async () => {
      // Arrange
      const mockItems = [{ id: "1", name: "Item", quantity: "5" }];
      mockSelectChain.limit.mockResolvedValue(mockItems);

      // Act
      const result = await repository.findByName("");

      // Assert
      expect(result).toHaveLength(1);
      expect(ilike).toHaveBeenCalledWith(inventory_items.name, "%%");
    });
  });

  describe("updateQuantity", () => {
    it("should update item quantity successfully", async () => {
      // Arrange
      const mockUpdatedItem = {
        id: "123",
        name: "Test Item",
        quantity: "15",
        last_updated: expect.any(String),
        updated_at: expect.any(String),
      };
      mockUpdateChain.returning.mockResolvedValue([mockUpdatedItem]);

      // Act
      const result = await repository.updateQuantity("123", 15);

      // Assert
      expect(db.update).toHaveBeenCalledWith(inventory_items);
      expect(mockUpdateChain.set).toHaveBeenCalledWith({
        quantity: "15",
        last_updated: expect.any(String),
        updated_at: expect.any(String),
      });
      expect(mockUpdateChain.where).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith(inventory_items.id, "123");
      expect(mockUpdateChain.returning).toHaveBeenCalled();
      expect(result?.quantity).toBe("15");
    });

    it("should return null when update fails", async () => {
      // Arrange
      mockUpdateChain.returning.mockResolvedValue([]);

      // Act
      const result = await repository.updateQuantity("123", 15);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("createItem", () => {
    it("should create a new inventory item successfully", async () => {
      // Arrange
      const newItem = {
        name: "New Item",
        quantity: "10",
        unit: "kg",
        category: "Test",
        location_id: "loc1"
      };
      const mockCreatedItem = {
        id: "123",
        ...newItem,
        quantity: "10",
        last_updated: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      };
      mockInsertChain.returning.mockResolvedValue([mockCreatedItem]);

      // Act
      const result = await repository.createItem(newItem);

      // Assert
      expect(result).not.toBeNull();
      expect(db.insert).toHaveBeenCalledWith(inventory_items);
      expect(mockInsertChain.values).toHaveBeenCalledWith(expect.objectContaining({
        name: "New Item",
        quantity: "10",
        unit: "kg",
        category: "Test",
        location_id: "loc1",
        last_updated: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      }));
      expect(mockInsertChain.returning).toHaveBeenCalled();
    });

    it("should handle invalid data - empty name", async () => {
      // Arrange
      const invalidItem = {
        name: "",
        quantity: "5",
        unit: "kg",
        category: "Test",
        location_id: "loc1"
      };

      // Act & Assert
      await expect(repository.createItem(invalidItem)).rejects.toThrow(
        "Item name is required and must be a non-empty string"
      );
    });

    it("should handle invalid data - negative quantity", async () => {
      // Arrange
      const invalidItem = {
        name: "Test Item",
        quantity: "-5",
        unit: "kg",
        category: "Test",
        location_id: "loc1"
      };

      // Act & Assert
      await expect(repository.createItem(invalidItem)).rejects.toThrow(
        "Quantity must be a non-negative number"
      );
    });
  });

  describe("deleteItem", () => {
    it("should delete an inventory item successfully", async () => {
      // Arrange
      const mockResult = { count: 1 };
      mockDeleteChain.where.mockResolvedValue(mockResult);

      // Act
      const result = await repository.deleteItem("123");

      // Assert
      expect(db.delete).toHaveBeenCalledWith(inventory_items);
      expect(mockDeleteChain.where).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith(inventory_items.id, "123");
      expect(result).toBe(true);
    });

    it("should return false when item not found", async () => {
      // Arrange
      const mockResult = { count: 0 };
      mockDeleteChain.where.mockResolvedValue(mockResult);

      // Act
      const result = await repository.deleteItem("123");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getAllItems", () => {
    it("should get all inventory items with pagination", async () => {
      // Arrange
      const mockItems = [
        { id: "1", name: "Item 1", quantity: "5" },
        { id: "2", name: "Item 2", quantity: "10" },
      ];
      mockSelectChain.offset.mockResolvedValue(mockItems);

      // Act
      const result = await repository.getAllItems(0, 10);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockSelectChain.orderBy).toHaveBeenCalled();
      expect(desc).toHaveBeenCalledWith(inventory_items.last_updated);
      expect(mockSelectChain.limit).toHaveBeenCalledWith(10);
      expect(mockSelectChain.offset).toHaveBeenCalledWith(0);
    });

    it("should handle different pagination parameters", async () => {
      // Arrange
      const mockItems = [{ id: "3", name: "Item 3", quantity: "15" }];
      mockSelectChain.offset.mockResolvedValue(mockItems);

      // Act
      const result = await repository.getAllItems(10, 5);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockSelectChain.limit).toHaveBeenCalledWith(5);
      expect(mockSelectChain.offset).toHaveBeenCalledWith(10);
    });

    it("should return empty array when no items exist", async () => {
      // Arrange
      mockSelectChain.offset.mockResolvedValue([]);

      // Act
      const result = await repository.getAllItems(0, 10);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("getCategories", () => {
    it("should return unique categories", async () => {
      // Arrange
      const mockItems = [
        { category: "Category 1" },
        { category: "Category 2" },
      ];
      mockSelectDistinctChain.limit.mockResolvedValue(mockItems);

      // Act
      const result = await repository.getCategories();

      // Assert
      expect(result).toEqual([
        { id: "Category 1", name: "Category 1" },
        { id: "Category 2", name: "Category 2" },
      ]);
      expect(db.selectDistinct).toHaveBeenCalledWith({
        category: inventory_items.category,
      });
      expect(mockSelectDistinctChain.from).toHaveBeenCalledWith(inventory_items);
      expect(mockSelectDistinctChain.orderBy).toHaveBeenCalledWith(inventory_items.category);
      expect(mockSelectDistinctChain.limit).toHaveBeenCalledWith(100);
    });

    it("should return empty array when no items exist", async () => {
      // Arrange
      mockSelectDistinctChain.limit.mockResolvedValue([]);

      // Act
      const result = await repository.getCategories();

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle null categories", async () => {
      // Arrange
      const mockItems = [{ category: null }, { category: "Category 1" }];
      mockSelectDistinctChain.limit.mockResolvedValue(mockItems);

      // Act
      const result = await repository.getCategories();

      // Assert
      expect(result).toEqual([{ id: "Category 1", name: "Category 1" }]);
    });
  });

  describe("updateItem", () => {
    it("should update an item successfully", async () => {
      // Arrange
      const updates = {
        name: "Updated Item",
        quantity: "20",
        threshold: "10",
      };
      const mockUpdatedItem = {
        id: "123",
        name: "Updated Item",
        quantity: "20",
        threshold: "10",
        updated_at: expect.any(String),
      };
      mockUpdateChain.returning.mockResolvedValue([mockUpdatedItem]);

      // Act
      const result = await repository.updateItem("123", updates);

      // Assert
      expect(db.update).toHaveBeenCalledWith(inventory_items);
      expect(mockUpdateChain.set).toHaveBeenCalledWith({
        name: "Updated Item",
        quantity: "20",
        threshold: "10",
        updated_at: expect.any(String),
      });
      expect(mockUpdateChain.where).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith(inventory_items.id, "123");
      expect(result).not.toBeNull();
    });
  });

  describe("getItemsWithoutEmbeddings", () => {
    it("should return items without embeddings", async () => {
      // Arrange
      const mockItems = [
        { id: "1", name: "Item 1", embedding: null },
        { id: "2", name: "Item 2", embedding: null },
      ];
      // No chaining after where in this method
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockItems),
        }),
      });

      // Act
      const result = await repository.getItemsWithoutEmbeddings();

      // Assert
      expect(result).toHaveLength(2);
      expect(isNull).toHaveBeenCalledWith(inventory_items.embedding);
    });
  });

  describe("getItemsByLocation", () => {
    it("should get items by location with pagination", async () => {
      // Arrange
      const mockItems = [
        { id: "1", name: "Item 1", location_id: "loc1" },
        { id: "2", name: "Item 2", location_id: "loc1" },
      ];
      mockSelectChain.offset.mockResolvedValue(mockItems);

      // Act
      const result = await repository.getItemsByLocation("loc1", 0, 10);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockSelectChain.where).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith(inventory_items.location_id, "loc1");
      expect(mockSelectChain.orderBy).toHaveBeenCalled();
      expect(desc).toHaveBeenCalledWith(inventory_items.last_updated);
      expect(mockSelectChain.limit).toHaveBeenCalledWith(10);
      expect(mockSelectChain.offset).toHaveBeenCalledWith(0);
    });
  });

  describe("findSimilarItems", () => {
    it("should find similar items using vector similarity", async () => {
      // Arrange
      const mockEmbedding = new Array(1536).fill(0.1);
      const mockResults = [
        { id: "1", name: "Similar Item 1", similarity: 0.9 },
        { id: "2", name: "Similar Item 2", similarity: 0.8 },
      ];
      (db.execute as jest.Mock).mockResolvedValue(mockResults);

      // Act
      const result = await repository.findSimilarItems(mockEmbedding, 5);

      // Assert
      expect(result).toHaveLength(2);
      expect(db.execute).toHaveBeenCalled();
      expect(result[0].similarity).toBe(0.9);
      expect(result[1].similarity).toBe(0.8);
    });
  });

  describe("createInventoryUpdate", () => {
    it("should create an inventory update record", async () => {
      // Arrange
      const mockInsertInventoryUpdate = {
        values: jest.fn().mockResolvedValue({}),
      };
      (db.insert as jest.Mock).mockReturnValue(mockInsertInventoryUpdate);

      // Act
      await repository.createInventoryUpdate(
        "item123",
        "add",
        10,
        15,
        5,
        "kg",
        "user123",
        "John Doe"
      );

      // Assert
      expect(db.insert).toHaveBeenCalledWith(inventory_updates);
      expect(mockInsertInventoryUpdate.values).toHaveBeenCalledWith({
        item_id: "item123",
        action: "add",
        previous_quantity: "10",
        new_quantity: "15",
        quantity: "5",
        unit: "kg",
        user_name: "John Doe",
        user_id: "user123",
        created_at: expect.any(String),
      });
    });
  });
});