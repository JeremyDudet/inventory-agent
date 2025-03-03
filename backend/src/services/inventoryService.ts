// backend/src/services/inventoryService.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
        .from('inventory')
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
        .from('inventory')
        .update({
          quantity: newQuantity,
          unit: update.unit, // Update unit if changed
          last_updated: new Date().toISOString()
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
      .from('inventory')
      .select('*')
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('📦 Error fetching inventory:', error);
      return [];
    }

    return data || [];
  }
}

export default new InventoryService();