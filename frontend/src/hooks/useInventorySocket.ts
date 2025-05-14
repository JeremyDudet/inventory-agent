// frontend/src/hooks/useInventorySocket.ts
import { useEffect, useRef } from "react";
import websocketService, { type Socket } from "@/services/websocketService";
import { useAuthStore } from "@/stores/authStore";

interface InventorySocketEvents {
  onConnect?: () => void;
  onConnectError?: (error: Error) => void;
  onDisconnect?: (reason: string) => void;
  onError?: (data: { message: string }) => void;
  onInventoryUpdate?: (data: any) => void;
}

export const useInventorySocket = (events: InventorySocketEvents) => {
  const socketRef = useRef<Socket | null>(null);
  const isMountedRef = useRef(true);
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (!user || !session?.access_token) {
      console.log(
        "User not authenticated, skipping inventory socket connection"
      );
      return;
    }

    isMountedRef.current = true;

    try {
      const socket = websocketService.getInventorySocket();
      socketRef.current = socket;

      // Remove existing listeners to prevent duplicates
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("error");
      socket.off("inventory-updated"); // Updated event name

      if (events.onConnect) {
        socket.on("connect", () => {
          if (isMountedRef.current) events.onConnect!();
        });
      }

      if (events.onConnectError) {
        socket.on("connect_error", (error: Error) => {
          if (isMountedRef.current) events.onConnectError!(error);
        });
      }

      if (events.onDisconnect) {
        socket.on("disconnect", (reason: string) => {
          if (isMountedRef.current && events.onDisconnect) {
            events.onDisconnect(reason);
            if (reason === "io server disconnect") {
              socket.connect();
            }
          }
        });
      }

      if (events.onError) {
        socket.on("error", (data: { message: string }) => {
          if (isMountedRef.current) events.onError!(data);
        });
      }

      if (events.onInventoryUpdate) {
        socket.on("inventory-updated", (data: any) => {
          // Changed from "inventory-update" to "inventory-updated"
          if (isMountedRef.current) events.onInventoryUpdate!(data);
        });
      }

      return () => {
        isMountedRef.current = false;
        socket.off("connect");
        socket.off("connect_error");
        socket.off("disconnect");
        socket.off("error");
        socket.off("inventory-updated"); // Updated event name
      };
    } catch (error) {
      console.error("Error creating inventory socket:", error);
    }
  }, [user, session]);

  return socketRef.current;
};
