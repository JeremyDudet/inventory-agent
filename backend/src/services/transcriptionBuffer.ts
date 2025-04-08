// backend/src/services/transcriptionBuffer.ts
import { NlpService } from "./nlpService";
import { EventEmitter } from "events";
import { SessionStateService } from "./sessionStateService";

/**
 * Service to buffer transcriptions until a complete command is detected
 */
class TranscriptionBuffer extends EventEmitter {
  private buffer: string = "";
  private lastAddedTime: number = 0;
  private nlpService: NlpService;
  private sessionState: SessionStateService;
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly COMMAND_TIMEOUT = 6000; // 6 seconds to wait for continuation

  constructor(nlpService: NlpService, sessionState: SessionStateService) {
    super();
    this.nlpService = nlpService;
    this.sessionState = sessionState;
  }

  /**
   * Add a transcription to the buffer and process if complete
   * @param transcription - The transcription text to add
   */
  async addTranscription(transcription: string): Promise<void> {
    if (!transcription || !transcription.trim()) return;

    const trimmedTranscription = transcription.trim();
    const currentTime = Date.now();

    // Check for potential incomplete commands that are commonly split
    const isPotentialSetCommandStart =
      this.detectSetCommandStart(trimmedTranscription);
    const isLikelySetContinuation =
      this.detectSetCommandContinuation(trimmedTranscription);

    if (this.buffer) {
      // Add a space between existing buffer and new transcription
      this.buffer = `${this.buffer.trim()} ${trimmedTranscription}`;
    } else {
      this.buffer = trimmedTranscription;
    }

    this.lastAddedTime = currentTime;

    // Reset timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // If the buffer looks like a complete command or has specific ending patterns, process it
    if (this.isLikelyComplete()) {
      await this.processBuffer();
    } else {
      // Set a timeout to process the buffer if no new transcriptions arrive
      this.timeoutId = setTimeout(
        () => this.processBuffer(),
        this.COMMAND_TIMEOUT
      );
    }
  }

  /**
   * Process the current buffer through NLP and emit events
   */
  private async processBuffer(): Promise<void> {
    if (!this.buffer) return;

    const completeTranscription = this.buffer;
    console.log(
      `🔊 Processing complete transcription: "${completeTranscription}"`
    );

    // Clear buffer before processing to prevent double processing
    this.buffer = "";
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    try {
      // Retrieve the current conversation history from session state
      const conversationHistory =
        this.sessionState.getState().conversationHistory;
      const recentCommands = this.sessionState.getRecentCommands();
      
      const hasRelativeTerms = this.containsRelativeTerms(completeTranscription);
      
      // Process transcription with conversation history
      const nlpResults = await this.nlpService.processTranscription(
        completeTranscription,
        conversationHistory,
        recentCommands
      );

      // Emit results for handling in app.ts
      this.emit("completeCommand", nlpResults, completeTranscription);

      // If no complete commands were found, log for debugging
      if (!nlpResults.some((result) => result.isComplete)) {
        console.log(
          `🔊 No complete NLP results found for combined transcription: "${completeTranscription}"`
        );
      }
    } catch (error) {
      console.error("Error processing complete transcription:", error);
      this.emit("error", error);
    }
  }
  
  /**
   * Check if the transcription contains terms that indicate a relative command
   * @param transcription - The transcription to check
   * @returns Whether the transcription contains relative terms
   */
  private containsRelativeTerms(transcription: string): boolean {
    const lowerText = transcription.toLowerCase();
    const relativeTerms = [
      'more', 'another', 'additional', 'extra', 'same', 
      'again', 'also', 'too', 'as well', 'like before'
    ];
    
    return relativeTerms.some(term => lowerText.includes(term));
  }

  /**
   * Check if the current buffer is likely a complete command
   * @returns Whether the buffer is likely complete
   */
  private isLikelyComplete(): boolean {
    const lowerBuffer = this.buffer.toLowerCase();

    // Heuristics to detect complete commands
    return (
      // Ends with period or question mark
      /[.?]$/.test(lowerBuffer) ||
      // Contains complete inventory action phrases
      /\b(add|remove|set)\b.*\b(of|to)\b.*\d+/.test(lowerBuffer) ||
      /\bwe\s+have\b.*\d+/.test(lowerBuffer) ||
      // Has a significant length (likely a full statement)
      this.buffer.length > 30 ||
      // Contains "undo" command
      /\bundo\b|\brevert\s+last\b/.test(lowerBuffer)
    );
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
    this.buffer = "";
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
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
      (lowerText.startsWith("set ") ||
        lowerText.startsWith("update ") ||
        lowerText.startsWith("we have ")) &&
      !lowerText.includes(" to ") && // No "to" phrase - incomplete
      !/\bto\s+\d+\b/.test(lowerText) // No "to X" with a number
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
      lowerText.startsWith("to ") ||
      /^\d+\s+\w+\.?$/.test(lowerText) || // e.g. "30 sleeves"
      /^to\s+\d+\s+\w+\.?$/.test(lowerText) || // e.g. "to 30 sleeves"
      /^of\s+\w+\.?$/.test(lowerText) // e.g. "of milk"
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
