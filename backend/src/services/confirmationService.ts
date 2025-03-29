/**
 * Confirmation Service
 * Implements the adaptive confirmation strategy for inventory updates
 * Determines when to use implicit vs explicit confirmation
 */

// backend/src/services/confirmationService.ts
export enum ConfirmationType {
  IMPLICIT = 'implicit',   // No explicit confirmation needed
  VOICE = 'voice',         // Voice confirmation required (with spoken response)
  VISUAL = 'visual',       // Visual confirmation required (with timeout)
  EXPLICIT = 'explicit',   // Explicit confirmation required (with detailed info)
}

export enum FeedbackMode {
  SILENT = 'silent',       // No audio feedback
  BRIEF = 'brief',         // Brief audio confirmation
  DETAILED = 'detailed',   // Detailed audio feedback with all command details
}

export interface ConfirmationResult {
  type: ConfirmationType;
  confidence: number;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high';
  feedbackMode: FeedbackMode;
  timeoutSeconds?: number; // Optional timeout for auto-confirmation
  suggestedCorrection?: string; // Optional suggested correction for common mistakes
}

export interface ConfirmationRequest {
  // NLP confidence in the command
  confidence: number;
  
  // Command details
  action: 'add' | 'remove' | 'set' | 'unknown';
  item: string;
  quantity: number | string;
  unit: string;
  
  // Item context (if available)
  currentQuantity?: number;  // Current quantity in inventory
  threshold?: number;        // Alert threshold for this item
  similarItems?: string[];   // Similar items that might be confused
  
  // User context
  userRole?: string;         // User's role in the system
  previousConfirmations?: {  // History of user's confirmations
    correct: number;         // Number of correct confirmations
    total: number;           // Total confirmations
    recentMistakes?: string[]; // Recent mistakes by category
  };
  
  // Command context
  isAmbiguous?: boolean;     // Flag for ambiguous items or quantities
  isLargeQuantity?: boolean; // Flag for unusually large quantities
  sessionItems?: string[];   // Items processed in current session 
}

