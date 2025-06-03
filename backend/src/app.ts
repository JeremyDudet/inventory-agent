// backend/src/app.ts
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth";
import inventoryRoutes from "./routes/inventory";
import waitingListRoutes from "./routes/waitingList";
import locationsRoutes from "./routes/locations";
import undoRoutes from "./routes/undo";

import { errorHandler } from "./middleware/errorHandler";

import websocketService from "./services/websocketService";
import confirmationService from "./services/confirmationService";
import inventoryService from "./services/inventoryService";
import speechService from "./services/speech/speechService";
import { NlpService } from "./services/speech/nlpService";
import speechFeedbackService from "./services/speech/speechFeedbackService";
import TranscriptionBuffer from "./services/speech/transcriptionBuffer";
import {
  logTranscript,
  logSystemAction,
} from "./services/session/sessionLogsService";
import { SessionStateService } from "./services/session/sessionStateService";
import { SessionStateContextProvider } from "./services/session/sessionStateContextProvider";

import { ActionLog, NlpResult } from "@/types";

import { ValidationError } from "./errors";
import authService from "./services/authService";
import { undoService } from "./services/undoService";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Apply CORS middleware before routes
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://stockcount.io",
      "https://www.stockcount.io",
      "https://api.stockcount.io",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 600, // Cache preflight requests for 10 minutes
  })
);

app.use(express.json());

// Initialize socket.io with proper CORS configuration
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://stockcount.io",
      "https://www.stockcount.io",
      "https://api.stockcount.io",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  path: "/socket.io/",
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize websocketService with io instance
websocketService.init(io);

const PORT = process.env.PORT || 8080;

const voiceNamespace = io.of("/voice");
const inventoryNamespace = io.of("/inventory");

// Websocket authentication middleware
const authenticateSocket = async (
  socket: Socket,
  next: (err?: any) => void
) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Try to verify the token
    const jwtPayload = await authService.verifyToken(token);

    if (jwtPayload) {
      // Token is valid, attach user info to socket
      socket.data.user = {
        id: jwtPayload.userId,
        email: jwtPayload.email,
        name: jwtPayload.name,
      };
      return next();
    }

    // If JWT fails, try Supabase token
    const supabaseUser = await authService.validateSupabaseToken(token);

    if (supabaseUser) {
      socket.data.user = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.name,
      };
      return next();
    }

    // No valid auth
    return next(new Error("Invalid authentication token"));
  } catch (error) {
    console.error("Socket authentication error:", error);
    return next(new Error("Authentication failed"));
  }
};

// Apply authentication middleware to both namespaces
voiceNamespace.use(authenticateSocket);
inventoryNamespace.use(authenticateSocket);

// Add session action logs storage
const sessionActionLogs = new Map<string, ActionLog[]>();
// Store connectionId per socket
const socketConnectionIds = new Map<string, string>();

