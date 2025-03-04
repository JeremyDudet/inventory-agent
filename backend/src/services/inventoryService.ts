// backend/src/services/inventoryService.ts
import supabase from '../config/db';
import { INVENTORY_TABLE } from '../models/InventoryItem';

interface InventoryUpdate {
  action: string;
  item: string;
  quantity: number;
  unit: string;
}

class InventoryService {
  async updateInventory(update: InventoryUpdate): Promise<{ success: boolean; message?: string }> {
    console.log(`📦 Updating inventory: ${update.action} ${update.quantity} ${update.unit} of ${update.item}`);

    try {
      // Find the item (case-insensitive partial match)
      const { data: items, error: fetchError } = await supabase
        .from(INVENTORY_TABLE)
        .select('*')
        .ilike('name', `%${update.item}%`)
        .limit(1);

      if (fetchError) throw fetchError;
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

      const { error: updateError } = await supabase
        .from(INVENTORY_TABLE)
        .update({
          quantity: newQuantity,
          unit: update.unit, // Update unit if changed
          lastupdated: new Date().toISOString()
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      console.log(`📦 Successfully updated ${item.name} to ${newQuantity} ${update.unit}`);
      return { success: true };
    } catch (error) {
      console.error('📦 Error updating inventory:', error);
      return { success: false, message: 'Failed to update inventory' };
    }
  }

  async fetchInventory(): Promise<any[]> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select('*')
      .order('lastupdated', { ascending: false });

    if (error) {
      console.error('📦 Error fetching inventory:', error);
      return [];
    }

    return data || [];
  }
}

export default new InventoryService();