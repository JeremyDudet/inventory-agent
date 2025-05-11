// backend/src/repositories/InventoryRepository.ts
import { eq, ilike, desc, isNull, sql } from "drizzle-orm";
import db from "../db";
import { inventory_items, inventory_updates, locations } from "../db/schema";
import { InventoryItem, InventoryItemInsert } from "@/types";

export type DrizzleInventoryItem = typeof inventory_items.$inferSelect;
export type DrizzleInventoryItemInsert = typeof inventory_items.$inferInsert;

export class InventoryRepository {
  // Convert between Drizzle numeric type and number
  private convertItem(dbItem: DrizzleInventoryItem): InventoryItem {
    return {
      ...dbItem,
      quantity: dbItem.quantity,
      threshold: dbItem.threshold,
      last_updated: dbItem.last_updated,
      created_at: dbItem.created_at,
      updated_at: dbItem.updated_at,
    };
  }

  async findSimilarItems(
    embedding: number[],
    limit: number = 5
  ): Promise<{ item: InventoryItem; similarity: number }[]> {
    // Note: Drizzle doesn't have built-in support for pgvector operations,
    // so we'll use raw SQL for similarity search
    const result = await db.execute(sql`
      SELECT *,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM ${inventory_items}
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> ${embedding}::vector) > 0.7
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT ${limit}
    `);

    return result.map((row: any) => ({
      item: this.convertItem(row),
      similarity: row.similarity,
    }));
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const [item] = await db
      .select()
      .from(inventory_items)
      .where(eq(inventory_items.id, id))
      .limit(1);

    return item ? this.convertItem(item) : null;
  }

  async findByName(name: string): Promise<InventoryItem[]> {
    const items = await db
      .select()
      .from(inventory_items)
      .where(ilike(inventory_items.name, `%${name}%`))
      .limit(1);

    return items.map(this.convertItem);
  }

  async updateQuantity(
    id: string,
    quantity: number
  ): Promise<InventoryItem | null> {
    const [updated] = await db
      .update(inventory_items)
      .set({
        quantity: quantity.toString(),
        last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .where(eq(inventory_items.id, id))
      .returning();

    return updated ? this.convertItem(updated) : null;
  }

  async createItem(item: InventoryItemInsert): Promise<InventoryItem | null> {
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

    const insertData: InventoryItemInsert = {
      ...item,
      quantity: item.quantity,
      threshold: item.threshold,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const [created] = await db
      .insert(inventory_items)
      .values(insertData)
      .returning();

    return created ? this.convertItem(created) : null;
  }

  async deleteItem(id: string): Promise<boolean> {
    const result = await db
      .delete(inventory_items)
      .where(eq(inventory_items.id, id));

    return result.count > 0;
  }

  async getAllItems(
    offset: number = 0,
    limit: number = 100
  ): Promise<InventoryItem[]> {
    const items = await db
      .select()
      .from(inventory_items)
      .orderBy(desc(inventory_items.last_updated))
      .limit(limit)
      .offset(offset);

    return items.map(this.convertItem);
  }

  async getCategories(): Promise<{ id: string; name: string }[]> {
    // Using distinct on category
    const result = await db
      .selectDistinct({
        category: inventory_items.category,
      })
      .from(inventory_items)
      .orderBy(inventory_items.category)
      .limit(100);

    // Filter out null/undefined categories
    return result
      .filter((item) => item.category != null)
      .map((item) => ({
        id: item.category,
        name: item.category,
      }));
  }

  async updateItem(
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem | null> {
    const updateData: Partial<DrizzleInventoryItemInsert> = {
      ...updates,
      quantity: updates.quantity?.toString(),
      threshold: updates.threshold?.toString(),
      updated_at: new Date().toISOString(),
    };

    const [updated] = await db
      .update(inventory_items)
      .set(updateData)
      .where(eq(inventory_items.id, id))
      .returning();

    return updated ? this.convertItem(updated) : null;
  }

  async getItemsWithoutEmbeddings(): Promise<InventoryItem[]> {
    const items = await db
      .select()
      .from(inventory_items)
      .where(isNull(inventory_items.embedding));

    return items.map(this.convertItem);
  }

  // Additional method to get items by location (since your schema includes locationId)
  async getItemsByLocation(
    locationId: string,
    offset: number = 0,
    limit: number = 100
  ): Promise<InventoryItem[]> {
    const items = await db
      .select()
      .from(inventory_items)
      .where(eq(inventory_items.location_id, locationId))
      .orderBy(desc(inventory_items.last_updated))
      .limit(limit)
      .offset(offset);

    return items.map(this.convertItem);
  }

  // Method to create an inventory update record
  async createInventoryUpdate(
    itemId: string,
    action: "add" | "remove" | "set" | "check",
    previousQuantity: number,
    newQuantity: number,
    quantity: number,
    unit: string,
    user_id?: string,
    user_name?: string
  ): Promise<void> {
    await db.insert(inventory_updates).values({
      item_id: itemId,
      action,
      previous_quantity: previousQuantity.toString(),
      new_quantity: newQuantity.toString(),
      quantity: quantity.toString(),
      unit,
      user_name: user_name,
      user_id: user_id,
      created_at: new Date().toISOString(),
    });
  }
}
