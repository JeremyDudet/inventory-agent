import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  /** Web Audio API AnalyserNode providing audio data */
  analyser: AnalyserNode;
  /** Width of the canvas in pixels or percentage (default: "100%" for full parent width) */
  width?: number | string;
  /** Height of the canvas in pixels (default: 60px for a subtle profile) */
  height?: number;
  /** Stroke color of the waveform (default: a subtle light blue) */
  strokeColor?: string;
  /** Line width of the waveform stroke (default: 2px) */
  lineWidth?: number;
  /** Background color of the canvas (default: transparent) */
  backgroundColor?: string;
  /** Additional CSS class for the canvas element */
  className?: string;
}

/**
 * AudioVisualizer component renders a minimal, smooth waveform visualization of the audio input.
 * It draws a subtle animated wave on a canvas, reacting to real-time audio data from a provided AnalyserNode.
 */
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyser,
  width = '100%',
  height = 60,
  strokeColor = '#6cf',     // default to a subtle light-blue color
  lineWidth = 2,
  backgroundColor = 'transparent',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas dimensions based on provided width/height props
    function resizeCanvas() {
      if (!canvas) return;
      
      if (typeof width === 'number') {
        canvas.width = width;
      } else if (typeof width === 'string') {
        if (width.endsWith('%')) {
          // If width is a percentage, calculate it relative to parent element or window
          const percent = parseFloat(width);
          const parentWidth = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
          canvas.width = isNaN(percent) ? parentWidth : (parentWidth * percent) / 100;
        } else {
          // If width is a CSS length (e.g., "500px"), parse the number portion
          const numeric = parseInt(width, 10);
          canvas.width = isNaN(numeric) ? canvas.width : numeric;
        }
      } else {
        // Default: full parent width or window width
        canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      }
      // Set canvas height
      canvas.height = height;
    }

    // Initial canvas size setup and event listener for future resizes
    resizeCanvas();
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);

    // Prepare data array for waveform (time-domain) data
    const bufferLength = analyser.fftSize;  // FFT size determines the length of time-domain data array
    const dataArray = new Uint8Array(bufferLength);

    // Animation loop to draw the waveform
    let animationId: number;
    const drawWaveform = () => {
      // Get current waveform data
      analyser.getByteTimeDomainData(dataArray);

      // Clear the canvas for fresh drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (backgroundColor && backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Set styles for the waveform line
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();

      const widthFactor = canvas.width / bufferLength;
      const centerY = canvas.height / 2;
      // Move to the first point
      const firstY = centerY + ((dataArray[0] - 128) / 128) * centerY;
      ctx.moveTo(0, firstY);

      // Draw line to each subsequent point
      for (let i = 1; i < bufferLength; i++) {
        const value = (dataArray[i] - 128) / 128;    // normalize audio data to [-1, 1]
        const x = i * widthFactor;
        const y = centerY + value * centerY;         // scale to canvas height (centered)
        ctx.lineTo(x, y);
      }

      // Stroke the path to render the waveform
      ctx.stroke();
      // Queue next frame
      animationId = requestAnimationFrame(drawWaveform);
    };

    // Start the animation loop
    animationId = requestAnimationFrame(drawWaveform);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [analyser, width, height, strokeColor, lineWidth, backgroundColor]);

  // The canvas fills its container's width (if width is percentage) and uses the given height
  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ 
        width: typeof width === 'string' ? width : `${width}px`, 
        height: `${height}px`,
        display: 'block' 
      }} 
    />
  );
};

export default AudioVisualizer;