voiceNamespace.on("connection", (socket: Socket) => {
  console.log("🔊 Client connected:", socket.id);

  // Initialize action log for this session
  sessionActionLogs.set(socket.id, []);

  const userInfo = {
    userId: socket.id,
    role: "standard",
    previousConfirmations: {
      correct: 0,
      total: 0,
    },
    sessionItems: [] as string[],
  };

  // Initialize services (but NOT Deepgram yet)
  const sessionState = new SessionStateService();
  const contextProvider = new SessionStateContextProvider(sessionState);
  const nlpService = new NlpService();
  nlpService.setContextProvider(contextProvider);
  const transcriptionBuffer = new TranscriptionBuffer(nlpService, sessionState);

  // Deepgram connection options - store for later use
  const deepgramOptions = {
    sampleRate: 48000,
    channels: 1,
    language: "en-US",
    model: "nova-2",
    vad_events: true,
    no_delay: true,
    vad_turnoff: 500,
  };

  // Flag to track if Deepgram connection has been created
  let deepgramConnectionCreated = false;

  // Transcription callbacks - defined here but used only when connection is created
  const callbacks = {
    onTranscript: async (
      transcript: string,
      isFinal: boolean,
      confidence: number
    ) => {
      const timestamp = new Date().toISOString();
      console.log(
        `[${timestamp}] Transcript: "${transcript}", isFinal: ${isFinal}, confidence: ${confidence}`
      );
      socket.emit("transcription", { text: transcript, isFinal, confidence });

      if (isFinal && transcript.trim()) {
        try {
          await logTranscript(transcript, true, confidence, userInfo.userId);
          await transcriptionBuffer.addTranscription(transcript);
        } catch (error) {
          console.error("Error handling transcription:", error);
        }
      }
    },
    onError: (error: any) => {
      console.error("🔊 Transcription error:", error);
      socket.emit("error", { message: "Speech recognition error" });
      sessionState.setProcessingVoiceCommand(false);
    },
  };

  // Only create Deepgram connection when starting recording
  const createNewConnection = () => {
    if (!deepgramConnectionCreated) {
      console.log("🎤 Creating Deepgram connection for first time");
      deepgramConnectionCreated = true;
    }

    const connectionId = speechService.createLiveConnection(
      deepgramOptions,
      callbacks
    );
    socketConnectionIds.set(socket.id, connectionId);
    console.log(
      `🔊 Created new Deepgram connection for ${socket.id}: ${connectionId}`
    );
    return connectionId;
  };

  transcriptionBuffer.on(
    "completeCommand",
    async (nlpResults: NlpResult[], originalTranscription: string) => {
      console.log(
        `🔊 Received complete command from buffer: "${originalTranscription}"`
      );
      sessionState.setProcessingVoiceCommand(true);

      try {
        for (const nlpResult of nlpResults) {
          if (nlpResult.isComplete && nlpResult.action !== "unknown") {
            sessionState.setStateType("normal");

            const actionLog: ActionLog = {
              type: nlpResult.action as "add" | "remove" | "set",
              itemId: nlpResult.item,
              quantity: nlpResult.quantity,
              previousQuantity: undefined,
            };

            sessionActionLogs.get(socket.id)?.push(actionLog);

            socket.emit("command-processed", {
              command: nlpResult,
              actionLog,
            });

            try {
              await inventoryService.updateInventoryCount(
                {
                  action: nlpResult.action,
                  item: nlpResult.item,
                  quantity: nlpResult.quantity || 0,
                  unit: nlpResult.unit,
                },
                // Use authenticated user info from socket
                {
                  user: socket.data.user || {
                    id: socket.id,
                    email: "voice@user.com",
                    name: "Voice User",
                  },
                },
                "voice" // Method is voice since this is from voice commands
              );
              console.log(
                `📝 Updated inventory: ${nlpResult.item} ${nlpResult.quantity} ${nlpResult.unit}`
              );

              const feedback = speechFeedbackService.generateSuccessFeedback(
                nlpResult.action,
                nlpResult.quantity || 0,
                nlpResult.unit,
                nlpResult.item
              );
              if (feedback) {
                sessionState.addAssistantMessage(feedback.text);
                socket.emit("feedback", feedback);
              }
            } catch (error: unknown) {
              if (error instanceof ValidationError) {
                socket.emit("clarification-needed", {
                  message: error.message,
                  originalCommand: {
                    action: nlpResult.action,
                    item: nlpResult.item,
                    quantity: nlpResult.quantity,
                    unit: nlpResult.unit,
                  },
                });
                console.log(`🔍 Ambiguous match detected: ${error.message}`);
              } else {
                console.error("Error updating inventory:", error);
                socket.emit("error", {
                  message: "Failed to update inventory",
                });
              }
            }
          }
        }

        if (nlpResults.some((result) => result.isComplete)) {
          const firstCompleteResult = nlpResults.find(
            (result) => result.isComplete
          );
          if (firstCompleteResult) {
            try {
              let currentQuantity: number | undefined;
              let threshold: number | undefined;
              let similarItems: string[] | undefined;

              const confirmationResult =
                confirmationService.determineConfirmationType({
                  confidence: firstCompleteResult.confidence,
                  action: firstCompleteResult.action as any,
                  item: firstCompleteResult.item,
                  quantity: firstCompleteResult.quantity,
                  unit: firstCompleteResult.unit,
                  currentQuantity,
                  threshold,
                  similarItems,
                  userRole: userInfo.role,
                  previousConfirmations: userInfo.previousConfirmations,
                  sessionItems: userInfo.sessionItems,
                });

              console.log(`🔊 Confirmation result:`, confirmationResult);

              const speechFeedback =
                speechFeedbackService.generateCommandFeedback(
                  firstCompleteResult.action,
                  firstCompleteResult.quantity,
                  firstCompleteResult.unit,
                  firstCompleteResult.item,
                  confirmationResult.feedbackMode
                );

              if (confirmationResult.type === "voice") {
                sessionState.setPendingConfirmation({
                  command: {
                    action: firstCompleteResult.action as
                      | "add"
                      | "remove"
                      | "set"
                      | "unknown",
                    item: firstCompleteResult.item,
                    quantity: firstCompleteResult.quantity,
                    unit: firstCompleteResult.unit,
                  },
                  confirmationResult,
                  speechFeedback: speechFeedback?.text,
                });
              }

              socket.emit("nlp-response", {
                ...firstCompleteResult,
                confirmationType: confirmationResult.type,
                feedbackMode: confirmationResult.feedbackMode,
                timeoutSeconds: confirmationResult.timeoutSeconds,
                suggestedCorrection: confirmationResult.suggestedCorrection,
                riskLevel: confirmationResult.riskLevel,
                speechFeedback: speechFeedback?.text,
              });

              if (confirmationResult.type === "implicit") {
                userInfo.sessionItems.push(firstCompleteResult.item);
                if (userInfo.sessionItems.length > 10) {
                  userInfo.sessionItems.shift();
                }
              }
            } catch (error) {
              console.error("Error processing command:", error);
            }
          }
        } else {
          console.log(
            "No complete NLP results found for accumulated transcription:",
            originalTranscription
          );
        }
      } catch (error) {
        console.error("Error in complete command processing:", error);
      } finally {
        sessionState.setProcessingVoiceCommand(false);
      }
    }
  );

  transcriptionBuffer.on("error", (error: any) => {
    console.error("TranscriptionBuffer error:", error);
    socket.emit("error", { message: "Error processing command" });
    sessionState.setProcessingVoiceCommand(false);
  });

  socket.on("start-recording", () => {
    console.log(`🔊 Starting recording for ${socket.id}`);
    // Close existing connection if any
    const oldConnId = socketConnectionIds.get(socket.id);
    if (oldConnId) {
      speechService.closeLiveConnection(oldConnId);
      socketConnectionIds.delete(socket.id);
    }
    // Create new connection only when actually starting to record
    const connectionId = createNewConnection();
  });

  socket.on("voice-stream", async (audioChunk: any) => {
    try {
      // Get the current connection ID
      const connectionId = socketConnectionIds.get(socket.id);
      if (!connectionId) {
        console.error(`🔊 No Deepgram connection found for ${socket.id}`);
        socket.emit("error", { message: "No voice connection established" });
        return;
      }

      let buffer: Buffer;
      if (audioChunk instanceof Buffer) {
        buffer = audioChunk;
      } else if (audioChunk instanceof ArrayBuffer) {
        buffer = Buffer.from(audioChunk);
      } else if (audioChunk instanceof Blob) {
        const arrayBuffer = await audioChunk.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        console.error(`🔊 Unsupported audio chunk format:`, audioChunk);
        return;
      }
      console.log(
        `[${new Date().toISOString()}] 🔊 Audio chunk received for ${
          socket.id
        }, size: ${buffer.length} bytes`
      );
      const success = speechService.sendAudioChunk(connectionId, buffer);
      if (!success)
        console.warn(`🔊 Failed to send audio chunk for ${socket.id}`);
    } catch (error) {
      console.error(`🔊 Audio chunk error for ${socket.id}:`, error);
    }
  });

  socket.on("stop-recording", () => {
    console.log(`🔊 Stopping recording for ${socket.id}`);
    const connId = socketConnectionIds.get(socket.id);
    if (connId) {
      speechService.closeLiveConnection(connId);
      socketConnectionIds.delete(socket.id);
    }
  });

  socket.on(
    "process-text",
    async (data: { text: string; isFinal: boolean; source?: string }) => {
      console.log(`📝 Processing text input for ${socket.id}: "${data.text}"`);

      try {
        // Emit the transcription event to maintain consistency with voice flow
        socket.emit("transcription", {
          text: data.text,
          isFinal: data.isFinal,
          confidence: 1.0,
          source: data.source || "text-input",
        });

        // Process the text through the same pipeline as voice transcriptions
        if (data.isFinal && data.text.trim()) {
          sessionState.setProcessingVoiceCommand(true);

          // Add to user's conversation history
          sessionState.addUserMessage(data.text);

          // Process through transcription buffer which handles NLP
          await transcriptionBuffer.addTranscription(data.text);
        }
      } catch (error) {
        console.error("Error processing text input:", error);
        socket.emit("error", { message: "Failed to process text input" });
        sessionState.setProcessingVoiceCommand(false);
      }
    }
  );

  socket.on("confirm-command", async (command) => {
    console.log(`🔊 User confirmed command via UI: ${JSON.stringify(command)}`);

    if (userInfo.previousConfirmations) {
      userInfo.previousConfirmations.correct++;
      userInfo.previousConfirmations.total++;
    }

    userInfo.sessionItems.push(command.item);
    if (userInfo.sessionItems.length > 10) {
      userInfo.sessionItems.shift();
    }

    try {
      await logSystemAction(
        "Command",
        `Manually confirmed: ${command.action} ${command.quantity} ${command.unit} of ${command.item}`,
        "success",
        userInfo.userId
      );
      console.log(`📝 Logged command confirmation to database`);
    } catch (error) {
      console.error("Error logging command confirmation:", error);
    }

    sessionState.setPendingConfirmation(null);
  });

  socket.on("reject-command", async (command) => {
    console.log(`🔊 User rejected command via UI: ${JSON.stringify(command)}`);

    if (userInfo.previousConfirmations) {
      userInfo.previousConfirmations.total++;
    }

    try {
      await logSystemAction(
        "Command",
        `Manually rejected: ${command.action} ${command.quantity} ${command.unit} of ${command.item}`,
        "info",
        userInfo.userId
      );
      console.log(`📝 Logged command rejection to database`);
    } catch (error) {
      console.error("Error logging command rejection:", error);
    }

    sessionState.setPendingConfirmation(null);
  });

  socket.on(
    "correct-command",
    (originalCommand, correctedCommand, mistakeType) => {
      console.log(
        `🔊 User corrected command: ${JSON.stringify(
          originalCommand
        )} -> ${JSON.stringify(correctedCommand)}`
      );

      confirmationService.recordConfirmationResult(socket.id, false, {
        originalCommand,
        correctedCommand,
        mistakeType,
      });

      userInfo.sessionItems.push(correctedCommand.item);
      if (userInfo.sessionItems.length > 10) {
        userInfo.sessionItems.shift();
      }

      sessionState.setPendingConfirmation(null);
    }
  );

  socket.on("undo", () => {
    const actionLogs = sessionActionLogs.get(socket.id);
    if (actionLogs && actionLogs.length > 0) {
      const lastAction = actionLogs.pop();
      if (lastAction) {
        socket.emit("command-undo", { lastAction });
      }
    }
  });

  socket.on(
    "clarify-selection",
    async (data: {
      originalText: string;
      selectedItem: string;
      transcription: string;
    }) => {
      console.log(
        `🔊 User clarified selection for ${socket.id}: "${data.originalText}" -> "${data.selectedItem}"`
      );

      try {
        sessionState.setProcessingVoiceCommand(true);

        // Re-process the original transcription with the clarified item
        const nlpResults = await nlpService.processTranscription(
          data.transcription
        );

        if (nlpResults && nlpResults.length > 0) {
          const nlpResult = nlpResults[0];

          // Override the item with the user's selection
          const clarifiedResult = {
            ...nlpResult,
            item: data.selectedItem,
            isComplete: true,
          };

          console.log(
            `🔊 Processing clarified command: ${clarifiedResult.action} ${clarifiedResult.quantity} ${clarifiedResult.unit} of ${data.selectedItem}`
          );

          // Check if the action is valid for inventory operations
          if (clarifiedResult.action === "unknown") {
            socket.emit("error", {
              message: "Could not determine the action for this command",
            });
            return;
          }

          const actionLog: ActionLog = {
            type: clarifiedResult.action as "add" | "remove" | "set",
            itemId: clarifiedResult.item,
            quantity: clarifiedResult.quantity,
            previousQuantity: undefined,
          };

          sessionActionLogs.get(socket.id)?.push(actionLog);

          socket.emit("command-processed", {
            command: clarifiedResult,
            actionLog,
          });

          try {
            await inventoryService.updateInventoryCount(
              {
                action: clarifiedResult.action as "add" | "remove" | "set",
                item: clarifiedResult.item,
                quantity: clarifiedResult.quantity || 0,
                unit: clarifiedResult.unit,
              },
              {
                user: socket.data.user || {
                  id: socket.id,
                  email: "voice@user.com",
                  name: "Voice User",
                },
              },
              "voice"
            );

            console.log(
              `📝 Updated inventory after clarification: ${clarifiedResult.item} ${clarifiedResult.quantity} ${clarifiedResult.unit}`
            );

            const feedback = speechFeedbackService.generateSuccessFeedback(
              clarifiedResult.action,
              clarifiedResult.quantity || 0,
              clarifiedResult.unit,
              clarifiedResult.item
            );

            if (feedback) {
              sessionState.addAssistantMessage(feedback.text);
              socket.emit("feedback", feedback);
            }

            // Add item to session items for future context
            userInfo.sessionItems.push(clarifiedResult.item);
            if (userInfo.sessionItems.length > 10) {
              userInfo.sessionItems.shift();
            }
          } catch (error) {
            console.error(
              "Error updating inventory after clarification:",
              error
            );
            socket.emit("error", {
              message: "Failed to update inventory with selected item",
            });
          }
        } else {
          socket.emit("error", {
            message: "Failed to process clarified command",
          });
        }
      } catch (error) {
        console.error("Error processing clarification:", error);
        socket.emit("error", {
          message: "Failed to process your selection",
        });
      } finally {
        sessionState.setProcessingVoiceCommand(false);
      }
    }
  );

  socket.on("disconnect", (reason) => {
    console.log(`🔊 Client ${socket.id} disconnected, reason:`, reason);
    const connId = socketConnectionIds.get(socket.id);
    if (connId) {
      speechService.closeLiveConnection(connId);
      socketConnectionIds.delete(socket.id);
    }
    // Clean up session data
    sessionActionLogs.delete(socket.id);
  });
});

