// backend/src/app.ts
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import sessionLogsRoutes from './routes/sessionLogs';
import speechService from './services/speechService';
import { NlpService } from './services/nlpService';
import inventoryService from './services/inventoryService';
import confirmationService from './services/confirmationService';
import speechFeedbackService from './services/speechFeedbackService';
import { logTranscript, logSystemAction } from './services/sessionLogsService';
import TranscriptionBuffer from './services/transcriptionBuffer';
import { errorHandler } from './middleware/errorHandler';
import { SessionStateService } from './services/sessionStateService';
import { ActionLog } from './types/actionLog';
import type { NlpResult } from './types/nlp';
import { ValidationError } from './errors';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  path: '/socket.io/',
  pingTimeout: 60000, // Increase timeout to reduce premature disconnects
  pingInterval: 25000,
});

const PORT = process.env.PORT || 8080;

const voiceNamespace = io.of('/voice');

// Add session action logs storage
const sessionActionLogs = new Map<string, ActionLog[]>();

// Inside voiceNamespace.on('connection', ...)
voiceNamespace.on('connection', (socket: Socket) => {
  console.log('🔊 Client connected:', socket.id);

  // Initialize action log for this session
  sessionActionLogs.set(socket.id, []);

  const userInfo = {
    userId: socket.id,
    role: 'standard', // Default role, can be changed based on authentication
    previousConfirmations: {
      correct: 0,
      total: 0
    },
    sessionItems: [] as string[] // Track items processed in this session
  };
  
  // Initialize session state service for this socket
  const sessionState = new SessionStateService();
  
  const nlpService = new NlpService();
  
  // Create transcription buffer
  const transcriptionBuffer = new TranscriptionBuffer(nlpService);
  
  // Add timeout tracking for command continuation
  let lastTranscriptionTime = 0;
  const COMMAND_CONTINUATION_TIMEOUT = 3000; // 3 seconds timeout to consider continuations
  
  const callbacks = {
    onTranscript: async (transcript: string, isFinal: boolean, confidence: number) => {
      socket.emit('transcription', { text: transcript, isFinal, confidence });
      
      // Log the transcript to the database
      if (isFinal) {
        try {
          await logTranscript(transcript, true, confidence, userInfo.userId);
        } catch (error) {
          console.error('Error logging transcript:', error);
        }
      }
      
      const currentTime = Date.now();
      const timeSinceLastTranscription = currentTime - lastTranscriptionTime;
      
      // Process only final transcriptions
      if (isFinal && transcript.trim() && !sessionState.getProcessingVoiceCommand()) {
        // Update last transcription time
        lastTranscriptionTime = currentTime;
        sessionState.setProcessingVoiceCommand(true);

        try {
          // Add the transcript to the buffer
          transcriptionBuffer.addTranscription(transcript);
          
          // Get the complete buffered command
          const bufferedTranscript = transcriptionBuffer.getCurrentBuffer();
          console.log(`🧠 [Buffer] Current buffer: "${bufferedTranscript}"`);
          
          // Process the full buffered transcript if it's been enough time since the last transcription
          // or if the current transcription seems like it could complete a command
          const timeSinceLastAdd = transcriptionBuffer.getTimeSinceLastAddition();
          const shouldProcessBuffer = 
            timeSinceLastAdd >= COMMAND_CONTINUATION_TIMEOUT || 
            transcript.toLowerCase().endsWith('.') ||
            transcript.toLowerCase().includes('milk') ||
            transcript.toLowerCase().includes('box') ||
            transcript.toLowerCase().includes('item');
            
          if (shouldProcessBuffer) {
            console.log(`🧠 [Buffer] Processing complete buffer: "${bufferedTranscript}"`);
            
            // Process the complete buffered transcript
            const nlpResults = await nlpService.processTranscription(bufferedTranscript);
            
            // If we got complete results, clear the buffer
            if (nlpResults.some(result => result.isComplete)) {
              transcriptionBuffer.clearBuffer();
            }
            
            for (const nlpResult of nlpResults) {
              if (nlpResult.isComplete && nlpResult.action !== 'unknown') {
                sessionState.setStateType('normal');
                
                // create action log
                const actionLog: ActionLog = {
                  type: nlpResult.action as 'add' | 'remove' | 'set',
                  itemId: nlpResult.item,
                  quantity: nlpResult.quantity,
                  previousQuantity: undefined // Add previous quantity for 'set' actions
                };

                // store action log
                sessionActionLogs.get(socket.id)?.push(actionLog);

                // Emit to client
                socket.emit('command-processed', {
                  command: nlpResult,
                  actionLog
                });

                if (nlpResult.action === 'undo') {
                  // TODO: undo last action
                } else {
                  // update inventory count
                  try {
                    await inventoryService.updateInventoryCount({
                      action: nlpResult.action,
                      item: nlpResult.item,
                      quantity: nlpResult.quantity || 0,
                      unit: nlpResult.unit
                    });
                    console.log(`📝 Updated inventory: ${nlpResult.item} ${nlpResult.quantity} ${nlpResult.unit}`);
                  } catch (error: unknown) {
                    if (error instanceof ValidationError) {
                      // Handle ambiguous matches by emitting a clarification event
                      socket.emit('clarification-needed', {
                        message: error.message,
                        originalCommand: {
                          action: nlpResult.action,
                          item: nlpResult.item,
                          quantity: nlpResult.quantity,
                          unit: nlpResult.unit
                        }
                      });
                      console.log(`🔍 Ambiguous match detected: ${error.message}`);
                    } else {
                      console.error('Error updating inventory:', error);
                      socket.emit('error', { message: 'Failed to update inventory' });
                    }
                  }
                }
              }
            };
            
            // If we have a valid command, determine confirmation type
            if (nlpResults.some(result => result.isComplete)) {
              const firstCompleteResult = nlpResults.find(result => result.isComplete);
              if (firstCompleteResult) {
                try {
                  // Get current item details if possible
                  let currentQuantity: number | undefined;
                  let threshold: number | undefined;
                  let similarItems: string[] | undefined;
                  
                  // Determine confirmation type using the first complete result
                  const confirmationResult = confirmationService.determineConfirmationType({
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
                    sessionItems: userInfo.sessionItems
                  });
                  
                  console.log(`🔊 Confirmation result:`, confirmationResult);
                  
                  // Generate speech feedback if applicable
                  const speechFeedback = speechFeedbackService.generateCommandFeedback(
                    firstCompleteResult.action,
                    firstCompleteResult.quantity,
                    firstCompleteResult.unit,
                    firstCompleteResult.item,
                    confirmationResult.feedbackMode
                  );
                  
                  // If this requires voice confirmation, store the pending command
                  if (confirmationResult.type === 'voice') {
                    sessionState.setPendingConfirmation({
                      command: {
                        action: firstCompleteResult.action as 'add' | 'remove' | 'set' | 'unknown',
                        item: firstCompleteResult.item,
                        quantity: firstCompleteResult.quantity,
                        unit: firstCompleteResult.unit
                      },
                      confirmationResult,
                      speechFeedback: speechFeedback?.text
                    });
                  }
                  
                  // Send the NLP response with confirmation details to the client
                  socket.emit('nlp-response', {
                    ...firstCompleteResult,
                    confirmationType: confirmationResult.type,
                    feedbackMode: confirmationResult.feedbackMode,
                    timeoutSeconds: confirmationResult.timeoutSeconds,
                    suggestedCorrection: confirmationResult.suggestedCorrection,
                    riskLevel: confirmationResult.riskLevel,
                    speechFeedback: speechFeedback?.text
                  });
                  
                  // If this was an implicit confirmation, track the item for session context
                  if (confirmationResult.type === 'implicit') {
                    userInfo.sessionItems.push(firstCompleteResult.item);
                    // Keep the session items list manageable
                    if (userInfo.sessionItems.length > 10) {
                      userInfo.sessionItems.shift(); // Remove oldest item
                    }
                  }
                } catch (error) {
                  console.error('Error processing command:', error);
                }
              }
            } else {
              console.log('No complete NLP results found for transcription:', bufferedTranscript);
            }
          } else {
            console.log(`🧠 [Buffer] Waiting for more input, current buffer: "${bufferedTranscript}"`);
          }
          
          // Always reset the processing state after we're done
          sessionState.setProcessingVoiceCommand(false);
        } catch (error) {
          console.error('Error in transcription processing:', error);
          sessionState.setProcessingVoiceCommand(false);
        }
      }
    },
    onError: (error: any) => {
      console.error('🔊 Transcription error:', error);
      socket.emit('error', { message: 'Speech recognition error' });
      sessionState.setProcessingVoiceCommand(false);
    },
  };

  const connectionId = speechService.createLiveConnection(
    { sampleRate: 48000, channels: 1, language: 'en-US', model: 'nova-2' },
    callbacks
  );

  socket.on('voice-stream', async (audioChunk: any) => {
    // console.log(`🔊 Received audio chunk for ${socket.id}, size:`, audioChunk?.size || audioChunk?.length || 'unknown');
    try {
      let buffer: Buffer;
      if (audioChunk instanceof Buffer) buffer = audioChunk;
      else if (audioChunk instanceof ArrayBuffer) buffer = Buffer.from(audioChunk);
      else if (audioChunk instanceof Blob) {
        const arrayBuffer = await audioChunk.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        console.error(`🔊 Unsupported audio chunk format:`, audioChunk);
        return;
      }
      const success = speechService.sendAudioChunk(connectionId, buffer);
      if (!success) console.warn(`🔊 Failed to send audio chunk for ${socket.id}`);
    } catch (error) {
      console.error(`🔊 Audio chunk error for ${socket.id}:`, error);
    }
  });

  // Handle user confirmation via button click
  socket.on('confirm-command', async (command) => {
    console.log(`🔊 User confirmed command via UI: ${JSON.stringify(command)}`);
    
    // Record a successful confirmation
    if (userInfo.previousConfirmations) {
      userInfo.previousConfirmations.correct++;
      userInfo.previousConfirmations.total++;
    }
    
    // Add to session items for context
    userInfo.sessionItems.push(command.item);
    if (userInfo.sessionItems.length > 10) {
      userInfo.sessionItems.shift(); // Remove oldest item
    }
    
    // Log the confirmation to the database
    try {
      await logSystemAction(
        'Command',
        `Manually confirmed: ${command.action} ${command.quantity} ${command.unit} of ${command.item}`,
        'success',
        userInfo.userId
      );
      console.log(`📝 Logged command confirmation to database`);
    } catch (error) {
      console.error('Error logging command confirmation:', error);
    }
    
    // Clear pending confirmation
    sessionState.setPendingConfirmation(null);
  });
  
  // Handle user rejection via button click
  socket.on('reject-command', async (command) => {
    console.log(`🔊 User rejected command via UI: ${JSON.stringify(command)}`);
    
    // Record a rejection
    if (userInfo.previousConfirmations) {
      userInfo.previousConfirmations.total++;
    }
    
    // Log the rejection to the database
    try {
      await logSystemAction(
        'Command',
        `Manually rejected: ${command.action} ${command.quantity} ${command.unit} of ${command.item}`,
        'info',
        userInfo.userId
      );
      console.log(`📝 Logged command rejection to database`);
    } catch (error) {
      console.error('Error logging command rejection:', error);
    }
    
    // Clear pending confirmation
    sessionState.setPendingConfirmation(null);
  });
  
  // Handle command correction
  socket.on('correct-command', (originalCommand, correctedCommand, mistakeType) => {
    console.log(`🔊 User corrected command: ${JSON.stringify(originalCommand)} -> ${JSON.stringify(correctedCommand)}`);
    
    // Record the correction detail
    confirmationService.recordConfirmationResult(
      socket.id,
      false, // Not correct
      {
        originalCommand,
        correctedCommand,
        mistakeType
      }
    );
    
    // Add corrected item to session context
    userInfo.sessionItems.push(correctedCommand.item);
    if (userInfo.sessionItems.length > 10) {
      userInfo.sessionItems.shift();
    }
    
    // Clear pending confirmation
    sessionState.setPendingConfirmation(null);
  });
  
  // Handle undo command
  socket.on('undo', () => {
    const actionLogs = sessionActionLogs.get(socket.id);
    if (actionLogs && actionLogs.length > 0) {
      const lastAction = actionLogs.pop();
      if (lastAction) {
        socket.emit('command-undo', { lastAction });
      }
    }
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`🔊 Client ${socket.id} disconnected, reason:`, reason);
    speechService.closeLiveConnection(connectionId);
  });
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/session-logs', sessionLogsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/auth', authRoutes); // Register auth routes

// Error handling middleware should be last
app.use(errorHandler);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});