// frontend/src/services/websocket/websocketService.ts
import io from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

export type Socket = typeof io.Socket;

class WebSocketService {
  private voiceSocket: Socket | null = null;
  private inventorySocket: Socket | null = null;
  private static instance: WebSocketService | null = null;

  private constructor() {
    // Subscribe to auth store changes
    useAuthStore.subscribe((state, prevState) => {
      // When user logs out (user becomes null)
      if (prevState.user && !state.user) {
        this.disconnectAll();
      }
    });
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private createSocket(namespace: string): Socket {
    const SOCKET_URL = `${import.meta.env.VITE_API_URL}/${namespace}`;
    const session = useAuthStore.getState().session;

    const socket = io(SOCKET_URL, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 60000,
      autoConnect: false, // Don't auto-connect
      secure: window.location.protocol === "https:",
      auth: {
        token: session?.access_token || "",
      },
    });

    return socket;
  }

  private isAuthenticated(): boolean {
    const { user, session } = useAuthStore.getState();
    return !!(user && session?.access_token);
  }

  getVoiceSocket(): Socket {
    if (!this.isAuthenticated()) {
      throw new Error("Cannot create voice socket: User not authenticated");
    }

    if (!this.voiceSocket) {
      this.voiceSocket = this.createSocket("voice");
      this.voiceSocket.connect(); // Manually connect
    } else {
      // If socket exists but is disconnected, reconnect
      if (!this.voiceSocket.connected) {
        this.voiceSocket.connect();
      }
    }
    return this.voiceSocket;
  }

  getInventorySocket(): Socket {
    if (!this.isAuthenticated()) {
      throw new Error("Cannot create inventory socket: User not authenticated");
    }

    if (!this.inventorySocket) {
      this.inventorySocket = this.createSocket("inventory");
      this.inventorySocket.connect(); // Manually connect
    }
    return this.inventorySocket;
  }

  disconnectVoice() {
    if (this.voiceSocket) {
      this.voiceSocket.disconnect();
      this.voiceSocket = null;
    }
  }

  disconnectInventory() {
    if (this.inventorySocket) {
      this.inventorySocket.disconnect();
      this.inventorySocket = null;
    }
  }

  disconnectAll() {
    this.disconnectVoice();
    this.disconnectInventory();
  }
}

export default WebSocketService.getInstance();
