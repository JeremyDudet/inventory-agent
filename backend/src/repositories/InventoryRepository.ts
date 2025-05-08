// backend/src/repositories/InventoryRepository.ts
import supabase from "../config/db";
import {
  INVENTORY_TABLE,
  InventoryItem,
  InventoryItemInsert,
} from "../models/InventoryItem";

export class InventoryRepository {
  async findSimilarItems(
    embedding: number[],
    limit: number = 5
  ): Promise<{ item: InventoryItem; similarity: number }[]> {
    const { data, error } = await supabase.rpc("match_items", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
    });

    if (error) {
      throw new Error(`Error performing similarity search: ${error.message}`);
    }

    return data.map((row: any) => ({
      item: row as InventoryItem,
      similarity: row.similarity,
    }));
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error finding item by ID:", error);
      return null;
    }

    return data;
  }

  async findByName(name: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select("*")
      .ilike("name", `%${name}%`)
      .limit(1);

    if (error) {
      console.error("Error finding items by name:", error);
      return [];
    }

    return data || [];
  }

  async updateQuantity(
    id: string,
    quantity: number
  ): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .update({
        quantity,
        lastupdated: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating item quantity:", error);
      return null;
    }

    return data;
  }

  async create(item: InventoryItemInsert): Promise<InventoryItem | null> {
    if (
      !item.name ||
      typeof item.name !== "string" ||
      item.name.trim() === ""
    ) {
      throw new Error("Item name is required and must be a non-empty string");
    }
    if (typeof item.quantity !== "number" || item.quantity < 0) {
      throw new Error("Quantity must be a non-negative number");
    }

    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .insert({ ...item, lastupdated: new Date().toISOString() })
      .select()
      .single();

    if (error) {
      console.error("Error creating inventory item:", error);
      return null;
    }

    return data;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(INVENTORY_TABLE)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting inventory item:", error);
      return false;
    }

    return true;
  }

  async getAllItems(
    offset: number = 0,
    limit: number = 100
  ): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select("*")
      .order("lastupdated", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching inventory items:", error);
      return [];
    }

    return data || [];
  }

  async getCategories(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select("category")
      .order("category")
      .limit(100);

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    // Filter out null/undefined categories and ensure uniqueness
    const uniqueCategories = Array.from(
      new Set(
        data
          ?.map((item) => item.category)
          .filter((category) => category != null) || []
      )
    );

    // Convert to the expected format with id and name
    return uniqueCategories.map((category) => ({
      id: category,
      name: category,
    }));
  }

  async update(
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating inventory item:", error);
      return null;
    }

    return data;
  }

  async getItemsWithoutEmbeddings(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select("*")
      .or("embedding.is.null");
    if (error) throw error;
    return data.map((item) => item as InventoryItem);
  }
}
