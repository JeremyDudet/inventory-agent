// backend/src/services/inventoryService.ts
import { InventoryRepository } from '../repositories/InventoryRepository';
import { InventoryItem, InventoryItemInsert } from '../models/InventoryItem';

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

  async findById(id: string): Promise<InventoryItem | null> {
    return this.repository.findById(id);
  }

  async updateInventory(update: InventoryUpdate): Promise<{ success: boolean; message?: string }> {
    console.log(`📦 Updating inventory: ${update.action} ${update.quantity} ${update.unit} of ${update.item}`);

    try {
      // Find the item by name
      const items = await this.repository.findByName(update.item);
      if (!items || items.length === 0) {
        return { success: false, message: `Item "${update.item}" not found` };
      }

      const item = items[0];
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
          return { success: false, message: `Unknown action: ${update.action}` };
      }

      const success = await this.repository.updateQuantity(item.id, newQuantity);
      if (!success) {
        throw new Error('Failed to update inventory');
      }

      console.log(`📦 Successfully updated ${item.name} to ${newQuantity} ${update.unit}`);
      return { success: true };
    } catch (error) {
      console.error('📦 Error updating inventory:', error);
      return { success: false, message: 'Failed to update inventory' };
    }
  }

  async fetchInventory(): Promise<any[]> {
    return this.repository.getAll();
  }

  async addItem(item: InventoryItemInsert): Promise<{ success: boolean; message?: string; item?: any }> {
    try {
      const newItem = await this.repository.create({
        ...item,
        lastupdated: new Date().toISOString()
      });
      if (!newItem) {
        return { success: false, message: 'Failed to create inventory item' };
      }

      return { 
        success: true, 
        message: `Successfully added ${newItem.name}`,
        item: newItem
      };
    } catch (error) {
      console.error('Error adding inventory item:', error);
      return { success: false, message: 'Failed to add inventory item' };
    }
  }

  async deleteItem(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const success = await this.repository.delete(id);
      if (!success) {
        return { success: false, message: 'Failed to delete inventory item' };
      }

      return { success: true, message: 'Successfully deleted inventory item' };
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return { success: false, message: 'Failed to delete inventory item' };
    }
  }

  async getCategories(): Promise<string[]> {
    return this.repository.getCategories();
  }
}

export default new InventoryService();

