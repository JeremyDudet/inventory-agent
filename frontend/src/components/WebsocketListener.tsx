// frontend/src/components/WebsocketListener.tsx
import { useInventoryStore } from "@/stores/inventoryStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUndoStore } from "@/stores/undoStore";
import { useAuthStore } from "@/stores/authStore";
import { useChangelogStore } from "@/stores/changelogStore";
import { useInventorySocket } from "@/hooks/useInventorySocket";
import { useVoiceSocket } from "@/hooks/useVoiceSocket";
import { api } from "@/services/api";

export const WebsocketListener = () => {
  const updateItem = useInventoryStore((state) => state.updateItem);
  const updateItems = useInventoryStore((state) => state.updateItems);
  const setError = useInventoryStore((state) => state.setError);
  const { items } = useInventoryStore();
  const { addNotification, addUndoableNotification } = useNotificationStore();
  const { addUndoableAction } = useUndoStore();
  const { addLiveUpdate, removeNewFlag } = useChangelogStore();
  const { session } = useAuthStore();

  // Inventory socket management
  useInventorySocket({
    onConnect: () => {
      console.log("Inventory WebSocket connected successfully");
      setError(null);
    },
    onInventoryUpdate: (message) => {
      console.log("Received inventory update:", message);
      try {
        // Handle both the data being in message.data or directly in message
        const updateData = message.data || message;

        if (Array.isArray(updateData)) {
          console.log("Received bulk inventory update:", updateData);
          updateItems(updateData);
          // Only show notification for bulk updates (these are typically from system/API)
          addNotification(
            "success",
            `Updated ${updateData.length} inventory items`
          );
        } else if (updateData && typeof updateData === "object") {
          // The updateData already contains the correct structure, no need for additional nesting
          const {
            id,
            quantity,
            unit,
            name,
            item,
            method,
            userId,
            previousQuantity,
          } = updateData;

          console.log("Processing inventory update for item:", {
            id,
            quantity,
            unit,
            name: name || item,
            method,
            userId,
            previousQuantity,
          });

          updateItem({ id, quantity, unit });

          // Add to changelog store (regardless of which page user is on)
          const itemName =
            name ||
            item ||
            items.find((inventoryItem) => inventoryItem.id === id)?.name ||
            "An item";

          const newChangelogUpdate = {
            id: `update-${Date.now()}-${Math.random()}`, // Generate unique ID
            itemId: id,
            action: updateData.action || "set",
            previousQuantity: previousQuantity || 0,
            newQuantity: quantity,
            quantity: updateData.changeQuantity || quantity,
            unit: unit,
            userId: userId || session?.user?.id || "",
            userName: updateData.userName || session?.user?.email || "System",
            method: method || "ui",
            createdAt: new Date().toISOString(),
            itemName: itemName,
            isNew: true,
          };

          console.log("Adding update to changelog store:", newChangelogUpdate);
          addLiveUpdate(newChangelogUpdate);

          // Remove the "new" flag after animation
          setTimeout(() => {
            removeNewFlag(newChangelogUpdate.id);
          }, 3000);

          // Only show notifications for updates that didn't originate from manual UI actions
          // Manual UI actions already show their own undoable notifications
          const currentUserId = session?.user?.id;
          const isManualUIUpdate = method === "ui" && userId === currentUserId;

          console.log("Notification check:", {
            method,
            userId,
            currentUserId,
            isManualUIUpdate,
            previousQuantity,
          });

          if (!isManualUIUpdate) {
            // For voice/API updates, create undoable notifications
            if (method === "voice" && previousQuantity !== undefined) {
              console.log("Creating undoable notification for voice command");

              // Create undo function for voice commands
              const createUndoFunction = () => async () => {
                try {
                  const token = session?.access_token;
                  if (!token) {
                    throw new Error("No authentication token found");
                  }

                  await api.updateInventory(
                    id,
                    { quantity: previousQuantity },
                    token
                  );

                  // Update local state
                  updateItem({ id, quantity: previousQuantity, unit });

                  console.log(
                    `Reverted ${itemName} from ${quantity} to ${previousQuantity} ${unit} (voice command)`
                  );
                } catch (error) {
                  console.error("Failed to revert voice command:", error);
                  throw new Error("Failed to revert voice command");
                }
              };

              // Create undoable action for voice commands
              const undoableAction = {
                id: `voice-update-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                type: "inventory_update" as const,
                timestamp: new Date(),
                description: `Voice command: Updated ${itemName} from ${previousQuantity} to ${quantity} ${unit}`,
                previousState: {
                  id,
                  quantity: previousQuantity,
                  unit,
                  name: itemName,
                },
                currentState: { id, quantity, unit, name: itemName },
                revertFunction: createUndoFunction(),
                itemId: id,
                itemName: itemName,
              };

              // Add to undo history
              addUndoableAction(undoableAction);

              // Show undoable notification for voice commands
              addUndoableNotification(
                "success",
                `Voice: ${itemName} updated from ${previousQuantity} to ${quantity} ${unit}`,
                {
                  label: "Undo",
                  action: createUndoFunction(),
                  actionId: undoableAction.id,
                },
                8000
              );
            } else {
              console.log("Creating regular notification for non-voice update");
              // For other non-manual updates (API, system), show regular notifications
              addNotification(
                "success",
                `${itemName} updated to ${quantity} ${unit}`
              );
            }
          } else {
            console.log("Skipping notification for manual UI update");
          }
        }
      } catch (error) {
        console.error("Error processing inventory update:", error);
        setError("Failed to process inventory update");
        addNotification(
          "error",
          "Failed to process inventory update. Please refresh the page."
        );
      }
    },
  });

  // Voice socket management
  useVoiceSocket({
    onConnect: () => {
      console.log("Voice WebSocket connected successfully");
    },
    onConnectError: (error) => {
      console.error("Voice WebSocket connection error:", error);
      addNotification(
        "error",
        "Failed to connect to voice server. Voice commands may not work."
      );
    },
    onDisconnect: (reason) => {
      console.log("Voice WebSocket disconnected:", reason);
    },
    onCommandProcessed: (data) => {
      try {
        console.log("Received command-processed event:", data);
        // Handle the processed command
        if (data.command) {
          const { action, item, quantity, unit } = data.command;

          // Show a command acknowledgment notification
          // The actual inventory update and undo functionality happens
          // in onInventoryUpdate when the backend broadcasts the change
          addNotification(
            "info",
            `Voice command processed: ${action} ${quantity} ${unit} of ${item}`,
            3000
          );
        }
      } catch (error) {
        console.error("Error processing command:", error);
        addNotification(
          "error",
          "Failed to process command. Please try again."
        );
      }
    },
    onNlpResponse: (data) => {
      try {
        console.log("Received NLP response:", data);
        // Handle NLP response for feedback purposes
        if (data.speechFeedback) {
          console.log("Speech feedback:", data.speechFeedback);
        }
      } catch (error) {
        console.error("Error processing NLP response:", error);
      }
    },
    onVoiceCommand: (message) => {
      try {
        console.log("Received voice command:", message);
        // This handler might be redundant with onInventoryUpdate
        // The main inventory updates should come through onInventoryUpdate
        // This is just for logging/debugging
      } catch (error) {
        console.error("Error processing voice command:", error);
      }
    },
  });

  return null;
};
