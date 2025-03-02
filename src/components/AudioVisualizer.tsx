import React, { useRef, useEffect, useCallback } from 'react';

interface AudioVisualizerProps {
  isListening: boolean;
  stream?: MediaStream | null;
}

/**
 * AudioVisualizer component provides visual feedback for audio input
 * It displays a waveform visualization of the audio being captured
 */
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isListening, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Resize canvas to match container
  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match container size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Re-trigger visualization if needed
    if (analyserRef.current && isListening) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      visualize();
    }
  }, [isListening]);

  // Set up the audio analyser when the stream changes
  useEffect(() => {
    if (!isListening || !stream) {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    try {
      // Create a new AudioContext each time to ensure we have a fresh connection
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Make sure canvas is properly sized before visualizing
      resizeCanvas();
      
      // Start the visualization
      visualize();
      
      console.log('Audio visualizer initialized with stream');
    } catch (error) {
      console.error('Error setting up audio context:', error);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, stream, resizeCanvas]);

  // Listen for window resize events
  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    
    // Initial resize
    resizeCanvas();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Draw the visualization
  const visualize = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !canvas) return;
      
      animationRef.current = requestAnimationFrame(draw);
      
      // Get the audio data
      analyser.getByteFrequencyData(dataArray);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set up the visualization style
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      // Draw the visualization
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Use gradient for the bars
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#4ade80'); // Green at top
        gradient.addColorStop(1, '#3b82f6'); // Blue at bottom
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };

    draw();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="audio-visualizer mt-2 h-16 rounded-lg overflow-hidden bg-base-300 shadow-inner"
    >
      {isListening ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-base-content/50">
          <p>Start listening to see audio visualization</p>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;