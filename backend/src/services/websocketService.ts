//backend/src/services/websocketService.ts
import { Server } from "socket.io";

class WebSocketService {
  private io: Server | null = null;

  init(io: Server) {
    this.io = io;
    console.log("WebSocketService initialized");
  }

  broadcastToClient(namespace: string, event: string, data: any) {
    if (!this.io) {
      console.error("WebSocketService not initialized");
      return;
    }

    try {
      this.io.of(namespace).emit(event, data);
      console.log(`🔊 Broadcast to ${namespace}: ${event}`, data);
    } catch (error) {
      console.error("Error broadcasting message:", error);
    }
  }

  broadcastToVoiceClients(event: string, data: any) {
    this.broadcastToClient("/voice", event, data);
  }

  broadcastToInventoryClients(event: string, data: any) {
    this.broadcastToClient("/inventory", event, data);
  }
}

export default new WebSocketService();
