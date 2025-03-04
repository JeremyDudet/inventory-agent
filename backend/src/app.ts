// backend/src/app.ts
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import speechService from './services/speechService';
import nlpService from './services/nlpService';
import inventoryService from './services/inventoryService';
import confirmationService from './services/confirmationService';
import speechFeedbackService from './services/speechFeedbackService';
import { logTranscript, logSystemAction } from './services/sessionLogsService';
import sessionLogsRoutes from './routes/sessionLogs';
import inventoryRoutes from './routes/inventory';

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
      
      // If this is a final transcription, process it through NLP and confirmation
      if (isFinal && transcript.trim() && !isProcessingVoiceCommand) {
        try {
          // Check if this is a response to a pending confirmation
          if (pendingConfirmation) {
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
          
          // Mark as processing to prevent duplicate processing
          isProcessingVoiceCommand = true;
          
          // Process the transcription through NLP
          console.log(`🔊 Processing transcription for NLP: "${transcript}"`);
          const nlpResult = await nlpService.processTranscription(transcript);
          console.log(`🔊 NLP result:`, nlpResult);
          
          // If we have an unknown action, just return the result immediately
          if (nlpResult.action === 'unknown') {
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
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/logs', sessionLogsRoutes);
app.use('/api/inventory', inventoryRoutes);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});