class ConfirmationService {
  /**
   * Determine appropriate confirmation type and feedback mode
   * @param request - The confirmation request with command and context
   * @returns The confirmation type, reasoning, and feedback options
   */
  determineConfirmationType(request: ConfirmationRequest): ConfirmationResult {
    // Start with confidence level from NLP
    const { confidence, action, quantity, currentQuantity, threshold, userRole, similarItems } = request;
    
    let confirmationType = ConfirmationType.IMPLICIT;
    let reason = '';
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let feedbackMode = FeedbackMode.BRIEF;
    let timeoutSeconds: number | undefined = undefined;
    let suggestedCorrection: string | undefined = undefined;
    
    // 1. NLP confidence assessment (fundamental factor)
    if (confidence < 0.7) {
      if (confidence < 0.5) {
        confirmationType = ConfirmationType.EXPLICIT;
        riskLevel = 'high';
        feedbackMode = FeedbackMode.DETAILED;
      } else {
        confirmationType = ConfirmationType.VISUAL;
        riskLevel = 'medium';
        feedbackMode = FeedbackMode.BRIEF;
        timeoutSeconds = 10; // Medium timeout for medium confidence
      }
      reason = 'Low confidence in voice recognition';
    }
    
    // 2. Check for potential confusion with similar items
    if (similarItems && similarItems.length > 0) {
      const isConfusable = similarItems.some(item => 
        this.calculateSimilarity(request.item, item) > 0.7
      );
      
      if (isConfusable) {
        confirmationType = confirmationType === ConfirmationType.IMPLICIT ? ConfirmationType.VOICE : confirmationType;
        riskLevel = Math.max(this.riskLevelToNumber(riskLevel), 1) === 2 ? 'high' : 'medium';
        reason = reason || 'Similar items might be confused';
        suggestedCorrection = `Did you mean ${similarItems[0]}?`;
      }
    }
    
    // 3. Check for ambiguity in the command
    if (request.isAmbiguous) {
      confirmationType = confirmationType === ConfirmationType.IMPLICIT ? ConfirmationType.VISUAL : confirmationType;
      reason = reason || 'Ambiguous command';
      riskLevel = 'medium';
      timeoutSeconds = 15; // Longer timeout for ambiguous commands
    }
    
    // 4. Check if it's a large quantity change
    if (request.isLargeQuantity || 
        (action !== 'unknown' && 
         this.isLargeQuantityChange(action as 'add' | 'remove' | 'set', 
                                    typeof quantity === 'number' ? quantity : 0, 
                                    currentQuantity))) {
      confirmationType = ConfirmationType.EXPLICIT;
      reason = reason || 'Large quantity change';
      riskLevel = 'high';
      feedbackMode = FeedbackMode.DETAILED;
      timeoutSeconds = undefined; // No timeout for high-risk actions
    }
    
    // 5. Check if removing would drop below threshold
    if (action === 'remove' && 
        currentQuantity !== undefined && 
        threshold !== undefined &&
        (currentQuantity - (typeof quantity === 'number' ? quantity : 0)) < threshold) {
      confirmationType = ConfirmationType.EXPLICIT;
      reason = reason || 'Stock would drop below threshold';
      riskLevel = 'medium';
      feedbackMode = FeedbackMode.DETAILED;
    }
    
    // 6. Check if setting to a very different value
    if (action === 'set' && 
        currentQuantity !== undefined && 
        typeof quantity === 'number' &&
        Math.abs(quantity - currentQuantity) > (currentQuantity * 0.5)) {
      confirmationType = ConfirmationType.VISUAL;
      reason = reason || 'Setting to a significantly different quantity';
      riskLevel = 'medium';
      feedbackMode = FeedbackMode.BRIEF;
      timeoutSeconds = 8;
    }
    
    // 7. Consider user role (read-only users can't make changes)
    if (userRole === 'readonly') {
      confirmationType = ConfirmationType.EXPLICIT;
      reason = reason || 'Read-only users cannot modify inventory';
      riskLevel = 'high';
      feedbackMode = FeedbackMode.DETAILED;
    }
    
    // 8. Consider user history for personalized confirmation
    if (request.previousConfirmations) {
      const { correct, total, recentMistakes } = request.previousConfirmations;
      
      // Calculate error rate if we have enough data
      if (total > 5) {
        const errorRate = 1 - (correct / total);
        
        // Adjust based on user's historical accuracy
        if (errorRate > 0.3) {
          confirmationType = Math.max(this.confirmationTypeToNumber(confirmationType), 2) >= 3 
            ? ConfirmationType.EXPLICIT 
            : ConfirmationType.VISUAL;
          reason = reason || 'User has a history of confirmation errors';
          riskLevel = 'medium';
          
          // Check for patterns in recent mistakes
          if (recentMistakes && recentMistakes.length > 0) {
            if (recentMistakes.includes('quantity')) {
              suggestedCorrection = suggestedCorrection || `Did you mean a different quantity than ${quantity}?`;
            } else if (recentMistakes.includes('item')) {
              suggestedCorrection = suggestedCorrection || 'Please confirm the item name is correct';
            }
          }
        } else if (errorRate < 0.1 && action === 'add') {
          // Very accurate users can get more implicit confirmations for low-risk actions
          if (confirmationType === ConfirmationType.VISUAL && riskLevel === 'low') {
            confirmationType = ConfirmationType.IMPLICIT;
            feedbackMode = FeedbackMode.BRIEF;
          }
        }
      }
    }
    
    // 9. Consider session context for progressive disclosure
    if (request.sessionItems && request.sessionItems.length > 0) {
      // If this item was recently processed, we can be more confident
      const recentlyProcessed = request.sessionItems.includes(request.item);
      
      if (recentlyProcessed && confirmationType === ConfirmationType.VISUAL && riskLevel === 'low') {
        confirmationType = ConfirmationType.IMPLICIT;
        feedbackMode = FeedbackMode.BRIEF;
      }
    }
    
    // 10. Action-specific adjustments
    if (action === 'remove' && confirmationType === ConfirmationType.IMPLICIT) {
      // Always have at least voice confirmation for removals
      confirmationType = ConfirmationType.VOICE;
      feedbackMode = FeedbackMode.BRIEF;
      timeoutSeconds = 5;
    }
    
    // Finalize feedback mode based on risk level
    if (riskLevel === 'high') {
      feedbackMode = FeedbackMode.DETAILED;
    } else if (confirmationType === ConfirmationType.IMPLICIT && riskLevel === 'low') {
      feedbackMode = FeedbackMode.SILENT;
    }
    
    // Return the comprehensive result
    return {
      type: confirmationType,
      confidence,
      reason: reason || 'Routine update',
      riskLevel,
      feedbackMode,
      timeoutSeconds,
      suggestedCorrection
    };
  }
  
