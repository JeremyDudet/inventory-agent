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
  onCommandProcessed?: (data: {
    command: {
      action: string;
      item: string;
      quantity: number;
      unit: string;
    };
    actionLog: any;
  }) => void;
  onNlpResponse?: (data: {
    action: string;
    item: string;
    quantity: number;
    unit: string;
    confidence: number;
    isComplete: boolean;
    confirmationType?: string;
    feedbackMode?: string;
    speechFeedback?: string;
  }) => void;
  onClarificationNeeded?: (data: {
    message: string;
    originalCommand: any;
  }) => void;
  onFeedback?: (data: { text: string }) => void;
}

export const useVoiceSocket = (events: VoiceSocketEvents) => {
  const socketRef = useRef<Socket | null>(null);
  const isMountedRef = useRef(true);
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    // Only create socket connection if user is authenticated
    if (!user || !session?.access_token) {
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
      socket.off("command-processed");
      socket.off("nlp-response");
      socket.off("clarification-needed");
      socket.off("feedback");

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

      // If socket is already connected, trigger the onConnect callback
      if (socket.connected && events.onConnect) {
        events.onConnect();
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

      if (events.onCommandProcessed) {
        socket.on("command-processed", (data: any) => {
          if (isMountedRef.current) events.onCommandProcessed!(data);
        });
      }

      if (events.onNlpResponse) {
        socket.on("nlp-response", (data: any) => {
          if (isMountedRef.current) events.onNlpResponse!(data);
        });
      }

      if (events.onClarificationNeeded) {
        socket.on(
          "clarification-needed",
          (data: { message: string; originalCommand: any }) => {
            if (isMountedRef.current) events.onClarificationNeeded!(data);
          }
        );
      }

      if (events.onFeedback) {
        socket.on("feedback", (data: { text: string }) => {
          if (isMountedRef.current) events.onFeedback!(data);
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
        socket.off("command-processed");
        socket.off("nlp-response");
        socket.off("clarification-needed");
        socket.off("feedback");
      };
    } catch (error) {
      console.error("Error creating voice socket:", error);
      // Handle error appropriately - maybe show a notification
    }
  }, [user, session]); // Re-run when user auth status changes

  return socketRef.current;
};
