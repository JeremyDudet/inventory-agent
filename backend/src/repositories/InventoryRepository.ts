import supabase from '../config/db';
import { INVENTORY_TABLE, InventoryItem, InventoryItemInsert } from '../models/InventoryItem';

export class InventoryRepository {
  async findById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error finding item by ID:', error);
      return null;
    }

    return data;
  }

  async findByName(name: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select('*')
      .ilike('name', `%${name}%`)
      .limit(1);

    if (error) {
      console.error('Error finding items by name:', error);
      return [];
    }

    return data || [];
  }

  async updateQuantity(id: string, quantity: number): Promise<boolean> {
    const { error } = await supabase
      .from(INVENTORY_TABLE)
      .update({
        quantity,
        lastupdated: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating item quantity:', error);
      return false;
    }

    return true;
  }

  async create(item: InventoryItemInsert): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .insert({
        ...item,
        lastupdated: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory item:', error);
      return null;
    }

    return data;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(INVENTORY_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting inventory item:', error);
      return false;
    }

    return true;
  }

  async getAll(offset: number = 0, limit: number = 100): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select('*')
      .order('lastupdated', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching inventory items:', error);
      return [];
    }

    return data || [];
  }

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select('category')
      .order('category')
      .limit(100);

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    // Extract unique categories
    return Array.from(new Set(data?.map(item => item.category) || []));
  }
} 