  /**
   * Calculate similarity between two strings (for item name comparison)
   * Simple implementation of Levenshtein distance ratio
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const track = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    const distance = track[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    
    return maxLength > 0 ? 1 - distance / maxLength : 1;
  }
  
  /**
   * Convert risk level to numeric value for comparisons
   */
  private riskLevelToNumber(level: 'low' | 'medium' | 'high'): number {
    switch (level) {
      case 'low': return 0;
      case 'medium': return 1;
      case 'high': return 2;
      default: return 0;
    }
  }
  
  /**
   * Convert confirmation type to numeric value for comparisons
   */
  private confirmationTypeToNumber(type: ConfirmationType): number {
    switch (type) {
      case ConfirmationType.IMPLICIT: return 0;
      case ConfirmationType.VOICE: return 1;
      case ConfirmationType.VISUAL: return 2;
      case ConfirmationType.EXPLICIT: return 3;
      default: return 0;
    }
  }
  
  /**
   * Determine if a quantity change is considered "large"
   */
  private isLargeQuantityChange(
    action: 'add' | 'remove' | 'set',
    quantity: number,
    currentQuantity?: number
  ): boolean {
    // If we don't know the current quantity, we can't determine if it's a large change
    if (currentQuantity === undefined) {
      // For safety, consider it large if it's above certain thresholds based on action
      return (action === 'add' && quantity > 100) || 
             (action === 'remove' && quantity > 50) || 
             (action === 'set' && quantity > 200);
    }
    
    // Calculate percentage change
    const percentChange = 
      action === 'set' 
        ? Math.abs(quantity - currentQuantity) / currentQuantity 
        : Math.abs(quantity) / currentQuantity;
    
    // Different thresholds based on action
    switch (action) {
      case 'add':
        return percentChange > 0.5; // Adding more than 50% of current quantity
      case 'remove':
        return percentChange > 0.3; // Removing more than 30% of current quantity
      case 'set':
        return percentChange > 0.5; // Setting to a value that differs by more than 50%
      default:
        return false;
    }
  }
  
  /**
   * Record user confirmation result for improving future decisions
   * @param userId - The user ID
   * @param wasCorrect - Whether the confirmation was correct
   * @param details - Optional details about the confirmation
   */
  recordConfirmationResult(
    userId: string, 
    wasCorrect: boolean,
    details?: {
      originalCommand: {
        action: string;
        item: string;
        quantity: number;
        unit: string;
      };
      correctedCommand?: {
        action?: string;
        item?: string;
        quantity?: number;
        unit?: string;
      };
      mistakeType?: 'item' | 'quantity' | 'action' | 'unit' | 'multiple';
    }
  ): void {
    // In a real implementation, this would update a database record
    console.log(`User ${userId} confirmation result recorded: ${wasCorrect ? 'correct' : 'incorrect'}`);
    
    if (!wasCorrect && details) {
      // Log detailed information about the mistake
      console.log('Mistake details:', details);
      
      // In a real implementation, we would:
      // 1. Update the user's confirmation history in the database
      // 2. Track specific mistake patterns to improve the user's experience
      // 3. Use this data to adjust confirmation thresholds
      
      // Analyze the mistake to provide better suggestions in the future
      if (details.mistakeType && details.correctedCommand) {
        console.log(`Mistake type: ${details.mistakeType}`);
        
        if (details.mistakeType === 'item' && details.correctedCommand.item) {
          // Update similarity dictionary for this user
          // e.g., store that "coffee beans" might be confused with "coffee filters"
          console.log(`Item confusion: ${details.originalCommand.item} was confused with ${details.correctedCommand.item}`);
          
          // In a real implementation, we could:
          // this.updateUserItemConfusions(userId, details.originalCommand.item, details.correctedCommand.item);
        }
        
        if (details.mistakeType === 'quantity' && details.correctedCommand.quantity !== undefined) {
          // Track quantity error patterns (e.g., consistently saying numbers incorrectly)
          console.log(`Quantity error: ${details.originalCommand.quantity} should have been ${details.correctedCommand.quantity}`);
          
          // Check for patterns like consistently being off by a factor
          const factor = details.correctedCommand.quantity / details.originalCommand.quantity;
          if (factor === 10 || factor === 0.1) {
            console.log('User might have an order of magnitude confusion pattern');
          }
        }
      }
    }
    
    // Update confirmation strength for next time based on historical performance
    // In a real implementation, this would:
    // 1. Retrieve the user's current stats
    // 2. Update with this new data point
    // 3. Save back to database
  }
  
