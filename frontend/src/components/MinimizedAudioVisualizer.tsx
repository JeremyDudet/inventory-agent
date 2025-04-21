import React, { useRef, useEffect, useCallback } from "react";

interface MinimizedAudioVisualizerProps {
  isListening: boolean;
  stream?: MediaStream | null;
}

/**
 * MinimizedAudioVisualizer component optimized for smaller containers
 * Displays a simpler visualization with shorter bars and reduced complexity
 */
const MinimizedAudioVisualizer: React.FC<MinimizedAudioVisualizerProps> = ({
  isListening,
  stream,
}) => {
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

      // Use a smaller FFT size for a simpler visualization
      analyserRef.current.fftSize = 128; // Smaller than the default

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Make sure canvas is properly sized before visualizing
      resizeCanvas();

      // Start the visualization
      visualize();
    } catch (error) {
      console.error("Error setting up audio context:", error);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, stream, resizeCanvas]);

  // Listen for window resize events
  useEffect(() => {
    window.addEventListener("resize", resizeCanvas);

    // Initial resize
    resizeCanvas();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
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
    const ctx = canvas.getContext("2d");

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

      // Set up the visualization style - wider bars for smaller container
      const barCount = 16; // Use fewer bars
      const barWidth = Math.max(2, Math.floor(canvas.width / barCount) - 1);
      const dataStep = Math.floor(bufferLength / barCount);
      let x = 0;

      // Draw the visualization with reduced height
      for (let i = 0; i < barCount; i++) {
        // Get average volume for this segment
        let sum = 0;
        for (let j = 0; j < dataStep; j++) {
          const dataIndex = i * dataStep + j;
          if (dataIndex < bufferLength) {
            sum += dataArray[dataIndex];
          }
        }
        const average = sum / dataStep;

        // Scale the bar height to fit the smaller container
        // Use a minimum height for visual appeal even in quiet moments
        const minHeight = canvas.height * 0.1;
        const barHeight = Math.max(
          minHeight,
          (average / 255) * canvas.height * 0.9
        );

        // Use gradient for the bars
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#4ade80"); // Green at top
        gradient.addColorStop(1, "#3b82f6"); // Blue at bottom

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
      className="minimized-audio-visualizer w-full h-full rounded overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default MinimizedAudioVisualizer;
