// frontend/src/components/WebsocketListener.tsx
import { useEffect } from "react";
import io from "socket.io-client";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useNotification } from "@/context/NotificationContext";

const socket = io(`${import.meta.env.VITE_API_URL}/voice`, {
  path: "/socket.io/",
});

export const WebsocketListener = () => {
  const updateItem = useInventoryStore((state) => state.updateItem);
  const { addNotification } = useNotification();

  useEffect(() => {
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
    };
  }, [updateItem, addNotification]);
  return null;
};
