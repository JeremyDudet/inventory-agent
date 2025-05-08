// frontend/src/components/WebsocketListener.tsx
import { useEffect } from "react";
import io from "socket.io-client";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useNotification } from "@/context/NotificationContext";

const socket = io(`${import.meta.env.VITE_API_URL}/voice`, {
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
  const { addNotification } = useNotification();

  useEffect(() => {
    socket.on("connect", () => {
      console.log("WebSocket connected successfully");
      setError(null);
    });

    socket.on("connect_error", (error: any) => {
      console.error("WebSocket connection error:", error);
      setError("Failed to connect to server");
      addNotification(
        "error",
        "Failed to connect to server. Please refresh the page."
      );
    });

    socket.on("disconnect", (reason: any) => {
      console.log("WebSocket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        socket.connect();
      }
    });

    socket.on("inventory-updated", (message: any) => {
      try {
        if (Array.isArray(message.data)) {
          // Handle bulk update
          console.log("Received bulk inventory update:", message.data);
          updateItems(message.data);
          addNotification(
            "success",
            `Updated ${message.data.length} inventory items`
          );
        } else {
          // Handle single item update
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

    socket.on("error", (error: any) => {
      console.error("WebSocket error:", error);
      setError("WebSocket error occurred");
      addNotification(
        "error",
        "An error occurred with the connection. Please refresh the page."
      );
    });

    return () => {
      socket.off("inventory-updated");
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("error");
    };
  }, [updateItem, updateItems, setError, addNotification]);
  return null;
};
