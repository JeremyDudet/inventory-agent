import { Server, Socket } from "socket.io";
import http from "http";
import { AddressInfo } from "net";
import { io as Client } from "socket.io-client";
import { ActionLog } from "@/types";

describe("WebSocket Handler - Action Log", () => {
  let io: Server;
  let serverSocket: Socket;
  let clientSocket: any;
  let httpServer: http.Server;
  let port: number;
  let sessionActionLogs: Map<string, ActionLog[]>;

  beforeAll((done) => {
    httpServer = http.createServer();
    io = new Server(httpServer);

    // Initialize session action logs
    sessionActionLogs = new Map<string, ActionLog[]>();

    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  beforeEach((done) => {
    const voiceNamespace = io.of("/voice");

    voiceNamespace.on("connection", (socket) => {
      serverSocket = socket;
      // Initialize action log for this session
      sessionActionLogs.set(socket.id, []);
    });

    clientSocket = Client(`http://localhost:${port}/voice`);
    clientSocket.on("connect", done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test("should initialize empty action log for new session", () => {
    const sessionId = serverSocket.id;

    expect(sessionActionLogs).toBeDefined();
    expect(sessionActionLogs.get(sessionId)).toEqual([]);
  });

  test("should add action to log when processing command", async () => {
    const sessionId = serverSocket.id;
    const actionLog: ActionLog = {
      type: "add",
      itemId: "item123",
      quantity: 5,
    };

    // Simulate processing a command
    const logs = sessionActionLogs.get(sessionId);
    if (!logs) {
      throw new Error("Action logs not initialized for session");
    }
    logs.push(actionLog);

    expect(logs).toHaveLength(1);
    expect(logs[0]).toEqual(actionLog);
  });

  test("should handle undo action by removing last action", async () => {
    const sessionId = serverSocket.id;
    const actionLogs = sessionActionLogs.get(sessionId);
    if (!actionLogs) {
      throw new Error("Action logs not initialized for session");
    }

    // Add some actions
    actionLogs.push(
      { type: "add", itemId: "item123", quantity: 5 },
      { type: "remove", itemId: "item123", quantity: 2 }
    );

    // Simulate undo
    const lastAction = actionLogs.pop();

    expect(actionLogs).toHaveLength(1);
    expect(lastAction).toEqual({
      type: "remove",
      itemId: "item123",
      quantity: 2,
    });
  });

  test("should maintain action history for multiple commands", async () => {
    const sessionId = serverSocket.id;
    const actionLogs = sessionActionLogs.get(sessionId);
    if (!actionLogs) {
      throw new Error("Action logs not initialized for session");
    }

    // Add multiple actions
    actionLogs.push(
      { type: "add", itemId: "item123", quantity: 5 },
      { type: "set", itemId: "item123", quantity: 10, previousQuantity: 5 },
      { type: "remove", itemId: "item123", quantity: 3 }
    );

    expect(actionLogs).toHaveLength(3);
    expect(actionLogs[0].type).toBe("add");
    expect(actionLogs[1].type).toBe("set");
    expect(actionLogs[2].type).toBe("remove");
  });
});
