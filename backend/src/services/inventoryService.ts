// backend/src/services/inventoryService.ts
import { InventoryRepository } from '../repositories/InventoryRepository';
import { InventoryItem, InventoryItemInsert } from '../models/InventoryItem';
import { NotFoundError, ValidationError } from '../errors';
import { generateEmbedding } from '../utils/createEmbedding';

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
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(extractedItem);
    
    // Find similar items
    const similarItems = await this.repository.findSimilarItems(queryEmbedding, 5);
    
    if (similarItems.length === 0) {
      throw new NotFoundError(`No matching item found for "${extractedItem}"`);
    }
    
    // Convert distance to similarity (cosine similarity approximation)
    const bestMatch = similarItems[0];
    const similarity = 1 / (1 + bestMatch.distance);
    
    // Set a threshold (e.g., 0.8) for a confident match
    if (similarity > 0.8) {
      return bestMatch.item;
    } else {
      const suggestions = similarItems.map((s) => s.item.name).join(', ');
      throw new ValidationError(
        `Ambiguous match for "${extractedItem}". Possible matches: ${suggestions}`
      );
    }
  }

  async updateInventoryCount(update: InventoryUpdate): Promise<void> {
    console.log(`📦 Updating inventory: ${update.action} ${update.quantity} ${update.unit} of ${update.item}`);
    try {
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
      throw error;
    }
  }

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      // If the name is being updated, regenerate the embedding
      if (updates.name) {
        updates.embedding = await generateEmbedding(updates.name);
      }

      // Add lastupdated timestamp
      updates.lastupdated = new Date().toISOString();

      const updatedItem = await this.repository.update(id, updates);
      if (!updatedItem) {
        throw new ValidationError('Failed to update inventory item');
      }
      return updatedItem;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw new ValidationError('Failed to update inventory item');
    }
  }

  async fetchInventory(): Promise<InventoryItem[]> {
    return this.repository.getAll();
  }

  async addItem(item: InventoryItemInsert): Promise<InventoryItem> {
    try {
      const embedding = await generateEmbedding(item.name);
      const newItem = await this.repository.create({
        ...item,
        embedding, // Store the embedding
        lastupdated: new Date().toISOString(),
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

