import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useNotification } from '../context/NotificationContext';

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
      console.log('Cleaning up WebSocket connection');
      
      // Only stop recording if we're actually recording
      if (isListening) {
        stopRecording();
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
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
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
        setIsListening(false);
        setFeedback('Voice recognition stopped');
        
        // Notify server that recording has stopped
        if (socket && isConnected) {
          socket.emit('stop-recording');
        }
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop the media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Notify server that recording has stopped
    if (socket && isConnected && isListening) {
      console.log('Sending stop-recording event');
      socket.emit('stop-recording');
    }
    
    setIsListening(false);
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
  
  // Render component
  return (
    <div className="voice-control p-4 bg-gray-100 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Voice Control</h2>
        <div className={`connection-status ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
          {socket && <span className="text-xs ml-2">({socket.io?.opts?.transports?.[0] || 'unknown'})</span>}
        </div>
      </div>
      
      <div className="mb-4">
        <button
          onClick={toggleRecording}
          className={`px-4 py-2 rounded-full w-full font-bold ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          disabled={!isConnected}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
      </div>
      
      {feedback && (
        <div className="feedback mb-4 p-2 bg-gray-200 rounded">
          {feedback}
        </div>
      )}
      
      {transcript && (
        <div className="transcript mb-4">
          <h3 className="font-semibold">Transcript:</h3>
          <p className={getConfidenceClass()}>{transcript}</p>
          <div className="text-xs text-gray-500">
            Confidence: {Math.round(confidence * 100)}%
          </div>
        </div>
      )}
      
      {pendingConfirmation && (
        <div className="confirmation p-3 bg-yellow-100 border border-yellow-300 rounded mb-4">
          <p className="mb-2">
            Confirm: {pendingConfirmation.action} {pendingConfirmation.quantity}{' '}
            {pendingConfirmation.unit} of {pendingConfirmation.item}?
          </p>
          <div className="flex space-x-2">
            <button
              onClick={confirmUpdate}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Confirm
            </button>
            <button
              onClick={cancelUpdate}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceControl; 