import { NlpService } from './nlpService';

/**
 * Service to buffer transcriptions until a complete command is detected
 */
class TranscriptionBuffer {
  private buffer: string = '';
  private lastAddedTime: number = 0;
  private nlpService: NlpService;

  constructor(nlpService: NlpService) {
    this.nlpService = nlpService;
  }

  /**
   * Add a transcription to the buffer
   * @param transcription - The transcription text to add
   */
  addTranscription(transcription: string): void {
    if (!transcription || !transcription.trim()) return;
    
    const trimmedTranscription = transcription.trim();
    const currentTime = Date.now();
    
    // Check for potential incomplete commands that are commonly split
    const isPotentialSetCommandStart = this.detectSetCommandStart(trimmedTranscription);
    const isLikelySetContinuation = this.detectSetCommandContinuation(trimmedTranscription);
    
    if (this.buffer) {
      // Add a space between existing buffer and new transcription
      this.buffer = `${this.buffer.trim()} ${trimmedTranscription}`;
    } else {
      this.buffer = trimmedTranscription;
    }
    
    this.lastAddedTime = currentTime;
  }

  /**
   * Get the current buffer content
   * @returns The current transcription buffer
   */
  getCurrentBuffer(): string {
    return this.buffer;
  }

  /**
   * Clear the transcription buffer
   */
  clearBuffer(): void {
    this.buffer = '';
  }
  
  /**
   * Check if a transcription is likely the start of a set command
   * @param transcription - The transcription to check
   * @returns Whether this looks like a set command start
   */
  private detectSetCommandStart(transcription: string): boolean {
    const lowerText = transcription.toLowerCase().trim();
    // Detect phrases like "set the X" or "set X to" without a value
    return (
      (lowerText.startsWith('set ') || lowerText.startsWith('update ')) &&
      !lowerText.includes(' to ') && // No "to" phrase - incomplete
      !(/\bto\s+\d+\b/.test(lowerText)) // No "to X" with a number
    );
  }
  
  /**
   * Check if a transcription is likely a continuation of a set command
   * @param transcription - The transcription to check
   * @returns Whether this looks like a set command continuation
   */
  private detectSetCommandContinuation(transcription: string): boolean {
    const lowerText = transcription.toLowerCase().trim();
    // Continuations often start with "to X" or are just number+unit
    return (
      lowerText.startsWith('to ') ||
      /^\d+\s+\w+\.?$/.test(lowerText) || // e.g. "30 sleeves"
      /^to\s+\d+\s+\w+\.?$/.test(lowerText) // e.g. "to 30 sleeves"
    );
  }
  
  /**
   * Get time since last transcription was added
   * @returns Time in milliseconds since last addition
   */
  getTimeSinceLastAddition(): number {
    if (this.lastAddedTime === 0) return 0;
    return Date.now() - this.lastAddedTime;
  }
}

export default TranscriptionBuffer; 