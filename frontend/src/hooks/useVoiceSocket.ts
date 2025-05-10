// frontend/src/hooks/useVoiceSocket.ts
import { useEffect, useRef } from "react";
import websocketService, { type Socket } from "@/services/websocketService";
import { useAuthStore } from "@/stores/authStore";

interface VoiceSocketEvents {
  onConnect?: () => void;
  onConnectError?: (error: Error) => void;
  onDisconnect?: (reason: string) => void;
  onError?: (data: { message: string }) => void;
  onTranscription?: (data: {
    text: string;
    isFinal: boolean;
    confidence?: number;
  }) => void;
  onVoiceCommand?: (message: any) => void;
}

export const useVoiceSocket = (events: VoiceSocketEvents) => {
  const socketRef = useRef<Socket | null>(null);
  const isMountedRef = useRef(true);
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    // Only create socket connection if user is authenticated
    if (!user || !session?.access_token) {
      console.log("User not authenticated, skipping voice socket connection");
      return;
    }

    isMountedRef.current = true;

    try {
      const socket = websocketService.getVoiceSocket();
      socketRef.current = socket;

      // Remove existing listeners to prevent duplicates
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("error");
      socket.off("transcription");
      socket.off("voice-command");

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

            // Auto-reconnect if server disconnected
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

      if (events.onTranscription) {
        socket.on(
          "transcription",
          (data: { text: string; isFinal: boolean; confidence?: number }) => {
            if (isMountedRef.current) events.onTranscription!(data);
          }
        );
      }

      if (events.onVoiceCommand) {
        socket.on("voice-command", (message: any) => {
          if (isMountedRef.current) events.onVoiceCommand!(message);
        });
      }

      return () => {
        isMountedRef.current = false;
        // Remove all event listeners for this component
        socket.off("connect");
        socket.off("connect_error");
        socket.off("disconnect");
        socket.off("error");
        socket.off("transcription");
        socket.off("voice-command");
      };
    } catch (error) {
      console.error("Error creating voice socket:", error);
      // Handle error appropriately - maybe show a notification
    }
  }, [user, session]); // Re-run when user auth status changes

  return socketRef.current;
};