  /**
   * Process a voice correction from the user
   * @param originalCommand - The original command that needed correction
   * @param correctionText - The user's spoken correction
   * @returns The corrected command if recognized, or null if unable to process
   */
  processVoiceCorrection(
    originalCommand: {
      action: string;
      item: string;
      quantity: number;
      unit: string;
    },
    correctionText: string
  ): {
    action: string;
    item: string;
    quantity: number;
    unit: string;
    mistakeType: 'item' | 'quantity' | 'action' | 'unit' | 'multiple';
  } | null {
    const correctionTextLower = correctionText.toLowerCase().trim();
    
    // Check for simple yes/no responses
    if (/^(yes|yeah|correct|right|that's right|sounds good|fine|okay|ok|yep|yup)$/i.test(correctionTextLower)) {
      // User confirmed, no changes needed
      return { ...originalCommand, mistakeType: 'multiple' };
    }
    
    if (/^(no|nope|incorrect|wrong|that's wrong|not right)$/i.test(correctionTextLower)) {
      // Simple rejection without details, can't create corrected command
      return null;
    }
    
    // Check for quantity corrections
    const quantityMatch = correctionTextLower.match(/\b(?:no,?\s+)?(?:it'?s|it\s+should\s+be|make\s+it|should\s+be|i\s+meant|i\s+said|actually)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
    
    if (quantityMatch) {
      // User is correcting the quantity
      let correctedQuantity: number;
      
      if (/^\d+$/.test(quantityMatch[1])) {
        correctedQuantity = parseInt(quantityMatch[1], 10);
      } else {
        // Convert word to number
        const wordToNumber: Record<string, number> = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        };
        correctedQuantity = wordToNumber[quantityMatch[1]] || originalCommand.quantity;
      }
      
      return {
        ...originalCommand,
        quantity: correctedQuantity,
        mistakeType: 'quantity'
      };
    }
    
    // Check for item corrections
    const itemPhrasePatterns = [
      /not\s+(.+?)\b,?\s+(?:but|it'?s|i\s+meant|should\s+be)\s+(.+?)(?:\s|$|\.)/i, // "not coffee, but tea"
      /(?:it'?s|i\s+meant|the\s+item\s+is|should\s+be)\s+(.+?)(?:\s|$|\.)/i, // "it's tea" or "I meant tea"
      /(?:the\s+)(.+?)(?:\s+not\s+)(?:the\s+)(.+)/i, // "the tea not the coffee"
    ];
    
    for (const pattern of itemPhrasePatterns) {
      const itemMatch = correctionTextLower.match(pattern);
      if (itemMatch) {
        const newItem = itemMatch[2] || itemMatch[1];
        if (newItem && newItem.length > 1) { // Ensure we have a valid item name
          return {
            ...originalCommand,
            item: newItem.trim(),
            mistakeType: 'item'
          };
        }
      }
    }
    
    // Check for action corrections (add vs. remove vs. set)
    if (/(not|don't)\s+(add|remove|set)/i.test(correctionTextLower)) {
      let newAction = originalCommand.action;
      
      if (/add/i.test(correctionTextLower) && originalCommand.action !== 'add') {
        newAction = 'add';
      } else if (/remove/i.test(correctionTextLower) && originalCommand.action !== 'remove') {
        newAction = 'remove';
      } else if (/set/i.test(correctionTextLower) && originalCommand.action !== 'set') {
        newAction = 'set';
      }
      
      if (newAction !== originalCommand.action) {
        return {
          ...originalCommand,
          action: newAction,
          mistakeType: 'action'
        };
      }
    }
    
    // Check for unit corrections
    const unitMatch = correctionTextLower.match(/\bnot\s+(.+?),?\s+(?:but|it'?s|i\s+meant)\s+(.+?)(?:\s|$|\.)/i);
    if (unitMatch && ['pounds', 'boxes', 'gallons', 'bottles', 'cans', 'bags', 'units'].some(unit => 
      unitMatch[1].includes(unit) || unitMatch[2].includes(unit))) {
      
      // Determine which part has the unit
      let newUnit = '';
      for (const unitWord of ['pounds', 'boxes', 'gallons', 'bottles', 'cans', 'bags', 'units']) {
        if (unitMatch[2].includes(unitWord)) {
          newUnit = unitWord;
          break;
        }
      }
      
      if (newUnit) {
        return {
          ...originalCommand,
          unit: newUnit,
          mistakeType: 'unit'
        };
      }
    }
    
    // If we couldn't parse a specific correction, treat it as a complete command replacement
    // In a real implementation, this would call into the NLP service to parse the new command
    // For now, just return null to indicate failure
    return null;
  }
}

export default new ConfirmationService();