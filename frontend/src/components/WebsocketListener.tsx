import { useEffect } from "react";
import io from "socket.io-client";
import { useInventoryStore } from "../stores/inventoryStore";

// Connect to the /voice namespace of your backend
const socket = io("http://localhost:8080/voice", {
  path: "/socket.io/", // Matches backend configuration
});

export const WebsocketListener = () => {
  const updateItem = useInventoryStore((state) => state.updateItem);

  useEffect(() => {
    // Handle the 'inventory-updated' event
    socket.on("inventory-updated", (message: any) => {
      const { id, quantity, unit } = message.data;
      console.log("Received inventory update:", message.data);
      updateItem({ id, quantity, unit });
    });

    // Cleanup: Remove the event listener when the component unmounts
    return () => {
      socket.off("inventory-updated");
    };
  }, [updateItem]);

  return null; // This component doesn't render anything
};
