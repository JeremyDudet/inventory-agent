// backend/src/__tests__/repositories/InventoryRepository.test.ts
import { InventoryRepository } from "@/repositories/InventoryRepository";
import supabase from "@/config/supabase";
import { INVENTORY_TABLE } from "@/types/InventoryItem";

// Mock Supabase client
jest.mock("../../src/config/db", () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
}));

describe("InventoryRepository", () => {
  let repository: InventoryRepository;

  beforeEach(() => {
    repository = new InventoryRepository();
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should return the item when found by ID", async () => {
      // Arrange
      const mockItem = {
        id: "123",
        name: "Test Item",
        quantity: 10,
        unit: "kg",
        category: "Test",
      };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await repository.findById("123");

      // Assert
      expect(result).toEqual(mockItem);
      expect(supabase.from).toHaveBeenCalledWith(INVENTORY_TABLE);
      expect(mockQuery.select).toHaveBeenCalledWith("*");
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "123");
    });

    it("should return null when item is not found", async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await repository.findById("123");

      // Assert
      expect(result).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      // Arrange
      const mockError = { message: "Database error" };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      const result = await repository.findById("123");

      // Assert
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Error finding item by ID:",
        mockError
      );
      consoleSpy.mockRestore();
    });
  });

  describe("findByName", () => {
    it("should find items by name with case-insensitive partial match", async () => {
      // Arrange
      const mockItems = [
        { id: "1", name: "Test Item 1" },
        { id: "2", name: "Test Item 2" },
      ];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await repository.findByName("Test");

      // Assert
      expect(result).toEqual(mockItems);
      expect(mockQuery.ilike).toHaveBeenCalledWith("name", "%Test%");
    });

    it("should return empty array when no items match", async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await repository.findByName("Nonexistent");

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle empty search string", async () => {
      // Arrange
      const mockItems = [{ id: "1", name: "Item" }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await repository.findByName("");

      // Assert
      expect(result).toEqual(mockItems);
      expect(mockQuery.ilike).toHaveBeenCalledWith("name", "%%");
    });
  });

  describe("updateQuantity", () => {
    it("should update item quantity successfully", async () => {
      // Arrange
      const mockItem = { id: "123", name: "Test Item", quantity: 15 };
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      await repository.updateQuantity("123", 15);

      // Assert
      expect(mockQuery.update).toHaveBeenCalledWith({
        quantity: 15,
        lastupdated: expect.any(String),
      });
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "123");
    });

    it("should handle database errors during update", async () => {
      // Arrange
      const mockError = { message: "Update failed" };
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      await repository.updateQuantity("123", 15);

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        "Error updating item quantity:",
        mockError
      );
      consoleSpy.mockRestore();
    });
  });

  describe("create", () => {
    it("should create a new inventory item successfully", async () => {
      // Arrange
      const newItem = {
        name: "New Item",
        quantity: 10,
        unit: "kg",
        category: "Test",
        lastupdated: expect.any(String),
      };
      const mockCreatedItem = { id: "123", ...newItem };
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: mockCreatedItem, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await repository.create(newItem);

      // Assert
      expect(result).toEqual(mockCreatedItem);
      expect(mockQuery.insert).toHaveBeenCalledWith(newItem);
    });

    it("should handle invalid data", async () => {
      // Arrange
      const invalidItem = {
        name: "",
        quantity: -5,
        unit: "kg",
        category: "Test",
      };

      // Act & Assert
      await expect(repository.create(invalidItem)).rejects.toThrow(
        "Item name is required and must be a non-empty string"
      );
    });
  });

  describe("delete", () => {
    it("should delete an inventory item successfully", async () => {
      // Arrange
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      await repository.delete("123");

      // Assert
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "123");
    });

    it("should handle deletion errors", async () => {
      // Arrange
      const mockError = { message: "Delete failed" };
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      await repository.delete("123");

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        "Error deleting inventory item:",
        mockError
      );
      consoleSpy.mockRestore();
    });
  });

  describe("getAllItems", () => {
    it("should get all inventory items with pagination", async () => {
      // Arrange
      const mockItems = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await repository.getAllItems(0, 10);

      // Assert
      expect(result).toEqual(mockItems);
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
    });

    it("should handle different pagination parameters", async () => {
      // Arrange
      const mockItems = [{ id: "3", name: "Item 3" }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await repository.getAllItems(10, 5);

      // Assert
      expect(result).toEqual(mockItems);
      expect(mockQuery.range).toHaveBeenCalledWith(10, 14);
    });

    it("should return empty array when no items exist", async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

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
        { category: "Category 1" },
      ];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await repository.getCategories();

      // Assert
      expect(result).toEqual([
        { id: "Category 1", name: "Category 1" },
        { id: "Category 2", name: "Category 2" },
      ]);
    });

    it("should return empty array when no items exist", async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await repository.getCategories();

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle null categories", async () => {
      // Arrange
      const mockItems = [{ category: null }, { category: "Category 1" }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await repository.getCategories();

      // Assert
      expect(result).toEqual([{ id: "Category 1", name: "Category 1" }]);
    });
  });
});
