// frontend/src/components/WebsocketListener.tsx
import { useInventoryStore } from "@/stores/inventoryStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useInventorySocket } from "@/hooks/useInventorySocket";
import { useVoiceSocket } from "@/hooks/useVoiceSocket";

export const WebsocketListener = () => {
  const updateItem = useInventoryStore((state) => state.updateItem);
  const updateItems = useInventoryStore((state) => state.updateItems);
  const setError = useInventoryStore((state) => state.setError);
  const { addNotification } = useNotificationStore();

  // Inventory socket management
  useInventorySocket({
    onConnect: () => {
      console.log("Inventory WebSocket connected successfully"); // Already present
      setError(null);
    },
    onInventoryUpdate: (message) => {
      console.log("Received inventory update:", message); // Add this log
      try {
        // Handle both the data being in message.data or directly in message
        const updateData = message.data || message;

        if (Array.isArray(updateData)) {
          console.log("Received bulk inventory update:", updateData);
          updateItems(updateData);
          addNotification(
            "success",
            `Updated ${updateData.length} inventory items`
          );
        } else if (updateData && typeof updateData === "object") {
          // Extract the relevant fields, handling different possible structures
          const itemData = updateData.data || updateData;
          const { id, quantity, unit, name, item } = itemData;

          console.log("Processing inventory update for item:", {
            id,
            quantity,
            unit,
            name: name || item,
          });

          updateItem({ id, quantity, unit });

          // Use the item name if available for better notifications
          const itemName = name || item || `Item ${id}`;
          addNotification(
            "success",
            `${itemName} updated to ${quantity} ${unit}`
          );
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

          // For now, we'll use a simple notification
          // The actual inventory update happens on the backend
          addNotification(
            "success",
            `Command processed: ${action} ${quantity} ${unit} of ${item}`
          );

          // The inventory will be updated via the inventory socket
          // when the backend broadcasts the change
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
          // You can display the speech feedback if needed
          console.log("Speech feedback:", data.speechFeedback);
        }
      } catch (error) {
        console.error("Error processing NLP response:", error);
      }
    },
    onVoiceCommand: (message) => {
      try {
        console.log("Received voice command:", message);
        // Handle voice command data
        if (message.data) {
          // Process the voice command data similar to inventory updates
          if (Array.isArray(message.data)) {
            updateItems(message.data);
            addNotification(
              "success",
              `Voice command updated ${message.data.length} inventory items`
            );
          } else {
            const { id, quantity, unit } = message.data;
            updateItem({ id, quantity, unit });
            addNotification(
              "success",
              `Voice command updated item ${id} to ${quantity} ${unit}`
            );
          }
        }
      } catch (error) {
        console.error("Error processing voice command:", error);
        addNotification(
          "error",
          "Failed to process voice command. Please try again."
        );
      }
    },
  });

  return null;
};
