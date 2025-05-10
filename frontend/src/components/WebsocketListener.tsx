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
      console.log("Inventory WebSocket connected successfully");
      setError(null);
    },
    onConnectError: (error) => {
      console.error("Inventory WebSocket connection error:", error);
      setError("Failed to connect to inventory server");
      addNotification(
        "error",
        "Failed to connect to inventory server. Please refresh the page."
      );
    },
    onDisconnect: (reason) => {
      console.log("Inventory WebSocket disconnected:", reason);
    },
    onInventoryUpdated: (message) => {
      try {
        if (Array.isArray(message.data)) {
          console.log("Received bulk inventory update:", message.data);
          updateItems(message.data);
          addNotification(
            "success",
            `Updated ${message.data.length} inventory items`
          );
        } else {
          const { id, quantity, unit } = message.data;
          console.log("Received inventory update:", message.data);
          updateItem({ id, quantity, unit });
          addNotification(
            "success",
            `Inventory item ${id} updated to ${quantity} ${unit}`
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
