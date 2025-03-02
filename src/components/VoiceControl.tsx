import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useNotification } from '../context/NotificationContext';
import AudioVisualizer from './AudioVisualizer';

interface VoiceControlProps {
  onUpdate: (update: { item: string; action: string; quantity: number; unit: string }) => void;
  onFailure: () => void;
}

/**
 * VoiceControl component handles voice input for inventory updates
 * It uses Socket.IO to stream audio to the backend for processing
 */
const VoiceControl: React.FC<VoiceControlProps> = ({ onUpdate, onFailure }) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [processingCommand, setProcessingCommand] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    action: string;
    item: string;
    quantity: number;
    unit: string;
  } | null>(null);
  
  const { addNotification } = useNotification();
  
  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const connectionAttemptRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Initialize Socket.IO connection
  useEffect(() => {
    // Use http/https protocol for better reliability with fallback options
    const protocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
    const host = 'localhost:8080';
    const SOCKET_URL = `${protocol}${host}`;
    
    console.log('Connecting to Socket.IO server at:', SOCKET_URL);
    
    // Create a direct connection to the voice namespace
    const socket = io(`${SOCKET_URL}/voice`, {
      transports: ['websocket', 'polling'], // Allow WebSocket with polling fallback
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 60000, // Increased timeout
      autoConnect: true,
      path: '/socket.io/' // Explicitly set the path
    });
    
    // Debug connection state
    console.log('Initial socket state:', {
      connected: socket.connected,
      id: socket.id,
      nsp: socket.nsp,
      transport: socket.io?.opts?.transports?.[0] || 'none'
    });
    
    // Log all socket events for debugging
    const originalEmit = socket.emit;
    socket.emit = function(event: string, ...args: any[]) {
      console.log(`[SOCKET EMIT] ${event}`, args.length > 0 ? args[0] : '');
      return originalEmit.apply(this, [event, ...args]);
    };
    
    // Add more debugging
    socket.io.on('reconnect_attempt', (attempt: number) => {
      console.log(`Reconnection attempt ${attempt}`);
      connectionAttemptRef.current = attempt;
    });
    
    socket.io.on('reconnect_error', (error: Error) => {
      console.error('Reconnection error:', error);
      setFeedback(`Connection error: ${error.message}. Retrying...`);
    });
    
    socket.io.on('reconnect_failed', () => {
      console.error('Failed to reconnect after all attempts');
      setFeedback('Failed to connect after multiple attempts. Please refresh the page.');
      addNotification('error', 'Connection failed. Please refresh the page and try again.');
    });
    
    socket.on('connect', () => {
      console.log('WebSocket connected successfully with ID:', socket.id, 'Namespace:', socket.nsp);
      setIsConnected(true);
      setFeedback('Connected to voice processing server');
      addNotification('success', 'Connected to voice processing server');
      
      // Send an initial ping to keep the connection alive
      socket.emit('ping');
      
      // Set up ping interval to keep connection alive
      if (pingIntervalRef.current) {
        window.clearInterval(pingIntervalRef.current);
      }
      
      pingIntervalRef.current = window.setInterval(() => {
        if (socket.connected) {
          console.log('Sending ping to server');
          socket.emit('ping');
        }
      }, 15000); // Send ping every 15 seconds
    });
    
    socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setFeedback(`Connection error: ${error.message}. Please try again.`);
      addNotification('error', 'Failed to connect to voice processing server');
      onFailure();
    });
    
    socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected, reason:', reason);
      setIsConnected(false);
      setFeedback(`Disconnected from server: ${reason}`);
      addNotification('warning', `Disconnected from voice processing server: ${reason}`);
    });
    
    socket.on('error', (data: { message: string }) => {
      console.error('Server error:', data.message);
      setFeedback(`Error: ${data.message}`);
      addNotification('error', data.message);
      stopRecording();
    });
    
    socket.on('connected', (data: { message: string, socketId: string }) => {
      console.log('Received connected event:', data);
      setIsConnected(true);
      setFeedback(data.message);
      addNotification('success', data.message);
    });
    
    socket.on('pong', () => {
      console.log('Received pong from server');
    });
    
    socket.on('transcription', (data: { text: string; isFinal: boolean; confidence?: number }) => {
      console.log('Received transcription:', data);
      setTranscript(data.text);
      
      if (data.confidence) {
        setConfidence(data.confidence);
      }
      
      if (data.isFinal && !processingCommand) {
        processTranscription(data.text, data.confidence || 0.7);
      }
    });
    
    socket.on('nlp-response', (data: { 
      action: string; 
      item: string; 
      quantity: number; 
      unit: string;
      confidence: number;
    }) => {
      console.log('Received NLP response:', data);
      setProcessingCommand(false);
      
      if (data.confidence > 0.8) {
        // High confidence, proceed with update
        handleInventoryUpdate(data);
      } else if (data.confidence > 0.5) {
        // Medium confidence, ask for confirmation
        setPendingConfirmation(data);
        setFeedback(`Did you mean to ${data.action} ${data.quantity} ${data.unit} of ${data.item}?`);
        addNotification('warning', 'Please confirm this update or try again.');
      } else {
        // Low confidence, suggest retry
        setFeedback(`I'm not sure I understood. Did you mean to ${data.action} ${data.quantity} ${data.unit} of ${data.item}? Please try again or confirm.`);
        setPendingConfirmation(data);
        addNotification('error', 'Low confidence in voice recognition. Please try again or confirm manually.');
      }
    });
    
    setSocket(socket);
    
    // Clean up on unmount
    return () => {
      console.log('Cleaning up WebSocket connection and audio resources');
      
      // Only stop recording if we're actually recording
      if (isListening) {
        stopRecording();
      } else {
        // Even if not recording, make sure all audio resources are released
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(console.error);
          audioContextRef.current = null;
          analyserRef.current = null;
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          setStream(null);
        }
      }
      
      // Clear ping interval
      if (pingIntervalRef.current) {
        window.clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Only disconnect if this component is being fully unmounted, not just re-rendered
      // We're now keeping the component mounted but hidden, so we should only disconnect on actual unmount
      console.log('Component unmounting, disconnecting socket');
      socket.disconnect();
    };
  }, []); // Empty dependency array to ensure this only runs once
  
  // Handle inventory update
  const handleInventoryUpdate = (data: { 
    action: string; 
    item: string; 
    quantity: number; 
    unit: string;
  }) => {
    onUpdate(data);
    
    // Clear any pending confirmation
    setPendingConfirmation(null);
    
    // Provide feedback
    setFeedback(`Successfully ${data.action}ed ${data.quantity} ${data.unit} of ${data.item}`);
    addNotification('success', `Inventory updated: ${data.action}ed ${data.quantity} ${data.unit} of ${data.item}`);
  };
  
  // Start recording and streaming audio
  const startRecording = async () => {
    try {
      if (!socket || !isConnected) {
        setFeedback('Not connected to server');
        return;
      }
      
      // Clear any pending confirmation when starting a new recording
      setPendingConfirmation(null);
      
      // Request microphone access with audio processing options for better results
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Store stream in both ref and state for consistency
      streamRef.current = mediaStream;
      setStream(mediaStream);
      
      // Set up audio analysis for visualization
      if (audioContextRef.current) {
        await audioContextRef.current.close();
      }
      
      // Create new audio context and analyzer
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; // More detailed visualization
      
      // Connect the stream to the analyzer
      const source = audioContextRef.current.createMediaStreamSource(mediaStream);
      source.connect(analyserRef.current);
      
      console.log('Audio visualization context initialized');
      
      // Create media recorder (separate from visualization chain)
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up data handling
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket && isConnected) {
          console.log('Sending audio chunk, size:', event.data.size);
          socket.emit('voice-stream', event.data);
        }
      };
      
      // Set up recorder events
      mediaRecorder.onstart = () => {
        setIsListening(true);
        setFeedback('Listening...');
        addNotification('info', 'Voice recognition started');
      };
      
      mediaRecorder.onstop = () => {
        // Don't set isListening to false here as it's already handled in stopRecording
        // This prevents race conditions with the stream cleanup
        setFeedback('Voice recognition stopped');
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('Media recorder error:', event);
        setIsListening(false);
        setFeedback('Error recording audio');
        addNotification('error', 'Error recording audio');
      };
      
      // Start recording with small time slices to stream data frequently
      mediaRecorder.start(500); // Send data every 500ms
      
      // Clear transcript
      setTranscript('');
      setConfidence(0);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setFeedback(`Error accessing microphone: ${error instanceof Error ? error.message : String(error)}`);
      addNotification('error', 'Could not access microphone. Please check permissions.');
      onFailure();
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    // First update UI state to prevent race conditions
    setIsListening(false);
    
    // Stop the media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Notify server that recording has stopped
    if (socket && isConnected) {
      console.log('Sending stop-recording event');
      socket.emit('stop-recording');
    }
    
    // Clean up media stream and tracks
    if (streamRef.current) {
      // Stop all tracks in the stream
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.id);
        track.stop();
      });
      // Clear the stream reference
      streamRef.current = null;
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    
    // Update state stream to null
    setStream(null);
    
    console.log('Recording stopped, all audio resources cleaned up');
  };
  
  // Toggle recording state
  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Process transcription
  const processTranscription = (text: string, transcriptConfidence: number) => {
    setProcessingCommand(true);
    setFeedback('Processing command...');
    
    // The server will process the transcription and send back an NLP response
  };
  
  // Confirm pending update
  const confirmUpdate = () => {
    if (pendingConfirmation) {
      handleInventoryUpdate(pendingConfirmation);
    }
  };
  
  // Cancel pending update
  const cancelUpdate = () => {
    setPendingConfirmation(null);
    setFeedback('Update cancelled');
  };
  
  // Get CSS class based on confidence level
  const getConfidenceClass = () => {
    if (confidence > 0.8) return 'text-green-500';
    if (confidence > 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Helper to get action icon
  const getActionIcon = (action: string | undefined) => {
    switch (action) {
      case 'add':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        );
      case 'remove':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'set':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  // Render component
  return (
    <div className="voice-control p-4 bg-base-100 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Voice Control</h2>
        <div className={`connection-status flex items-center gap-1 ${isConnected ? 'text-success' : 'text-error'}`}>
          <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
          {socket && <span className="text-xs opacity-70">({socket.io?.opts?.transports?.[0] || 'unknown'})</span>}
        </div>
      </div>
      
      <div className="mb-4">
        <button
          onClick={toggleRecording}
          className={`btn btn-lg w-full ${
            isListening
              ? 'btn-error'
              : 'btn-primary'
          }`}
          disabled={!isConnected}
        >
          {isListening ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop Listening
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start Listening
            </>
          )}
        </button>
      </div>
      
      {/* Audio Visualizer */}
      <AudioVisualizer 
        isListening={isListening}
        stream={stream}
      />
      
      {feedback && (
        <div className="feedback mt-4 p-3 bg-base-200 rounded-lg">
          {feedback}
        </div>
      )}
      
      {transcript && (
        <div className="transcript mt-4 p-3 bg-base-200 rounded-lg">
          <h3 className="font-semibold mb-1">Transcript:</h3>
          <p className={`text-lg ${getConfidenceClass()}`}>{transcript}</p>
          <div className="flex items-center mt-1">
            <span className="text-xs opacity-70 mr-2">Confidence:</span>
            <div className="w-24 h-2 bg-base-300 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  confidence > 0.8 ? 'bg-success' : 
                  confidence > 0.5 ? 'bg-warning' : 'bg-error'
                }`}
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-xs ml-2">{Math.round(confidence * 100)}%</span>
          </div>
        </div>
      )}
      
      {pendingConfirmation && (
        <div className="confirmation mt-4 p-4 bg-warning/20 border border-warning rounded-lg">
          <div className="flex items-center mb-2 text-warning-content">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <h3 className="font-semibold">Please confirm this action:</h3>
          </div>
          
          <div className="bg-base-100 p-3 rounded-lg mb-3 flex items-center">
            <div className="p-2 rounded-full bg-base-200 mr-3">
              {getActionIcon(pendingConfirmation.action)}
            </div>
            <div>
              <span className="font-semibold capitalize">{pendingConfirmation.action}</span>
              <span className="mx-1">{pendingConfirmation.quantity}</span>
              <span className="mr-1">{pendingConfirmation.unit}</span>
              <span>of</span>
              <span className="ml-1 font-semibold">{pendingConfirmation.item}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={confirmUpdate}
              className="btn btn-success flex-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Confirm
            </button>
            <button
              onClick={cancelUpdate}
              className="btn btn-error flex-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Command examples */}
      <div className="command-examples mt-4">
        <div className="collapse collapse-arrow bg-base-200">
          <input type="checkbox" /> 
          <div className="collapse-title text-sm font-medium">
            Example Voice Commands
          </div>
          <div className="collapse-content text-sm opacity-75">
            <div className="mb-2">
              <strong className="text-primary">Basic Commands:</strong>
              <ul className="list-disc pl-5 space-y-1">
                <li>"Add 5 pounds of coffee beans"</li>
                <li>"Remove 2 gallons of whole milk"</li>
                <li>"Set 10 bottles of vanilla syrup"</li>
                <li>"Check how much sugar we have"</li>
              </ul>
            </div>
            
            <div className="mb-2">
              <strong className="text-primary">Conversational Style:</strong>
              <ul className="list-disc pl-5 space-y-1">
                <li>"We need to add three more boxes of tea bags"</li>
                <li>"Can you remove 1 case of paper cups please"</li>
                <li>"I think we have 8 cartons of soy milk"</li>
                <li>"Do we have any caramel syrup left?"</li>
              </ul>
            </div>
            
            <div>
              <strong className="text-primary">Actions Supported:</strong>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="badge badge-primary">add</div>
                <div className="badge badge-error">remove</div>
                <div className="badge badge-warning">set</div>
                <div className="badge badge-info">check</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceControl; 