// Handle inventory namespace connections
inventoryNamespace.on("connection", (socket: Socket) => {
  console.log("📦 Inventory client connected:", socket.id);

  socket.on("error", (error) => {
    console.error(`📦 Inventory client ${socket.id} error:`, error);
    socket.emit("error", { message: "Inventory connection error" });
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `📦 Inventory client ${socket.id} disconnected, reason:`,
      reason
    );
  });

  // Handle inventory-specific events here
  socket.on("inventory-update", async (data) => {
    try {
      // Process inventory update
      console.log(`📦 Received inventory update from ${socket.id}:`, data);
      // Emit update to all connected inventory clients
      inventoryNamespace.emit("inventory-updated", data);
    } catch (error) {
      console.error(`📦 Error processing inventory update:`, error);
      socket.emit("error", { message: "Failed to process inventory update" });
    }
  });
});

app.use("/api/inventory", inventoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/waiting-list", waitingListRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/undo", undoRoutes);

app.get("/", (req, res) => {
  res.json({ status: "Server running" });
});

app.get("*", (req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.use(errorHandler);

server.listen(PORT, () => {
  console.log("Server running on environment:", process.env.NODE_ENV);
  console.log(`Server running on http://localhost:${PORT}`);

  // Start periodic cleanup of expired undo actions
  setInterval(async () => {
    try {
      await undoService.cleanupExpiredActions();
    } catch (error) {
      console.error("Error during periodic undo cleanup:", error);
    }
  }, 60 * 60 * 1000); // Run every hour
});
