// backend/src/services/inventoryService.ts
import { InventoryRepository } from '../repositories/InventoryRepository';
import { InventoryItem, InventoryItemInsert } from '../models/InventoryItem';
import { NotFoundError, ValidationError } from '../errors';
import { generateEmbedding } from '../utils/createEmbedding';
import { getUnitType, convertQuantity } from '../utils/unitConversions';

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
    const queryEmbedding = await generateEmbedding(extractedItem);
    const similarItems = await this.repository.findSimilarItems(queryEmbedding, 5);
  
    if (similarItems.length === 0) {
      throw new NotFoundError(`No matching item found for "${extractedItem}"`);
    }
  
    const bestMatch = similarItems[0];
    const similarity = 1 / (1 + bestMatch.distance);
  
    if (similarity >= 0.6) { // Lowered from 0.8 to 0.6
      return bestMatch.item;
    } else {
      const suggestions = similarItems.map((s) => s.item.name).join(', ');
      throw new ValidationError(`Ambiguous match for "${extractedItem}". Possible matches: ${suggestions}`);
    }
  }

  async updateInventoryCount(update: InventoryUpdate): Promise<void> {
    console.log(`📦 Updating inventory: ${update.action} ${update.quantity} ${update.unit} of ${update.item}`);
    try {
      const item = await this.findBestMatch(update.item);

      // If unit is not specified, assume it's the item's stored unit
      if (!update.unit) {
        update.unit = item.unit;
      }

      const itemUnitType = getUnitType(item.unit);
      const updateUnitType = getUnitType(update.unit);

      if (itemUnitType === 'unknown' || updateUnitType === 'unknown') {
        throw new ValidationError(`Unknown unit: ${item.unit} or ${update.unit}`);
      }

      if (itemUnitType !== updateUnitType) {
        throw new ValidationError(`Incompatible units: item is in ${item.unit} (${itemUnitType}), update is in ${update.unit} (${updateUnitType})`);
      }

      let quantityToUpdate = update.quantity;
      if (update.unit !== item.unit) {
        quantityToUpdate = convertQuantity(update.quantity, update.unit, item.unit);
      }

      let newQuantity: number;
      switch (update.action.toLowerCase()) {
        case 'add':
          newQuantity = item.quantity + quantityToUpdate;
          break;
        case 'remove':
          newQuantity = Math.max(0, item.quantity - quantityToUpdate);
          break;
        case 'set':
          newQuantity = quantityToUpdate;
          break;
        default:
          throw new ValidationError(`Invalid action: ${update.action}`);
      }

      const success = await this.repository.updateQuantity(item.id, newQuantity);
      if (!success) {
        throw new ValidationError('Failed to update inventory quantity');
      }
      console.log(`📦 Successfully updated ${item.name} to ${newQuantity} ${item.unit}`);
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

  async getItemQuantity(itemName: string, requestedUnit?: string): Promise<{ quantity: number; unit: string }> {
    try {
      const item = await this.findBestMatch(itemName);
  
      if (!requestedUnit || requestedUnit === item.unit) {
        return { quantity: item.quantity, unit: item.unit };
      }
  
      const itemUnitType = getUnitType(item.unit);
      const requestedUnitType = getUnitType(requestedUnit);
  
      if (itemUnitType === 'unknown' || requestedUnitType === 'unknown') {
        throw new ValidationError(`Unknown unit: ${item.unit} or ${requestedUnit}`);
      }
  
      if (itemUnitType !== requestedUnitType) {
        throw new ValidationError(`Incompatible units: item is in ${item.unit} (${itemUnitType}), requested is ${requestedUnit} (${requestedUnitType})`);
      }
  
      const convertedQuantity = convertQuantity(item.quantity, item.unit, requestedUnit);
      return { quantity: convertedQuantity, unit: requestedUnit };
    } catch (error) {
      console.error('📦 Error retrieving item quantity:', error);
      throw error;
    }
  }
}

export default new InventoryService();

