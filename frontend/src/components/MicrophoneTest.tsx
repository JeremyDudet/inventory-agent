import React, { useState, useEffect, useRef } from 'react';
import AudioVisualizer from './AudioVisualizer';
import { useNotification } from '../context/NotificationContext';

/**
 * MicrophoneTest component allows users to test their microphone
 * before using voice commands
 */
const MicrophoneTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [microphoneStatus, setMicrophoneStatus] = useState<'untested' | 'working' | 'not-detected' | 'permission-denied'>('untested');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  const { addNotification } = useNotification();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Get available audio input devices
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setDevices(audioInputs);
        
        if (audioInputs.length > 0) {
          setSelectedDevice(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error('Error enumerating devices:', error);
        addNotification('error', 'Unable to access microphone devices');
      }
    }

    getDevices();
  }, [addNotification]);

  // Start microphone test
  const startTest = async () => {
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Request microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setStream(mediaStream);
      setIsTesting(true);
      setMicrophoneStatus('working');
      
      // Set up audio analysis
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 32;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        const source = audioContextRef.current.createMediaStreamSource(mediaStream);
        source.connect(analyserRef.current);
      }
      
      // Start monitoring audio levels
      monitorAudioLevel();
      
      addNotification('success', 'Microphone connected and working');
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      
      if (error.name === 'NotAllowedError') {
        setMicrophoneStatus('permission-denied');
        addNotification('error', 'Microphone permission denied. Please allow microphone access.');
      } else {
        setMicrophoneStatus('not-detected');
        addNotification('error', 'No microphone detected or error connecting to microphone');
      }
      
      setIsTesting(false);
      setStream(null);
    }
  };

  // Stop microphone test
  const stopTest = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsTesting(false);
    setAudioLevel(0);
  };

  // Monitor audio level for display
  const monitorAudioLevel = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    const updateLevel = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Calculate average volume level
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      const avg = sum / dataArrayRef.current.length;
      const normalizedLevel = Math.min(1, avg / 128); // Normalize to 0-1
      
      setAudioLevel(normalizedLevel);
      
      // Continue monitoring
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTest();
    };
  }, []);

  return (
    <div className="microphone-test p-4 bg-base-100 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Microphone Test</h3>
      
      <div className="mb-4">
        <label className="label">
          <span className="label-text">Select Microphone</span>
        </label>
        <select 
          className="select select-bordered w-full"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          disabled={isTesting}
        >
          {devices.length === 0 && (
            <option value="">No microphones found</option>
          )}
          
          {devices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId.substring(0, 5)}...`}
            </option>
          ))}
        </select>
      </div>
      
      {isTesting && (
        <div className="mb-4">
          <label className="label">
            <span className="label-text">Microphone Level</span>
          </label>
          <div className="w-full bg-base-300 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-100"
              style={{ width: `${audioLevel * 100}%` }}
            ></div>
          </div>
          <AudioVisualizer isListening={isTesting} stream={stream} />
        </div>
      )}
      
      {microphoneStatus === 'permission-denied' && (
        <div className="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Microphone Permission Denied</h3>
            <p className="text-sm">Please allow microphone access in your browser settings.</p>
          </div>
        </div>
      )}
      
      {microphoneStatus === 'not-detected' && (
        <div className="alert alert-warning mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-bold">No Microphone Detected</h3>
            <p className="text-sm">Please connect a microphone and try again.</p>
          </div>
        </div>
      )}
      
      {microphoneStatus === 'working' && isTesting && (
        <div className="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Microphone Working</h3>
            <p className="text-sm">Try speaking to see the audio levels change.</p>
          </div>
        </div>
      )}
      
      <button
        onClick={isTesting ? stopTest : startTest}
        className={`btn w-full ${isTesting ? 'btn-error' : 'btn-primary'}`}
      >
        {isTesting ? 'Stop Test' : 'Test Microphone'}
      </button>
      
      {!isTesting && (
        <p className="text-xs text-base-content/60 mt-2">
          Testing your microphone helps ensure voice commands will work properly.
        </p>
      )}
    </div>
  );
};

export default MicrophoneTest;