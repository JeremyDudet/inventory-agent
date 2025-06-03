import db from "@/db";
import { undo_actions, inventory_items, profiles } from "@/db/schema";
import { eq, and, gt, lt, desc } from "drizzle-orm";
import type { InventoryUpdate } from "@/types";

export interface CreateUndoActionParams {
  userId: string;
  actionType:
    | "inventory_update"
    | "item_create"
    | "item_delete"
    | "bulk_update";
  itemId: string;
  itemName: string;
  description: string;
  previousState: any;
  currentState: any;
  method?: "ui" | "voice" | "api" | "undo";
  expirationHours?: number;
}

export interface UndoActionRecord {
  id: string;
  userId: string;
  actionType: string;
  itemId: string;
  itemName: string;
  description: string;
  previousState: any;
  currentState: any;
  method: string;
  expiresAt: string;
  createdAt: string;
}

export class UndoService {
  constructor() {
    // Removed circular dependency
  }

  /**
   * Create a new undo action
   */
  async createUndoAction(params: CreateUndoActionParams): Promise<string> {
    const {
      userId,
      actionType,
      itemId,
      itemName,
      description,
      previousState,
      currentState,
      method = "ui",
      expirationHours = 168, // 7 days default
    } = params;

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    try {
      // First, remove any existing undo actions for this item by this user
      // This prevents multiple undo actions for the same item
      const deletedActions = await db
        .delete(undo_actions)
        .where(
          and(
            eq(undo_actions.user_id, userId),
            eq(undo_actions.item_id, itemId),
            eq(undo_actions.action_type, actionType)
          )
        )
        .returning({ id: undo_actions.id });

      if (deletedActions.length > 0) {
        console.log(
          `🔄 Removed ${deletedActions.length} existing undo action(s) for item ${itemName} to prevent multiple undos for same item`
        );
      }

      // Create the new undo action
      const [undoAction] = await db
        .insert(undo_actions)
        .values({
          user_id: userId,
          action_type: actionType,
          item_id: itemId,
          item_name: itemName,
          description,
          previous_state: previousState,
          current_state: currentState,
          method,
          expires_at: expiresAt.toISOString(),
        })
        .returning({ id: undo_actions.id });

      return undoAction.id;
    } catch (error) {
      console.error("Failed to create undo action:", error);
      throw new Error("Failed to create undo action");
    }
  }

  /**
   * Get user's undo actions (non-expired)
   */
  async getUserUndoActions(
    userId: string,
    limit: number = 20
  ): Promise<UndoActionRecord[]> {
    console.log(
      `🔄 Fetching undo actions for user: ${userId}, limit: ${limit}`
    );

    try {
      const now = new Date();

      const actions = await db
        .select({
          id: undo_actions.id,
          userId: undo_actions.user_id,
          actionType: undo_actions.action_type,
          itemId: undo_actions.item_id,
          itemName: undo_actions.item_name,
          description: undo_actions.description,
          previousState: undo_actions.previous_state,
          currentState: undo_actions.current_state,
          method: undo_actions.method,
          expiresAt: undo_actions.expires_at,
          createdAt: undo_actions.created_at,
        })
        .from(undo_actions)
        .where(
          and(
            eq(undo_actions.user_id, userId),
            gt(undo_actions.expires_at, now.toISOString())
          )
        )
        .orderBy(desc(undo_actions.created_at))
        .limit(limit);

      console.log(`🔄 Found ${actions.length} undo actions for user ${userId}`);
      console.log(
        `🔄 Actions:`,
        actions.map((a) => ({
          id: a.id,
          description: a.description,
          createdAt: a.createdAt,
        }))
      );

      return actions;
    } catch (error) {
      console.error("🔄 Error fetching undo actions:", error);
      throw error;
    }
  }

  /**
   * Execute an undo action
   */
  async executeUndo(undoActionId: string, userId: string): Promise<boolean> {
    try {
      // Get the undo action
      const [undoAction] = await db
        .select()
        .from(undo_actions)
        .where(
          and(
            eq(undo_actions.id, undoActionId),
            eq(undo_actions.user_id, userId),
            gt(undo_actions.expires_at, new Date().toISOString())
          )
        )
        .limit(1);

      if (!undoAction) {
        throw new Error("Undo action not found or expired");
      }

      // Execute the undo based on action type
      switch (undoAction.action_type) {
        case "inventory_update":
          await this.executeInventoryUpdateUndo(undoAction);
          break;
        case "item_create":
          await this.executeItemCreateUndo(undoAction);
          break;
        case "item_delete":
          await this.executeItemDeleteUndo(undoAction);
          break;
        default:
          throw new Error(
            `Unsupported undo action type: ${undoAction.action_type}`
          );
      }

      // Remove the undo action after successful execution
      await db.delete(undo_actions).where(eq(undo_actions.id, undoActionId));

      return true;
    } catch (error) {
      console.error("Failed to execute undo:", error);
      throw error;
    }
  }

  /**
   * Execute inventory update undo
   */
  private async executeInventoryUpdateUndo(undoAction: any): Promise<void> {
    const { item_id, previous_state, user_id } = undoAction;

    if (previous_state.quantity === undefined) {
      throw new Error("Invalid previous state for inventory update undo");
    }

    // Create an InventoryUpdate object to revert to previous state
    const revertUpdate: InventoryUpdate = {
      item: item_id,
      action: "set",
      quantity: previous_state.quantity,
      unit: previous_state.unit,
    };

    // Get the actual user information from the database who is performing the undo
    // This should be the authenticated user, not the original user who made the change
    try {
      // Get user details from the profiles table
      const [userProfile] = await db
        .select({
          id: profiles.id,
          email: profiles.email,
          name: profiles.name,
        })
        .from(profiles)
        .where(eq(profiles.id, user_id))
        .limit(1);

      const userName =
        userProfile?.name || userProfile?.email || "Unknown User";

      // Create a request object with the actual user who is performing the undo
      const mockReq = {
        user: {
          id: user_id,
          userId: user_id,
          name: userName,
          email: userProfile?.email || "unknown@undo",
        },
      };

      // Use dynamic import to avoid circular dependency
      const { default: inventoryService } = await import("./inventoryService");

      // Use the inventory service to update the item
      await inventoryService.updateInventoryCount(
        revertUpdate,
        mockReq,
        "undo", // Use "undo" method instead of "api"
        true // Skip creating undo action to prevent circular undos
      );
    } catch (error) {
      console.error("Failed to get user profile for undo operation:", error);

      // Fallback to basic user info if we can't get profile details
      const mockReq = {
        user: {
          id: user_id,
          userId: user_id,
          name: "User",
          email: "user@undo",
        },
      };

      // Use dynamic import to avoid circular dependency
      const { default: inventoryService } = await import("./inventoryService");

      // Use the inventory service to update the item
      await inventoryService.updateInventoryCount(
        revertUpdate,
        mockReq,
        "undo", // Use "undo" method instead of "api"
        true // Skip creating undo action to prevent circular undos
      );
    }
  }

  /**
   * Execute item create undo (delete the item)
   */
  private async executeItemCreateUndo(undoAction: any): Promise<void> {
    const { item_id } = undoAction;

    // Delete the created item
    await db.delete(inventory_items).where(eq(inventory_items.id, item_id));
  }

  /**
   * Execute item delete undo (recreate the item)
   */
  private async executeItemDeleteUndo(undoAction: any): Promise<void> {
    const { previous_state } = undoAction;

    // Recreate the item with its previous state
    await db.insert(inventory_items).values({
      id: previous_state.id,
      location_id: previous_state.location_id,
      sku: previous_state.sku,
      name: previous_state.name,
      quantity: previous_state.quantity,
      unit: previous_state.unit,
      category: previous_state.category,
      threshold: previous_state.threshold,
      description: previous_state.description,
    });
  }

  /**
   * Clean up expired undo actions
   */
  async cleanupExpiredActions(): Promise<number> {
    try {
      const now = new Date();

      const deletedActions = await db
        .delete(undo_actions)
        .where(lt(undo_actions.expires_at, now.toISOString()))
        .returning({ id: undo_actions.id });

      console.log(`Cleaned up ${deletedActions.length} expired undo actions`);
      return deletedActions.length;
    } catch (error) {
      console.error("Failed to cleanup expired undo actions:", error);
      return 0;
    }
  }

  /**
   * Delete a specific undo action (e.g., when user manually dismisses)
   */
  async deleteUndoAction(
    undoActionId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const deletedActions = await db
        .delete(undo_actions)
        .where(
          and(
            eq(undo_actions.id, undoActionId),
            eq(undo_actions.user_id, userId)
          )
        )
        .returning({ id: undo_actions.id });

      return deletedActions.length > 0;
    } catch (error) {
      console.error("Failed to delete undo action:", error);
      throw new Error("Failed to delete undo action");
    }
  }
}

export const undoService = new UndoService();
