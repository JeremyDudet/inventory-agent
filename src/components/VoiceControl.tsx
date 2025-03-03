// frontend/src/components/VoiceControl.tsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useNotification } from '../context/NotificationContext';
import AudioVisualizer from './AudioVisualizer';

interface VoiceControlProps {
  onUpdate: (update: { item: string; action: string; quantity: number; unit: string }) => void;
  onFailure: () => void;
  onListeningChange?: (isListening: boolean, stream: MediaStream | null) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ onUpdate, onFailure, onListeningChange, onConnectionChange }) => {
  const isFirstRender = useRef(true);
  const [transcript, setTranscript] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState<Array<{
    text: string;
    isFinal: boolean;
    confidence: number;
    timestamp: number;
  }>>([]);
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
    confidence: number;
    confirmationType?: string;
    feedbackMode?: string;
    timeoutSeconds?: number;
    suggestedCorrection?: string;
    riskLevel?: string;
    confirmationTimer?: NodeJS.Timeout;
  } | null>(null);
  
  const { addNotification } = useNotification();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isListening && stream) {
      stopRecording();
    }
  }, [isListening]);

  useEffect(() => {
    const SOCKET_URL = 'http://localhost:8080/voice';
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 60000,
      autoConnect: true,
      path: '/socket.io/',
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setFeedback('Connected to voice server');
      if (!isConnected) addNotification('success', 'Connected to voice server');
      if (onConnectionChange) onConnectionChange(true);
      socket.emit('ping');
      pingIntervalRef.current = window.setInterval(() => {
        if (socket.connected) socket.emit('ping');
      }, 15000);
    });

    socket.on('connect_error', (error: Error) => {
      setIsConnected(false);
      setFeedback(`Connection error: ${error.message}`);
      addNotification('error', 'Failed to connect');
      if (onConnectionChange) onConnectionChange(false);
      onFailure();
    });

    socket.on('disconnect', (reason: string) => {
      setIsConnected(false);
      setFeedback(`Disconnected: ${reason}`);
      addNotification('warning', `Disconnected: ${reason}`);
      if (onConnectionChange) onConnectionChange(false);
    });

    socket.on('error', (data: { message: string }) => {
      setFeedback(`Error: ${data.message}`);
      addNotification('error', data.message);
      stopRecording();
    });

    socket.on('command-confirmed', (confirmedCommand: any) => {
      handleInventoryUpdate(confirmedCommand);
      setFeedback(`Voice confirmed: ${confirmedCommand.action} ${confirmedCommand.quantity} ${confirmedCommand.unit} of ${confirmedCommand.item}`);
    });

    socket.on('command-corrected', (correctedCommand: any) => {
      handleInventoryUpdate(correctedCommand);
      setFeedback(`Command corrected: ${correctedCommand.action} ${correctedCommand.quantity} ${correctedCommand.unit} of ${correctedCommand.item}`);
    });

    socket.on('command-rejected', () => {
      setPendingConfirmation(null);
      setFeedback('Command rejected via voice');
      addNotification('info', 'Command rejected');
    });

    // **Key Change: Only show final transcriptions**
    socket.on('transcription', (data: { text: string; isFinal: boolean; confidence?: number }) => {
      console.log('Transcription received:', data);
      if (data.isFinal) {
        setTranscript(data.text || '');
        if (data.confidence !== undefined) setConfidence(data.confidence);
        setTranscriptHistory(prev => {
          const newEntry = {
            text: data.text || '(no speech detected)',
            isFinal: true,
            confidence: data.confidence || 0,
            timestamp: Date.now()
          };
          const newHistory = [...prev, newEntry].slice(-10);
          console.log('Updated history:', newHistory);
          return newHistory;
        });
        if (data.text.trim()) setProcessingCommand(true);
      }
    });

    socket.on('nlp-response', (data: { 
      action: string; 
      item: string; 
      quantity: number; 
      unit: string; 
      confidence: number;
      confirmationType?: string;
      feedbackMode?: string;
      timeoutSeconds?: number;
      suggestedCorrection?: string;
      riskLevel?: string;
    }) => {
      setProcessingCommand(false);
      const confirmationType = data.confirmationType || 'visual';
      const timeoutSeconds = data.timeoutSeconds || 0;
      const suggestedCorrection = data.suggestedCorrection;

      if (confirmationType === 'implicit') {
        handleInventoryUpdate(data);
        if (data.feedbackMode === 'brief' || data.feedbackMode === 'detailed') {
          const message = `${data.action}ing ${data.quantity} ${data.unit} of ${data.item}`;
          addNotification('info', message);
          setFeedback(message);
        }
      } else if (confirmationType === 'voice') {
        setPendingConfirmation({ ...data, confirmationType: 'voice', timeoutSeconds });
        const promptMessage = suggestedCorrection || `Did you mean to ${data.action} ${data.quantity} ${data.unit} of ${data.item}? Say yes or no.`;
        setFeedback(promptMessage);
        addNotification('info', 'Please confirm with your voice or click a button');
      } else if (confirmationType === 'visual' || confirmationType === 'explicit') {
        setPendingConfirmation({ ...data, confirmationType, timeoutSeconds });
        const message = data.action === 'unknown'
          ? `Unrecognized command: "${data.item}". Please retry or confirm manually.`
          : suggestedCorrection || `Confirm: ${data.action} ${data.quantity} ${data.unit} of ${data.item}?`;
        setFeedback(message);
        if (data.action === 'unknown') addNotification('error', 'Command not recognized');
        if (timeoutSeconds > 0) {
          const timer = setTimeout(() => {
            if (pendingConfirmation && pendingConfirmation.item === data.item) {
              handleInventoryUpdate(data);
              setFeedback(`Auto-confirmed: ${data.action} ${data.quantity} ${data.unit} of ${data.item}`);
            }
          }, timeoutSeconds * 1000);
          return () => clearTimeout(timer);
        }
      }
    });

    setSocket(socket);

    return () => {
      stopRecording();
      if (pingIntervalRef.current) window.clearInterval(pingIntervalRef.current);
      socket.disconnect();
    };
  }, []);

  const handleInventoryUpdate = (data: { action: string; item: string; quantity: number; unit: string }) => {
    if (data.action !== 'unknown') {
      onUpdate(data);
      setPendingConfirmation(null);
      setFeedback(`Updated: ${data.action}ed ${data.quantity} ${data.unit} of ${data.item}`);
    } else {
      setFeedback('Command not recognized. Please try again.');
      setPendingConfirmation(null);
    }
  };

  const startRecording = async () => {
    if (!socket || !isConnected) {
      setFeedback('Not connected to server');
      return;
    }
    setPendingConfirmation(null);
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    streamRef.current = mediaStream;
    setStream(mediaStream);

    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    const source = audioContextRef.current.createMediaStreamSource(mediaStream);
    source.connect(analyserRef.current);

    const mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm;codecs=opus' });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && socket && isConnected) {
        socket.emit('voice-stream', event.data);
      }
    };

    mediaRecorder.onstart = () => {
      setIsListening(true);
      setFeedback('Listening...');
      setTranscript('');
      if (onListeningChange) onListeningChange(true, mediaStream);
    };

    mediaRecorder.onstop = () => {
      setFeedback('Stopped');
    };

    mediaRecorder.onerror = (event) => {
      console.error('Recorder error:', event);
      setFeedback('Recording error');
      stopRecording();
    };

    mediaRecorder.start(500);
    setConfidence(0);
  };

  const stopRecording = () => {
    setIsListening(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (socket && isConnected) socket.emit('stop-recording');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    setStream(null);
    if (onListeningChange) onListeningChange(false, null);
  };

  const toggleRecording = () => {
    if (isListening) stopRecording();
    else startRecording();
  };

  const confirmUpdate = () => {
    if (pendingConfirmation) {
      handleInventoryUpdate(pendingConfirmation);
      if (socket && isConnected) {
        socket.emit('confirm-command', {
          action: pendingConfirmation.action,
          item: pendingConfirmation.item,
          quantity: pendingConfirmation.quantity,
          unit: pendingConfirmation.unit
        });
      }
    }
  };

  const cancelUpdate = () => {
    if (pendingConfirmation && socket && isConnected) {
      socket.emit('reject-command', {
        action: pendingConfirmation.action,
        item: pendingConfirmation.item,
        quantity: pendingConfirmation.quantity,
        unit: pendingConfirmation.unit
      });
    }
    setPendingConfirmation(null);
    setFeedback('Update cancelled');
  };

  const getConfidenceClass = () => {
    if (confidence > 0.8) return 'text-green-500';
    if (confidence > 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getActionIcon = (action: string | undefined) => {
    switch (action) {
      case 'add': return <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;
      case 'remove': return <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 010 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
      case 'set': return <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
      default: return null;
    }
  };

  return (
    <div className="voice-control p-4 bg-base-100 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold">Voice Control</h2>
          <div className={`connection-status ml-3 flex items-center gap-1 text-xs ${isConnected ? 'text-success' : 'text-error'}`}>
            <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={toggleRecording}
          className={`btn btn-lg w-full ${isListening ? 'btn-error' : 'btn-primary'}`}
          disabled={!isConnected}
        >
          {isListening ? (
            <>
              <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
              Stop Listening
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              Start Listening
            </>
          )}
        </button>
      </div>

      {analyserRef.current && (
        <AudioVisualizer analyser={analyserRef.current} />
      )}

      {feedback && (
        <div className="feedback mt-4 p-3 bg-base-200 rounded-lg">{feedback}</div>
      )}

      <div className="transcript mt-4 p-3 bg-base-200 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Live Transcript: {isListening ? '(Listening)' : '(Idle)'}</h3>
          <div className="flex items-center">
            <span className="text-xs opacity-70 mr-2">Confidence:</span>
            <div className="w-24 h-2 bg-base-300 rounded-full overflow-hidden">
              <div
                className={`h-full ${confidence > 0.8 ? 'bg-success' : confidence > 0.5 ? 'bg-warning' : 'bg-error'}`}
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-xs ml-2">{Math.round(confidence * 100)}%</span>
          </div>
        </div>

        <div className="bg-base-100 p-3 rounded-lg mb-2 min-h-[3rem] border border-base-300">
          {transcript ? (
            <p className={`text-lg ${getConfidenceClass()}`}>
              {transcript}
            </p>
          ) : (
            <p className="text-base-content/40">
              {isListening ? 'Listening...' : 'Say something to start'}
            </p>
          )}
        </div>

        <div className="mt-2">
          <div className="text-xs opacity-70 mb-1 flex justify-between">
            <span>Transcript History ({transcriptHistory.length})</span>
            <button className="text-xs opacity-50 hover:opacity-100" onClick={() => setTranscriptHistory([])}>Clear</button>
          </div>
          {transcriptHistory.length === 0 ? (
            <div className="p-2 bg-base-300 rounded text-center text-sm opacity-50">
              No transcriptions yet
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[200px] space-y-1">
              {transcriptHistory.map((item, index) => (
                <div
                  key={item.timestamp + index}
                  className="p-2 rounded text-sm bg-base-300"
                >
                  <div className="flex justify-between">
                    <span className={item.confidence > 0.8 ? 'text-success' : item.confidence > 0.5 ? 'text-warning' : 'text-error'}>
                      {item.text}
                    </span>
                    <span className="text-xs opacity-50">
                      Final - {new Date(item.timestamp).toLocaleTimeString()} ({Math.round(item.confidence * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingConfirmation && (
        <div className={`confirmation mt-4 p-4 rounded-lg 
          ${pendingConfirmation.riskLevel === 'high' ? 'bg-error/20 border border-error' : 
            pendingConfirmation.riskLevel === 'medium' ? 'bg-warning/20 border border-warning' : 'bg-info/20 border border-info'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <h3 className="font-semibold">
                {pendingConfirmation.confirmationType === 'voice' ? 'Confirm with voice or buttons:' : 'Confirm this update:'}
              </h3>
            </div>
            {pendingConfirmation.timeoutSeconds && pendingConfirmation.timeoutSeconds > 0 && (
              <div className="flex items-center text-sm opacity-70">
                <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Auto-confirms in {pendingConfirmation.timeoutSeconds}s</span>
              </div>
            )}
          </div>
          <div className="bg-base-100 p-3 rounded-lg mb-3 flex items-center">
            <div className="p-2 rounded-full bg-base-200 mr-3">{getActionIcon(pendingConfirmation.action)}</div>
            <div className="flex-1">
              <span className="font-semibold capitalize">{pendingConfirmation.action}</span>
              <span className="mx-1 font-semibold">{pendingConfirmation.quantity}</span>
              <span className="mr-1">{pendingConfirmation.unit}</span>
              <span>of</span>
              <span className="ml-1 font-semibold">{pendingConfirmation.item}</span>
            </div>
            <div className="flex items-center ml-2">
              <div className="w-16 h-2 bg-base-300 rounded-full overflow-hidden">
                <div
                  className={`h-full ${pendingConfirmation.confidence > 0.8 ? 'bg-success' : pendingConfirmation.confidence > 0.5 ? 'bg-warning' : 'bg-error'}`}
                  style={{ width: `${pendingConfirmation.confidence * 100}%` }}
                ></div>
              </div>
              <span className="text-xs ml-1">{Math.round(pendingConfirmation.confidence * 100)}%</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={confirmUpdate} className="btn btn-success flex-1">
              <svg className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Confirm
            </button>
            <button onClick={cancelUpdate} className="btn btn-error flex-1">
              <svg className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="command-examples mt-4">
        <div className="collapse collapse-arrow bg-base-200">
          <input type="checkbox" />
          <div className="collapse-title text-sm font-medium">Example Voice Commands</div>
          <div className="collapse-content text-sm opacity-75">
            <ul className="list-disc pl-5 space-y-1">
              <li>"Add 5 pounds of coffee beans"</li>
              <li>"Remove 2 gallons of whole milk"</li>
              <li>"Set 10 bottles of vanilla syrup"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceControl;