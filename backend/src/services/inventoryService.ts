// backend/src/services/inventoryService.ts
import stringSimilarity from 'string-similarity';
import { logSystemAction } from './sessionLogsService';
import { InventoryRepository } from '../repositories/InventoryRepository';
import { InventoryItem, InventoryItemInsert } from '../models/InventoryItem';
import { NotFoundError, ValidationError } from '../errors';
import { generateEmbedding } from '../utils/createEmbedding';
import { preprocessText } from '../utils/preprocessText';
import { getUnitType, convertQuantity } from '../utils/unitConversions';
import websocketService from './websocketService';

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
    console.log(`🔍 Finding best match for: "${extractedItem}"`);
    const queryEmbedding = await generateEmbedding(extractedItem);
    const similarItems = await this.repository.findSimilarItems(queryEmbedding, 5);
  
    if (similarItems.length === 0) {
      console.log('🔍 No similar items found in database');
      throw new NotFoundError(`No matching item found for "${extractedItem}"`);
    }
  
    const preprocessedExtracted = preprocessText(extractedItem);
    console.log(`🔍 Preprocessed transcribed item: "${preprocessedExtracted}"`);
  
    let bestMatch: { item: InventoryItem; combinedSimilarity: number } | null = null;
    let maxCombinedSimilarity = 0;
  
    for (const simItem of similarItems) {
      const embeddingSimilarity = simItem.similarity; // Use similarity directly (0 to 1)
      const preprocessedDbItem = preprocessText(simItem.item.name);
      console.log(`🔍 Comparing to: "${simItem.item.name}" (preprocessed: "${preprocessedDbItem}")`);
  
      const extractedTokens = preprocessedExtracted.split(' ');
      const dbTokens = preprocessedDbItem.split(' ');
      const commonTokens = extractedTokens.filter(token => dbTokens.includes(token));
      const tokenSimilarity = commonTokens.length / Math.max(extractedTokens.length, dbTokens.length);
  
      const combinedSimilarity = 0.7 * embeddingSimilarity + 0.3 * tokenSimilarity;
      console.log(`🔍 Embedding similarity: ${embeddingSimilarity}, Token similarity: ${tokenSimilarity}, Combined: ${combinedSimilarity}`);
  
      if (combinedSimilarity > maxCombinedSimilarity) {
        maxCombinedSimilarity = combinedSimilarity;
        bestMatch = { item: simItem.item, combinedSimilarity };
      }
    }
  
    if (bestMatch && bestMatch.combinedSimilarity >= 0.6) {
      // Fetch the full item details using the id
      const fullItem = await this.repository.findById(bestMatch.item.id);
      if (!fullItem) {
        throw new NotFoundError(`Item with id ${bestMatch.item.id} not found`);
      }
      console.log(`🔍 Best match found: "${fullItem.name}" with similarity ${bestMatch.combinedSimilarity}`);
      return fullItem;
    } else {
      const suggestions = similarItems.map(s => s.item.name).join(', ');
      console.log(`🔍 Ambiguous match, suggestions: ${suggestions}`);
      throw new ValidationError(`Ambiguous match for "${extractedItem}". Possible matches: ${suggestions}`);
    }
  }

  async updateInventoryCount(update: InventoryUpdate, req?: any): Promise<void> {
    console.log(`📦 Updating inventory: ${update.action} ${update.quantity} ${update.unit || 'unspecified unit'} of ${update.item}`);
    try {
      const item = await this.findBestMatch(update.item);
      
      console.log(`📦 Found item in database: ${item.name} (current: ${item.quantity} ${item.unit || 'no unit'})`);

      // If unit is not specified, assume it's the item's stored unit
      if (!update.unit) {
        update.unit = item.unit;
        console.log(`📦 No unit specified in update, using item's unit: ${item.unit}`);
      }

      // Handle case where both units are undefined
      if (!update.unit && !item.unit) {
        throw new ValidationError(`Unit missing: item.unit=${item.unit}, update.unit=${update.unit}`);
      }

      console.log(`📦 Item unit: "${item.unit}", Update unit: "${update.unit}"`);
      const itemUnitType = getUnitType(item.unit);
      const updateUnitType = getUnitType(update.unit);
      console.log(`📦 Item unit type: "${itemUnitType}", Update unit type: "${updateUnitType}"`);

      if (itemUnitType === 'unknown' || updateUnitType === 'unknown') {
        throw new ValidationError(`Unknown unit: ${item.unit} or ${update.unit}`);
      }

      if (itemUnitType !== updateUnitType) {
        throw new ValidationError(`Incompatible units: item is in ${item.unit} (${itemUnitType}), update is in ${update.unit} (${updateUnitType})`);
      }

      let quantityToUpdate = update.quantity;
      if (update.unit !== item.unit) {
        quantityToUpdate = convertQuantity(update.quantity, update.unit, item.unit);
        console.log(`📦 Converting quantity: ${update.quantity} ${update.unit} → ${quantityToUpdate} ${item.unit}`);
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
      await logSystemAction(
        'Inventory Update',
        `${'User'} ${update.action}ed ${quantityToUpdate} ${item.unit} of ${item.name}`,
        'success',
        undefined
      );
      
      // Send WebSocket success message
      const successMessage = {
        type: 'inventoryUpdate',
        status: 'success',
        data: { 
          item: item.name, 
          quantity: newQuantity, 
          unit: item.unit,
          action: update.action,
          id: item.id
        },
        timestamp: Date.now()
      };
      websocketService.broadcastToVoiceClients('inventory-updated', successMessage);
      
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
    return this.repository.getAllItems();
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

