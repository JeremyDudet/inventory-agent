// frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef } from "react";

interface WebSocketHandlers {
  onMessage: (event: MessageEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (url: string, handlers: WebSocketHandlers) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onmessage = handlers.onMessage;
    if (handlers.onOpen) ws.current.onopen = handlers.onOpen;
    if (handlers.onClose) ws.current.onclose = handlers.onClose;
    if (handlers.onError) ws.current.onerror = handlers.onError;

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, handlers]);

  return ws.current;
};
