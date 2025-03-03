// backend/src/services/speechFeedbackService.ts
import dotenv from 'dotenv';
import { FeedbackMode } from './confirmationService';

// Load environment variables
dotenv.config();

export interface SpeechFeedback {
  text: string; // Text to be spoken
  type: 'confirmation' | 'error' | 'success' | 'info'; // Type of feedback
}

/**
 * SpeechFeedbackService manages audio feedback to the user
 * Handles text-to-speech for confirmations and notifications
 */
class SpeechFeedbackService {
  private enabled: boolean = true;
  private volume: number = 0.8;
  
  /**
   * Generate spoken feedback for a command
   * @param action - Command action (add, remove, set)
   * @param quantity - Quantity value
   * @param unit - Unit of measurement
   * @param item - Item name
   * @param feedbackMode - Level of detail for feedback
   * @returns Speech feedback object
   */
  generateCommandFeedback(
    action: string,
    quantity: number,
    unit: string,
    item: string,
    feedbackMode: FeedbackMode
  ): SpeechFeedback | null {
    // If feedback is disabled or set to silent, return null
    if (!this.enabled || feedbackMode === FeedbackMode.SILENT) {
      return null;
    }
    
    // Base confirmation text
    let text = '';
    
    // Format based on feedback detail level
    if (feedbackMode === FeedbackMode.DETAILED) {
      text = `I'll ${action} ${quantity} ${unit} of ${item}. Is that correct?`;
    } else {
      // Brief format
      text = `${action} ${quantity} ${unit} of ${item}?`;
    }
    
    return {
      text,
      type: 'confirmation'
    };
  }
  
  /**
   * Generate spoken feedback for a successful command
   * @param action - Command action (add, remove, set)
   * @param quantity - Quantity value
   * @param unit - Unit of measurement
   * @param item - Item name
   * @returns Speech feedback object
   */
  generateSuccessFeedback(
    action: string,
    quantity: number,
    unit: string,
    item: string
  ): SpeechFeedback | null {
    if (!this.enabled) {
      return null;
    }
    
    // Format success message
    const text = `${action}ed ${quantity} ${unit} of ${item}`;
    
    return {
      text,
      type: 'success'
    };
  }
  
  /**
   * Generate spoken feedback for an error
   * @param errorMessage - Error message
   * @returns Speech feedback object
   */
  generateErrorFeedback(errorMessage: string): SpeechFeedback | null {
    if (!this.enabled) {
      return null;
    }
    
    return {
      text: `Error: ${errorMessage}`,
      type: 'error'
    };
  }
  
  /**
   * Generate spoken feedback for a correction suggestion
   * @param suggestion - The suggested correction
   * @returns Speech feedback object
   */
  generateCorrectionFeedback(suggestion: string): SpeechFeedback | null {
    if (!this.enabled) {
      return null;
    }
    
    return {
      text: suggestion,
      type: 'info'
    };
  }
  
  /**
   * Toggle speech feedback on or off
   * @param enabled - Whether speech feedback should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Set the volume for speech feedback
   * @param volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

export default new SpeechFeedbackService();