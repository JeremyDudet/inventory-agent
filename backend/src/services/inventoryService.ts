// backend/src/services/inventoryService.ts
import { InventoryRepository } from '../repositories/InventoryRepository';
import { InventoryItem, InventoryItemInsert } from '../models/InventoryItem';
import { NotFoundError, ValidationError } from '../errors';

interface InventoryUpdate {
  action: string;
  item: string;
  quantity: number;
  unit: string;
}

class InventoryService {
  private repository: InventoryRepository;

  constructor() {
    this.repository = new InventoryRepository();
  }

  async findById(id: string): Promise<InventoryItem> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundError(`Inventory item with ID ${id} not found`);
    }
    return item;
  }

  async findBestMatch(extractedItem: string): Promise<InventoryItem> {
    const allItems = await this.repository.getAll();
    
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

  async updateInventory(update: InventoryUpdate): Promise<void> {
    console.log(`📦 Updating inventory: ${update.action} ${update.quantity} ${update.unit} of ${update.item}`);

    try {
      // Find the item using smart matching
      const item = await this.findBestMatch(update.item);
      let newQuantity: number;

      switch (update.action.toLowerCase()) {
        case 'add':
          newQuantity = item.quantity + update.quantity;
          break;
        case 'remove':
          newQuantity = Math.max(0, item.quantity - update.quantity);
          break;
        case 'set':
          newQuantity = update.quantity;
          break;
        default:
          throw new ValidationError(`Invalid action: ${update.action}`);
      }

      const success = await this.repository.updateQuantity(item.id, newQuantity);
      if (!success) {
        throw new ValidationError('Failed to update inventory quantity');
      }

      console.log(`📦 Successfully updated ${item.name} to ${newQuantity} ${update.unit}`);
    } catch (error) {
      console.error('📦 Error updating inventory:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError
        ? error
        : new ValidationError('Failed to update inventory');
    }
  }

  async fetchInventory(): Promise<InventoryItem[]> {
    return this.repository.getAll();
  }

  async addItem(item: InventoryItemInsert): Promise<InventoryItem> {
    try {
      const newItem = await this.repository.create({
        ...item,
        lastupdated: new Date().toISOString()
      });
      
      if (!newItem) {
        throw new ValidationError('Failed to create inventory item');
      }

      return newItem;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw new ValidationError('Failed to add inventory item');
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      const success = await this.repository.delete(id);
      if (!success) {
        throw new ValidationError('Failed to delete inventory item');
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw new ValidationError('Failed to delete inventory item');
    }
  }

  async getCategories(): Promise<string[]> {
    return this.repository.getCategories();
  }
}

export default new InventoryService();

