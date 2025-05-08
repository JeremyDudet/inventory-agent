// frontend/src/components/WebsocketListener.tsx
import { useEffect } from "react";
import io from "socket.io-client";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useNotificationStore } from "@/stores/notificationStore";

const voiceSocket = io(`${import.meta.env.VITE_API_URL}/voice`, {
  path: "/socket.io/",
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  secure: true,
});

const inventorySocket = io(`${import.meta.env.VITE_API_URL}/inventory`, {
  path: "/socket.io/",
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  secure: true,
});

export const WebsocketListener = () => {
  const updateItem = useInventoryStore((state) => state.updateItem);
  const updateItems = useInventoryStore((state) => state.updateItems);
  const setError = useInventoryStore((state) => state.setError);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // Handle inventory socket events
    inventorySocket.on("connect", () => {
      console.log("Inventory WebSocket connected successfully");
      setError(null);
    });

    inventorySocket.on("connect_error", (error: any) => {
      console.error("Inventory WebSocket connection error:", error);
      setError("Failed to connect to inventory server");
      addNotification(
        "error",
        "Failed to connect to inventory server. Please refresh the page."
      );
    });

    inventorySocket.on("disconnect", (reason: any) => {
      console.log("Inventory WebSocket disconnected:", reason);
      if (reason === "io server disconnect") {
        inventorySocket.connect();
      }
    });

    inventorySocket.on("inventory-updated", (message: any) => {
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
    });

    // Handle voice socket events
    voiceSocket.on("connect", () => {
      console.log("Voice WebSocket connected successfully");
    });

    voiceSocket.on("connect_error", (error: any) => {
      console.error("Voice WebSocket connection error:", error);
      addNotification(
        "error",
        "Failed to connect to voice server. Voice commands may not work."
      );
    });

    voiceSocket.on("disconnect", (reason: any) => {
      console.log("Voice WebSocket disconnected:", reason);
      if (reason === "io server disconnect") {
        voiceSocket.connect();
      }
    });

    voiceSocket.on("voice-command", (message: any) => {
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
    });

    return () => {
      // Clean up inventory socket listeners
      inventorySocket.off("inventory-updated");
      inventorySocket.off("connect");
      inventorySocket.off("connect_error");
      inventorySocket.off("disconnect");

      // Clean up voice socket listeners
      voiceSocket.off("voice-command");
      voiceSocket.off("connect");
      voiceSocket.off("connect_error");
      voiceSocket.off("disconnect");
    };
  }, [updateItem, updateItems, setError, addNotification]);

  return null;
};
