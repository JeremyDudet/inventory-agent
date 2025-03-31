// backend/src/app.ts
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import speechService from './services/speechService';
import nlpService from './services/nlpService';
import confirmationService from './services/confirmationService';
import speechFeedbackService from './services/speechFeedbackService';
import { logTranscript, logSystemAction } from './services/sessionLogsService';
import TranscriptionBuffer from './services/transcriptionBuffer';
import sessionLogsRoutes from './routes/sessionLogs';
import inventoryRoutes from './routes/inventory';
import authRoutes from './routes/auth';

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

// Inside voiceNamespace.on('connection', ...)
voiceNamespace.on('connection', (socket: Socket) => {
  console.log('🔊 Client connected:', socket.id);

  const userInfo = {
    userId: socket.id,
    role: 'standard', // Default role, can be changed based on authentication
    previousConfirmations: {
      correct: 0,
      total: 0
    },
    sessionItems: [] as string[] // Track items processed in this session
  };
  
  // Store voice processing status
  let isProcessingVoiceCommand = false;
  let pendingConfirmation: any = null;
  
  // Create transcription buffer
  const transcriptionBuffer = new TranscriptionBuffer();
  
  // Add timeout tracking for command continuation
  let lastTranscriptionTime = 0;
  const COMMAND_CONTINUATION_TIMEOUT = 3000; // 3 seconds timeout to consider continuations
  
  const callbacks = {
    onTranscript: async (transcript: string, isFinal: boolean, confidence: number) => {
      console.log(`🔊 Emitting transcription to ${socket.id}: "${transcript}" (isFinal: ${isFinal}, confidence: ${confidence})`);
      socket.emit('transcription', { text: transcript, isFinal, confidence });
      
      // Log the transcript to the database
      if (isFinal) {
        try {
          await logTranscript(transcript, true, confidence, userInfo.userId);
          console.log(`📝 Logged transcript to database: "${transcript}"`);
        } catch (error) {
          console.error('Error logging transcript:', error);
        }
      }
      
      const currentTime = Date.now();
      const timeSinceLastTranscription = currentTime - lastTranscriptionTime;
      
      // If this is a final transcription, process it through NLP and confirmation
      if (isFinal && transcript.trim() && !isProcessingVoiceCommand) {
        // Update last transcription time
        lastTranscriptionTime = currentTime;
        
        try {
          // Check if this is a response to a pending confirmation
          if (pendingConfirmation) {
            // Skip numeric-only segments or "to X" phrases as confirmation responses
            // These are likely parts of multi-segment commands
            if ((/^\d+\s+\w+$/i.test(transcript.toLowerCase())) || 
                (/^to\s+.+/i.test(transcript.toLowerCase()))) {
              console.log(`🔊 Detected likely multi-segment command part, not treating as confirmation response`);
              // Continue processing as a new command by adding to buffer
            } 
            // For text that looks like confirmation responses, process them
            else if (!(/^\d+$/.test(transcript.trim()))) { // Not just a single number
              // Process as a confirmation response
              console.log(`🔊 Processing as confirmation response: "${transcript}"`);
              const correctedCommand = confirmationService.processVoiceCorrection(
                pendingConfirmation.command,
                transcript
              );
              
              if (correctedCommand) {
                // User confirmed or corrected the command
                console.log(`🔊 Voice confirmation received: ${JSON.stringify(correctedCommand)}`);
                
                // Record the confirmation result
                const wasConfirmation = correctedCommand.mistakeType === 'multiple';
                confirmationService.recordConfirmationResult(
                  socket.id, 
                  wasConfirmation,
                  {
                    originalCommand: pendingConfirmation.command,
                    correctedCommand: wasConfirmation ? undefined : correctedCommand,
                    mistakeType: wasConfirmation ? undefined : correctedCommand.mistakeType
                  }
                );
                
                // Process the confirmed/corrected command
                if (wasConfirmation) {
                  // Proceed with the original command
                  socket.emit('command-confirmed', pendingConfirmation.command);
                } else {
                  // Update with the corrected command
                  socket.emit('command-corrected', correctedCommand);
                }
                
                // Reset pending confirmation
                pendingConfirmation = null;
                return;
              } else if (/^(no|nope|incorrect|wrong|that's wrong|not right)$/i.test(transcript.toLowerCase().trim())) {
                // User rejected without correction
                console.log(`🔊 Voice rejection received`);
                socket.emit('command-rejected');
                pendingConfirmation = null;
                return;
              }
              // If we can't process it as a confirmation response, continue to process as a new command
            }
            // If we get here, we'll continue to process as a new command
          }
          
          // Mark as processing to prevent duplicate processing
          isProcessingVoiceCommand = true;
          
          // Add current transcript to the buffer
          transcriptionBuffer.addTranscription(transcript);
          const bufferContent = transcriptionBuffer.getCurrentBuffer();
          
          console.log(`🔊 Processing transcription buffer: "${bufferContent}"`);
          
          // Process the transcription through NLP
          const nlpResult = await nlpService.processTranscription(bufferContent);
          console.log(`🔊 NLP result:`, nlpResult);
          
          // Only clear buffer if:
          // 1. The command is complete, OR
          // 2. It's been more than the timeout since the last transcription AND
          //    we don't detect a pattern suggesting this is the first part of a split command
          if (nlpResult.isComplete) {
            transcriptionBuffer.clearBuffer();
            console.log(`🔊 Command is complete. Buffer cleared.`);
          } else if (timeSinceLastTranscription > COMMAND_CONTINUATION_TIMEOUT && 
                    !transcript.toLowerCase().match(/^set\s+.+/i) && 
                    !transcript.toLowerCase().match(/^update\s+.+/i) &&
                    !transcript.toLowerCase().match(/^remove\s*$/i) &&  // Don't timeout on just "remove"
                    !transcript.toLowerCase().match(/^add\s*$/i) &&     // Don't timeout on just "add"
                    !(/^\d+\s+\w+$/i.test(transcript.toLowerCase()))) {  // Don't timeout on numeric segments
            // If it's been too long since the last transcription, and this isn't
            // a command that might be split across transcriptions
            console.log(`🔊 Timeout exceeded. Clearing buffer despite incomplete command.`);
            transcriptionBuffer.clearBuffer();
          } else {
            console.log(`🔊 Command is incomplete. Keeping buffer: "${bufferContent}"`);
            // Special case hints for different command types
            if (transcript.toLowerCase().match(/^set\s+.+/i) && 
                !transcript.toLowerCase().includes(" to ")) {
              socket.emit('transcription-hint', { 
                message: "Waiting for quantity...", 
                expectedContinuation: true 
              });
            } else if (transcript.toLowerCase().match(/^remove\s*$/i)) {
              socket.emit('transcription-hint', { 
                message: "Waiting for item and quantity...", 
                expectedContinuation: true 
              });
            } else if (/^\d+\s+\w+$/i.test(transcript.toLowerCase())) {
              socket.emit('transcription-hint', { 
                message: "Waiting for item name...", 
                expectedContinuation: true 
              });
            }
          }
          
          // If we have an unknown action, try to use context from previous interactions
          // before immediately returning the result
          if (nlpResult.action === 'unknown') {
            // If it's a numeric-only segment or a "to X" segment, don't return yet -
            // this is likely part of a multi-segment command
            if ((/^\d+\s+\w+$/i.test(transcript.toLowerCase())) || 
                (/^to\s+.+/i.test(transcript.toLowerCase()))) {
              console.log(`🔊 Detected potential multi-segment command part, waiting for more input`);
              isProcessingVoiceCommand = false;
              return;
            }
            
            // Otherwise, return the unknown action result
            socket.emit('nlp-response', {
              ...nlpResult,
              confirmationType: 'explicit',
              feedbackMode: 'detailed',
              riskLevel: 'high'
            });
            isProcessingVoiceCommand = false;
            return;
          }
          
          // If we have a valid command, determine confirmation type
          try {
            // Get current item details if possible
            let currentQuantity: number | undefined;
            let threshold: number | undefined;
            let similarItems: string[] | undefined;
            
            // In a real implementation, these would come from the database
            // For now, we'll use mock/placeholder values
            // currentQuantity = await inventoryService.getItemQuantity(nlpResult.item);
            // threshold = await inventoryService.getItemThreshold(nlpResult.item);
            // similarItems = await inventoryService.getSimilarItems(nlpResult.item);
            
            // Determine confirmation type
            const confirmationResult = confirmationService.determineConfirmationType({
              confidence: nlpResult.confidence,
              action: nlpResult.action as any,
              item: nlpResult.item,
              quantity: nlpResult.quantity,
              unit: nlpResult.unit,
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
              nlpResult.action,
              nlpResult.quantity,
              nlpResult.unit,
              nlpResult.item,
              confirmationResult.feedbackMode
            );
            
            // If this requires voice confirmation, store the pending command
            if (confirmationResult.type === 'voice') {
              pendingConfirmation = {
                command: {
                  action: nlpResult.action,
                  item: nlpResult.item,
                  quantity: nlpResult.quantity,
                  unit: nlpResult.unit
                },
                confirmationResult,
                speechFeedback
              };
            }
            
            // Send the NLP response with confirmation details to the client
            socket.emit('nlp-response', {
              ...nlpResult,
              confirmationType: confirmationResult.type,
              feedbackMode: confirmationResult.feedbackMode,
              timeoutSeconds: confirmationResult.timeoutSeconds,
              suggestedCorrection: confirmationResult.suggestedCorrection,
              riskLevel: confirmationResult.riskLevel,
              speechFeedback: speechFeedback?.text
            });
            
            // If this was an implicit confirmation, track the item for session context
            if (confirmationResult.type === 'implicit') {
              userInfo.sessionItems.push(nlpResult.item);
              // Keep the session items list manageable
              if (userInfo.sessionItems.length > 10) {
                userInfo.sessionItems.shift(); // Remove oldest item
              }
            }
          } catch (error) {
            console.error('Error during confirmation processing:', error);
            socket.emit('error', { message: 'Error processing confirmation' });
          }
          
          // Reset processing flag
          isProcessingVoiceCommand = false;
        } catch (error) {
          console.error('Error processing transcription:', error);
          socket.emit('error', { message: 'Error processing voice command' });
          isProcessingVoiceCommand = false;
        }
      }
    },
    onError: (error: any) => {
      console.error('🔊 Transcription error:', error);
      socket.emit('error', { message: 'Speech recognition error' });
      isProcessingVoiceCommand = false;
    },
  };

  const connectionId = speechService.createLiveConnection(
    { sampleRate: 48000, channels: 1, language: 'en-US', model: 'nova-2' },
    callbacks
  );

  socket.on('voice-stream', async (audioChunk: any) => {
    console.log(`🔊 Received audio chunk for ${socket.id}, size:`, audioChunk?.size || audioChunk?.length || 'unknown');
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
    
    // Clear any pending confirmation
    pendingConfirmation = null;
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
    pendingConfirmation = null;
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
    pendingConfirmation = null;
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
app.use('/api/logs', sessionLogsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/auth', authRoutes); // Register auth routes

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});