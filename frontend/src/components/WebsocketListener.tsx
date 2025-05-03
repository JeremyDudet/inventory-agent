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
  const { addNotification } = useNotification();

  useEffect(() => {
    socket.on("connect", () => {
      console.log("WebSocket connected successfully");
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      addNotification(
        "error",
        "Failed to connect to server. Please refresh the page."
      );
    });

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        socket.connect();
      }
    });

    socket.on("inventory-updated", (message: any) => {
      const { id, quantity, unit } = message.data;
      console.log("Received inventory update:", message.data);
      updateItem({ id, quantity, unit });
      // Add notification for inventory update
      addNotification(
        "success",
        `Inventory item ${id} updated to ${quantity} ${unit}`
      );
    });

    return () => {
      socket.off("inventory-updated");
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
    };
  }, [updateItem, addNotification]);
  return null;
};
