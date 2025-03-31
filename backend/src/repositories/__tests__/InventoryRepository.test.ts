import { InventoryRepository } from '../InventoryRepository';
import supabase from '../../config/db';
import { INVENTORY_TABLE } from '../../models/InventoryItem';

// Mock Supabase client
jest.mock('../../config/db', () => ({
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

describe('InventoryRepository', () => {
  let repository: InventoryRepository;

  beforeEach(() => {
    repository = new InventoryRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find an item by ID', async () => {
      const mockItem = {
        id: '123',
        name: 'Test Item',
        quantity: 10,
        unit: 'kg',
        category: 'Test',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.findById('123');

      expect(result).toEqual(mockItem);
      expect(supabase.from).toHaveBeenCalledWith(INVENTORY_TABLE);
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123');
    });

    it('should return null when item not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.findById('123');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find items by name using case-insensitive partial match', async () => {
      const mockItems = [
        { id: '1', name: 'Test Item 1' },
        { id: '2', name: 'Test Item 2' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.findByName('Test');

      expect(result).toEqual(mockItems);
      expect(supabase.from).toHaveBeenCalledWith(INVENTORY_TABLE);
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%Test%');
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', async () => {
      const mockItem = {
        id: '123',
        name: 'Test Item',
        quantity: 10,
      };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await repository.updateQuantity('123', 15);

      expect(supabase.from).toHaveBeenCalledWith(INVENTORY_TABLE);
      expect(mockQuery.update).toHaveBeenCalledWith({
        quantity: 15,
        lastupdated: expect.any(String),
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123');
    });
  });

  describe('create', () => {
    it('should create a new inventory item', async () => {
      const newItem = {
        name: 'New Item',
        quantity: 10,
        unit: 'kg',
        category: 'Test',
        lastupdated: new Date().toISOString(),
      };

      const mockCreatedItem = {
        id: '123',
        ...newItem,
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatedItem, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.create(newItem);

      expect(result).toEqual(mockCreatedItem);
      expect(supabase.from).toHaveBeenCalledWith(INVENTORY_TABLE);
      expect(mockQuery.insert).toHaveBeenCalledWith(newItem);
    });
  });

  describe('delete', () => {
    it('should delete an inventory item', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await repository.delete('123');

      expect(supabase.from).toHaveBeenCalledWith(INVENTORY_TABLE);
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123');
    });
  });

  describe('getAll', () => {
    it('should get all inventory items with pagination', async () => {
      const mockItems = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.getAll(0, 10);

      expect(result).toEqual(mockItems);
      expect(supabase.from).toHaveBeenCalledWith(INVENTORY_TABLE);
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('lastupdated', { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
    });
  });

  describe('getCategories', () => {
    it('should get all unique categories', async () => {
      const mockItems = [
        { category: 'Category 1' },
        { category: 'Category 2' },
        { category: 'Category 1' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.getCategories();

      expect(result).toEqual(['Category 1', 'Category 2']);
      expect(supabase.from).toHaveBeenCalledWith(INVENTORY_TABLE);
      expect(mockQuery.select).toHaveBeenCalledWith('category');
    });
  });
}); 