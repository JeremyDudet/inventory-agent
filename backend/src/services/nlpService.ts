// backend/src/services/nlpService.ts
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// OpenAI API key for more advanced NLP processing
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const useOpenAI = openaiApiKey !== '';

/**
 * NLP service for processing transcriptions and extracting inventory commands
 */
class NlpService {
  // Cache to store previous command context
  private previousCommand: {
    action: string;
    item: string;
    quantity: number | string;
    unit: string;
    timestamp: number;
  } | null = null;
  
  // Time window for considering previous commands as context (5 seconds)
  private contextWindowMs = 5000;

  /**
   * Process a transcription and extract inventory command
   * @param transcription - The transcription to process
   * @returns Extracted inventory command
   */
  async processTranscription(transcription: string): Promise<{
    action: string;
    item: string;
    quantity: number | string;
    unit: string;
    confidence: number;
    isComplete: boolean;
  }> {
    const startTime = Date.now();
    console.log(`🧠 [NLP] Processing transcription: "${transcription}"`);
    
    try {
      let result;
      
      // If OpenAI API key is available, use it for more advanced processing
      if (useOpenAI) {
        console.log('🧠 [NLP] Using OpenAI API for NLP processing');
        result = await this.processWithOpenAI(transcription);
      } else {
        // Otherwise, use the rule-based approach
        console.log('🧠 [NLP] Using rule-based processing (OpenAI API not configured)');
        result = await this.processWithRules(transcription);
      }
      
      // Merge with previous command context if applicable
      result = this.mergeWithPreviousContext(result);
      
      // Calculate processing time
      const processTime = Date.now() - startTime;
      
      // Log detailed results
      console.log(`🧠 [NLP] Processing complete in ${processTime}ms`);
      console.log(`🧠 [NLP] Extracted action: "${result.action}"`);
      console.log(`🧠 [NLP] Extracted item: "${result.item}"`);
      console.log(`🧠 [NLP] Extracted quantity: ${result.quantity}`);
      console.log(`🧠 [NLP] Extracted unit: "${result.unit}"`);
      console.log(`🧠 [NLP] Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`🧠 [NLP] Command complete: ${result.isComplete}`);
      
      // Update context if command is not complete
      if (!result.isComplete) {
        this.updateCommandContext(result);
      } else {
        // Clear context if command is complete
        this.previousCommand = null;
      }
      
      return result;
    } catch (error) {
      console.error('🧠 [NLP] ❌ Error processing transcription:', error);
      console.trace('🧠 [NLP] Error stack trace:');
      
      // Return basic unknown result instead of crashing
      return {
        action: 'unknown',
        item: 'unknown',
        quantity: 'unknown',
        unit: 'units',
        confidence: 0.3,
        isComplete: false
      };
    }
  }

  /**
   * Update the command context with the current result
   */
  private updateCommandContext(result: {
    action: string;
    item: string;
    quantity: number | string;
    unit: string;
    confidence: number;
    isComplete: boolean;
  }): void {
    // Only store meaningful parts of the command
    this.previousCommand = {
      action: result.action !== 'unknown' ? result.action : '',
      item: result.item !== 'unknown' ? result.item : '',
      quantity: result.quantity !== 'unknown' ? result.quantity : '',
      unit: result.unit !== 'unknown' ? result.unit : '',
      timestamp: Date.now()
    };
    
    console.log(`🧠 [NLP] Updated command context: ${JSON.stringify(this.previousCommand)}`);
  }

  /**
   * Merge current result with previous context if applicable
   */
  private mergeWithPreviousContext(result: {
    action: string;
    item: string;
    quantity: number | string;
    unit: string;
    confidence: number;
    isComplete: boolean;
  }): {
    action: string;
    item: string;
    quantity: number | string;
    unit: string;
    confidence: number;
    isComplete: boolean;
  } {
    // If no previous context or previous context is too old, just return current result
    if (!this.previousCommand || 
        Date.now() - this.previousCommand.timestamp > this.contextWindowMs) {
      return result;
    }
    
    console.log(`🧠 [NLP] Merging with previous context: ${JSON.stringify(this.previousCommand)}`);
    
    // Special case for handling "set X to Y" pattern across multiple segments
    if (this.previousCommand.action === 'set' && 
        result.action === 'unknown' && 
        /\bto\b/i.test(String(result.item))) {
      console.log('🧠 [NLP] Detected potential "set X to Y" pattern across segments');
      
      // Example: Previous="set coffee" Current="to 5 pounds"
      const toPattern = /\bto\b\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)/i;
      const match = String(result.item).match(toPattern);
      
      if (match) {
        const [, quantityStr, unitAndRemainder] = match;
        const quantity = /^\d+$/.test(quantityStr) ? 
          parseInt(quantityStr, 10) : 
          this.wordToNumber(quantityStr);
          
        // Try to extract unit from the remainder
        const { unit } = this.extractItemAndUnit(unitAndRemainder);
        
        return {
          action: 'set',
          item: this.previousCommand.item || result.item,
          quantity,
          unit,
          confidence: Math.max(0.6, result.confidence),
          isComplete: true
        };
      }
    }
    
    // Special case for handling numeric-only segments (e.g., "50 gallons")
    // This handles the case where the second segment is just a quantity and unit
    if (this.previousCommand.action && 
        (result.action === 'unknown' || result.action === this.previousCommand.action) &&
        (typeof result.quantity === 'number' && result.quantity > 0) &&
        (result.item === 'unknown' || !result.item || result.item === String(result.quantity))) {
      console.log('🧠 [NLP] Detected quantity-only segment, merging with previous context');
      
      return {
        action: this.previousCommand.action,
        item: this.previousCommand.item || 'unknown',
        quantity: result.quantity,
        unit: result.unit !== 'unknown' ? result.unit : this.previousCommand.unit || 'unknown',
        confidence: result.confidence,
        isComplete: false  // Mark as incomplete to allow for more context
      };
    }
    
    // Special case for "remove X quantity" pattern - when quantity comes second
    if (this.previousCommand.action === 'remove' && 
        (typeof result.quantity === 'number' && result.quantity > 0) &&
        (result.unit !== 'unknown')) {
      console.log('🧠 [NLP] Detected quantity segment for remove command');
      
      return {
        action: 'remove',
        item: this.previousCommand.item || result.item,
        quantity: result.quantity,
        unit: result.unit,
        confidence: Math.max(0.6, result.confidence),
        isComplete: false  // Still need the item
      };
    }
    
    // Special case for handling the third part where item comes after quantity
    // e.g., first="remove", second="50 gallons", third="to whole milk" or just "whole milk"
    if (this.previousCommand.action &&
        typeof this.previousCommand.quantity === 'number' && 
        this.previousCommand.quantity > 0 &&
        result.item !== 'unknown' && 
        result.item) {
      console.log('🧠 [NLP] Detected item segment after quantity, completing command');
      
      // Extract actual item name from potential "to X" pattern
      let finalItem = result.item;
      if (typeof finalItem === 'string' && finalItem.startsWith('to ')) {
        finalItem = finalItem.substring(3).trim();
      }
      
      return {
        action: this.previousCommand.action,
        item: finalItem,
        quantity: this.previousCommand.quantity,
        unit: this.previousCommand.unit || result.unit,
        confidence: Math.max(0.7, result.confidence),
        isComplete: true
      };
    }
    
    // Merge non-unknown values, prioritizing current result for conflicts
    return {
      action: result.action !== 'unknown' ? result.action : this.previousCommand.action || 'unknown',
      item: result.item !== 'unknown' ? result.item : this.previousCommand.item || 'unknown',
      quantity: result.quantity !== 'unknown' ? result.quantity : this.previousCommand.quantity || 'unknown',
      unit: result.unit !== 'unknown' ? result.unit : this.previousCommand.unit || 'unknown',
      confidence: result.confidence,
      isComplete: result.isComplete || this.isCommandComplete(
        result.action !== 'unknown' ? result.action : this.previousCommand.action || 'unknown',
        result.item !== 'unknown' ? result.item : this.previousCommand.item || 'unknown',
        result.quantity !== 'unknown' ? result.quantity : this.previousCommand.quantity || 'unknown',
        result.unit !== 'unknown' ? result.unit : this.previousCommand.unit || 'unknown'
      )
    };
  }

  /**
   * Process transcription using OpenAI API
   * @param transcription - The transcription to process
   * @returns Extracted inventory command
   */
  private async processWithOpenAI(transcription: string): Promise<{
    action: string;
    item: string;
    quantity: number | string;
    unit: string;
    confidence: number;
    isComplete: boolean;
  }> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an inventory management assistant. Extract the following information from the user's command:
              1. Action (add, remove, or set, or unknown)
              2. Item name (as a string or "unknown")
              3. Quantity (as a number or a string "unknown")
              4. Unit of measurement (as a string or "unknown")
              
              Respond with a JSON object with these fields: action, item, quantity, unit.
              
              IMPORTANT GUIDELINES:
              - If any field is missing or unclear, set the field to "unknown".
              - If no quantity is provided, set the quantity to a string "unknown".
              - If no unit is provided, set the unit to a string "unknown".
              - Be aware that commands may be partial or incomplete, especially if they contain phrases like "to X" without a preceding action.
              - Pay special attention to phrase patterns like "set X to Y" which indicate a SET action.
              - If you see phrases like "to 5 gallons" without an action, mark the action as "unknown" and include the quantity and unit.
              - For multi-part commands, extract as much context as possible from what's available.
              - For inputs that are purely numeric with units (e.g., "50 gallons"), extract the quantity and unit but set action and item to "unknown".
              - When you see phrases like "remove" followed later by quantities and items, they are likely part of the same command.`
            },
            {
              role: 'user',
              content: transcription
            }
          ],
          temperature: 0.2,
          max_tokens: 150,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          }
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      
      // Validate and normalize the result
      const action = result.action?.toLowerCase() || 'unknown';
      const item = result.item || 'unknown';
      const quantity = result.quantity === 'unknown' ? 'unknown' : parseInt(result.quantity, 10);
      const unit = result.unit || 'unknown';
      
      // Calculate confidence based on completeness
      let confidence = 0.8; // Base confidence
      if (!action || !item || !quantity || !unit) {
        confidence = 0.6; // Lower confidence if any field is missing
      }
      
      // Determine if the command is complete based on action type
      const isComplete = this.isCommandComplete(action, item, quantity, unit);
      
      return {
        action,
        item,
        quantity,
        unit,
        confidence,
        isComplete
      };
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      // Fall back to rule-based approach
      return this.processWithRules(transcription);
    }
  }

  /**
   * Process transcription using enhanced rule-based approach
   * @param transcription - The transcription to process
   * @returns Extracted inventory command
   */
  private async processWithRules(transcription: string): Promise<{
    action: string;
    item: string;
    quantity: number;
    unit: string;
    confidence: number;
    isComplete: boolean;
  }> {
    const lowerTranscription = transcription.toLowerCase().trim();
    
    if (!lowerTranscription) {
      return {
        action: 'unknown',
        item: 'unknown',
        quantity: 0,
        unit: 'unknown',
        confidence: 0.1, // Very low confidence for empty transcription
        isComplete: false
      };
    }
    
    // Check for the "to X" pattern which indicates partial set command
    const toPattern = /^\s*to\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)/i;
    const toMatch = lowerTranscription.match(toPattern);
    
    if (toMatch) {
      console.log('🧠 [NLP] Detected "to X" pattern, likely part of a SET command');
      const [, quantityStr, unitAndRemainder] = toMatch;
      
      // Convert word numbers to digits if needed
      const quantity = /^\d+$/.test(quantityStr) ? 
        parseInt(quantityStr, 10) : 
        this.wordToNumber(quantityStr);
      
      // Extract unit from remainder
      const { unit } = this.extractItemAndUnit(unitAndRemainder);
      
      return {
        action: 'unknown', // Let the context merging handle this
        item: `to ${quantity} ${unit}`, // Keep the original pattern for context merging
        quantity,
        unit,
        confidence: 0.7,
        isComplete: false // Mark as incomplete so it can be merged with previous context
      };
    }
    
    // Check for numeric-only patterns (e.g., "50 gallons")
    const numericPattern = /^\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)/i;
    const numericMatch = lowerTranscription.match(numericPattern);
    
    if (numericMatch) {
      console.log('🧠 [NLP] Detected numeric-only pattern, likely part of a multi-segment command');
      const [, quantityStr, unitAndRemainder] = numericMatch;
      
      // Convert word numbers to digits if needed
      const quantity = /^\d+$/.test(quantityStr) ? 
        parseInt(quantityStr, 10) : 
        this.wordToNumber(quantityStr);
      
      // Extract unit from remainder
      const { unit } = this.extractItemAndUnit(unitAndRemainder);
      
      return {
        action: 'unknown', // Let the context merging handle this
        item: 'unknown',   // No item specified in this segment
        quantity,
        unit,
        confidence: 0.7,
        isComplete: false  // Mark as incomplete so it can be merged with previous context
      };
    }
    
    // Define variations of actions for more flexible matching
    const actionVariants = {
      add: ['add', 'adding', 'increase', 'put', 'added', 'more', 'need', 'want', 'get', 'bring', 'buy', 'purchase', 'order', 'include', 'insert', 'stock', 'supply', 'refill', 'restock'],
      remove: ['remove', 'removing', 'decrease', 'take', 'taken', 'less', 'reduce', 'pull', 'delete', 'subtract', 'dispose', 'discard', 'trash', 'eliminate', 'drop', 'exclude', 'consume', 'use', 'used'],
      set: ['set', 'update', 'change', 'make', 'adjust', 'have', 'got', 'contains', 'should be', 'is now', 'are now', 'equals', 'replace', 'reset', 'register', 'record', 'log', 'count', 'mark', 'total']
    };
    
    // Determine action from variants
    let action = '';
    for (const [actionType, variants] of Object.entries(actionVariants)) {
      if (variants.some(variant => {
        // Look for whole word matches to avoid matching substrings
        return new RegExp(`\\b${variant}\\b`, 'i').test(lowerTranscription);
      })) {
        action = actionType;
        break;
      }
    }
    
    // Handle complete "set X to Y" pattern in a single command
    if (action === 'set' || lowerTranscription.includes(' to ')) {
      const setToPattern = /\b(?:set|update|change)?\s+(.+?)\s+to\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)/i;
      const match = lowerTranscription.match(setToPattern);
      
      if (match) {
        console.log('🧠 [NLP] Detected complete "set X to Y" pattern');
        const [, item, quantityStr, unitAndRemainder] = match;
        
        // Convert word numbers to digits if needed
        const quantity = /^\d+$/.test(quantityStr) ? 
          parseInt(quantityStr, 10) : 
          this.wordToNumber(quantityStr);
        
        // Extract unit from remainder
        const { unit } = this.extractItemAndUnit(unitAndRemainder);
        
        return {
          action: 'set',
          item: this.cleanUpItemName(item),
          quantity,
          unit,
          confidence: 0.9,
          isComplete: true
        };
      }
    }
    
    // Try to infer the action when it's not explicitly stated
    if (!action) {
      console.log('No explicit action detected, attempting to infer action...');
      
      // For querying type commands
      if (/\b(check|do we have|is there|how much|how many)\b/i.test(lowerTranscription)) {
        console.log('Detected query command');
        return {
          action: 'check',
          item: this.extractItemFromQuery(lowerTranscription),
          quantity: 0,
          unit: 'units',
          confidence: 0.7,
          isComplete: false
        };
      }
      
      // Look for quantities - if present, default to 'add'
      if (/\b\d+\b/i.test(lowerTranscription) || 
          /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(lowerTranscription)) {
        console.log('Quantity found in command, defaulting to "add"');
        action = 'add';
      } 
      // Look for common inventory items
      else if (this.containsCommonInventoryItem(lowerTranscription)) {
        console.log('Inventory item found in command, defaulting to "add"');
        action = 'add';
      }
      // Still no action
      else {
        console.log('Unable to determine action from: ' + lowerTranscription);
        // Try one more heuristic - if the text is short (likely just an item name), default to add
        if (lowerTranscription.split(' ').length <= 3) {
          action = 'add';
          console.log('Short command, defaulting to "add"');
        } else {
          // If no action can be determined after all attempts
          return {
            action: 'unknown',
            item: this.extractItemName(lowerTranscription),
            quantity: 0,
            unit: 'units', // Default to units instead of unknown
            confidence: 0.4,
            isComplete: false
          };
        }
      }
    }
    
    // Define TypeScript interfaces for our extracted data
    interface ExtractedDirectData {
      quantityStr: string;
      unit: string;
      item: string;
      itemWithUnit?: undefined;
    }
    
    interface ExtractedItemWithUnitData {
      quantityStr: string;
      itemWithUnit: string;
      unit?: undefined;
      item?: undefined;
    }
    
    type ExtractedData = ExtractedDirectData | ExtractedItemWithUnitData;
    
    // Define patterns from most specific to most general
    const patterns = [
      // "add/set/remove 5 pounds of coffee beans"
      {
        regex: /\b(add|remove|set|update|change)?\s+(\d+)\s+(\w+)\s+(?:of)\s+(.+)/i,
        confidence: 0.95,
        extract: (match: RegExpMatchArray): ExtractedDirectData => {
          const [, , quantityStr, unit, item] = match;
          return { quantityStr, unit, item };
        }
      },
      
      // "add/set/remove 5 coffee beans"
      {
        regex: /\b(add|remove|set|update|change)?\s+(\d+)\s+(.+)/i,
        confidence: 0.85,
        extract: (match: RegExpMatchArray): ExtractedItemWithUnitData => {
          const [, , quantityStr, itemWithUnit] = match;
          return { quantityStr, itemWithUnit };
        }
      },
      
      // More conversational: "we need to add 3 more boxes of napkins"
      {
        regex: /.*\b(add|remove|set|update|change)\b.*\b(\d+)\b.*\b(\w+)\b.*\b(?:of)\s+(.+)/i,
        confidence: 0.85,
        extract: (match: RegExpMatchArray): ExtractedDirectData => {
          const [, , quantityStr, unit, item] = match;
          return { quantityStr, unit, item };
        }
      },
      
      // More conversational without "of": "can you add 3 gallons almond milk"
      {
        regex: /.*\b(add|remove|set|update|change)\b.*\b(\d+)\b\s+(\w+)\s+([^.,]+)/i,
        confidence: 0.80,
        extract: (match: RegExpMatchArray): ExtractedDirectData => {
          const [, , quantityStr, unit, item] = match;
          return { quantityStr, unit, item: item.trim() };
        }
      },
      
      // Written numbers: "add five pounds of sugar"
      {
        regex: /\b(add|remove|set|update|change)?\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+(\w+)\s+(?:of)\s+(.+)/i,
        confidence: 0.85,
        extract: (match: RegExpMatchArray): ExtractedDirectData => {
          const [, , wordQuantity, unit, item] = match;
          return { 
            quantityStr: this.wordToNumber(wordQuantity).toString(), 
            unit, 
            item 
          };
        }
      },
      
      // Any numbers in the text (last resort)
      {
        regex: /.*?(\d+).*?/i,
        confidence: 0.5,
        extract: (match: RegExpMatchArray): ExtractedItemWithUnitData => {
          const [, quantityStr] = match;
          return { quantityStr, itemWithUnit: lowerTranscription };
        }
      }
    ];
    
    // Try each pattern in sequence
    for (const pattern of patterns) {
      const match = lowerTranscription.match(pattern.regex);
      
      if (match) {
        try {
          const extracted = pattern.extract(match);
          const quantity = parseInt(extracted.quantityStr, 10);
          
          if (isNaN(quantity)) {
            continue; // Skip if quantity is not a number
          }
          
          // If we have a direct item and unit extraction (check for the discriminator properties)
          if ('item' in extracted && 'unit' in extracted) {
            const result = {
              action,
              item: this.cleanUpItemName(extracted.item || ''),
              quantity,
              unit: this.normalizeUnit(extracted.unit || ''),
              confidence: pattern.confidence,
              isComplete: this.isCommandComplete(action, extracted.item || '', quantity, extracted.unit || '')
            };
            return result;
          }
          
          // If we need to extract unit from the item string
          if ('itemWithUnit' in extracted) {
            const { item, unit } = this.extractItemAndUnit(extracted.itemWithUnit);
            const result = {
              action,
              item: this.cleanUpItemName(item),
              quantity,
              unit,
              confidence: pattern.confidence * 0.9, // Slightly reduced confidence
              isComplete: this.isCommandComplete(action, item, quantity, unit)
            };
            return result;
          }
        } catch (err) {
          console.error('Error processing pattern match:', err);
          continue;
        }
      }
    }
    
    // If we get here, we couldn't parse the command with any pattern
    // Enhanced last-resort extraction
    console.log('No pattern matched, trying last-resort extraction');
    
    // Extract quantity: first try numeric digits, then word numbers
    let quantity = 1; // Default to 1 if no quantity found
    
    const numberWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    const hasNumberWord = numberWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(lowerTranscription));
    
    // Try to extract number from digits
    const numberMatches = lowerTranscription.match(/\d+/g);
    if (numberMatches && numberMatches.length > 0) {
      quantity = parseInt(numberMatches[0], 10);
      console.log(`Extracted quantity from digits: ${quantity}`);
    } 
    // Try to extract number from words
    else if (hasNumberWord) {
      for (let i = 0; i < numberWords.length; i++) {
        if (new RegExp(`\\b${numberWords[i]}\\b`, 'i').test(lowerTranscription)) {
          quantity = i + 1; // one=1, two=2, etc.
          console.log(`Extracted quantity from word "${numberWords[i]}": ${quantity}`);
          break;
        }
      }
    }
    
    // Extract item name
    const item = this.extractItemName(lowerTranscription);
    console.log(`Extracted item: "${item}"`);
    
    // Determine best unit
    const unit = this.determineUnitForItem(item);
    console.log(`Determined appropriate unit for ${item}: ${unit}`);
    
    // Calculate confidence based on how much we extracted
    let confidence = 0.4; // Base confidence for fallback
    if (item !== 'item' && item.length > 0) confidence += 0.1; // Boost if we extracted a real item
    if (quantity > 0 && numberMatches) confidence += 0.1; // Boost if we found an explicit quantity
    
    return {
      action,
      item,
      quantity,
      unit,
      confidence,
      isComplete: this.isCommandComplete(action, item, quantity, unit)
    };
  }
  
  /**
   * Convert word representation of numbers to actual numbers
   */
  private wordToNumber(word: string): number {
    const wordToNumberMap: Record<string, number> = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 
      'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 
      'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 
      'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 
      'eighteen': 18, 'nineteen': 19, 'twenty': 20
    };
    
    return wordToNumberMap[word.toLowerCase()] || 0;
  }
  
  /**
   * Determine the most appropriate unit for a given item
   */
  private determineUnitForItem(item: string): string {
    // Item-specific default units mapping
    const itemUnitMap: Record<string, string> = {
      // Liquids
      'milk': 'gallons',
      'cream': 'gallons',
      'water': 'gallons',
      'juice': 'gallons',
      'syrup': 'bottles',
      'caramel': 'bottles',
      'vanilla': 'bottles',
      'chocolate': 'bottles',
      
      // Solids
      'coffee': 'pounds',
      'beans': 'pounds',
      'sugar': 'pounds',
      'flour': 'pounds',
      
      // Packaged items
      'tea': 'boxes',
      'napkins': 'packs',
      'cups': 'sleeves',
      'lids': 'sleeves',
      'straws': 'boxes',
      'stirrers': 'boxes',
      'filters': 'packs',
      'pastry': 'pieces',
      'muffin': 'pieces',
      'cookie': 'pieces'
    };
    
    // Check for direct match
    const lowercaseItem = item.toLowerCase();
    for (const [itemKey, unit] of Object.entries(itemUnitMap)) {
      if (lowercaseItem.includes(itemKey)) {
        return unit;
      }
    }
    
    // If no match, return generic units
    return 'units';
  }

  /**
   * Extract item and unit from a combined string
   */
  private extractItemAndUnit(itemWithUnit: string): { item: string, unit: string } {
    const words = itemWithUnit.split(' ');
    
    // Common units to check for
    const commonUnits = [
      'pounds', 'pound', 'lb', 'lbs',
      'kilos', 'kilo', 'kg', 'kilograms', 'kilogram',
      'grams', 'gram', 'g',
      'boxes', 'box',
      'bags', 'bag',
      'bottles', 'bottle',
      'cases', 'case',
      'gallons', 'gallon', 'gal',
      'liters', 'liter', 'l',
      'cups', 'cup',
      'cartons', 'carton',
      'pieces', 'piece', 'pcs',
      'units', 'unit',
      'packs', 'pack',
      'containers', 'container',
      'packets', 'packet',
      'sachets', 'sachet',
      'jars', 'jar',
      'sleeves', 'sleeve'
    ];
    
    // Look for unit in the string
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      if (commonUnits.includes(word)) {
        // Remove the unit from the item string
        const newWords = [...words];
        newWords.splice(i, 1);
        return {
          unit: this.normalizeUnit(word),
          item: newWords.join(' ').trim()
        };
      }
    }
    
    // If no known unit is found, try to determine appropriate unit
    const extractedItem = itemWithUnit.trim();
    const suggestedUnit = this.determineUnitForItem(extractedItem);
    
    return {
      unit: suggestedUnit,
      item: extractedItem
    };
  }
  
  /**
   * Normalize unit names to standard forms
   */
  private normalizeUnit(unit: string): string {
    unit = unit.toLowerCase();
    
    // Mapping of unit variations to standard names
    const unitMap: Record<string, string> = {
      // Weight units
      'lb': 'pounds', 'lbs': 'pounds', 'pound': 'pounds',
      'kg': 'kilograms', 'kilo': 'kilograms', 'kilos': 'kilograms', 'kilogram': 'kilograms',
      'g': 'grams', 'gram': 'grams',
      'oz': 'ounces', 'ounce': 'ounces',
      
      // Volume units
      'gallon': 'gallons', 'gal': 'gallons',
      'liter': 'liters', 'l': 'liters', 'litre': 'liters', 'litres': 'liters',
      'cup': 'cups',
      'ml': 'milliliters', 'milliliter': 'milliliters', 'millilitre': 'milliliters',
      'fl oz': 'fluid ounces', 'fluid ounce': 'fluid ounces', 'floz': 'fluid ounces',
      
      // Container units
      'box': 'boxes',
      'bag': 'bags',
      'bottle': 'bottles',
      'case': 'cases',
      'carton': 'cartons',
      'piece': 'pieces', 'pcs': 'pieces', 'pc': 'pieces',
      'unit': 'units',
      'pack': 'packs', 'package': 'packs',
      'container': 'containers',
      'packet': 'packets',
      'sachet': 'sachets',
      'jar': 'jars',
      'sleeve': 'sleeves', 
      'stack': 'stacks',
      'roll': 'rolls',
      'sheet': 'sheets'
    };
    
    return unitMap[unit] || unit;
  }
  
  /**
   * Clean up item names by removing unnecessary words
   */
  private cleanUpItemName(item: string): string {
    if (!item) return 'item'; // Safety check for undefined or empty input
    
    // Remove filler words and unnecessary prepositions
    const fillerWords = [
      'the', 'a', 'an', 'some', 'more', 'please', 'thanks', 'thank', 'you', 'would', 'like',
      'can', 'could', 'to', 'for', 'of', 'with', 'without', 'i', 'we', 'our', 'my', 'this', 
      'that', 'these', 'those', 'few', 'little', 'need', 'just', 'only', 'extra'
    ];
    
    let cleanItem = item.toLowerCase().trim();
    
    // Remove filler words (but only whole word matches)
    fillerWords.forEach(word => {
      cleanItem = cleanItem.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });
    
    // Remove numeric values
    cleanItem = cleanItem.replace(/\b\d+\b/g, '');
    
    // Remove action words that might have been mixed in with item name
    const actionWords = ['add', 'set', 'remove', 'get', 'update', 'change', 'stock', 'order', 'buy'];
    actionWords.forEach(word => {
      cleanItem = cleanItem.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });
    
    // Remove extra spaces
    cleanItem = cleanItem.replace(/\s+/g, ' ').trim();
    
    // Remove common punctuation
    cleanItem = cleanItem.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
    
    // Ensure we have something to return
    if (!cleanItem) return 'item';
    
    return cleanItem;
  }
  
  /**
   * Extract item name from a query command
   */
  private extractItemFromQuery(text: string): string {
    // Handle queries like "do we have any milk left"
    const queryPatterns = [
      /\b(?:do we have|is there|check)\s+(?:any|some|the)?\s+(.+?)(?:\s+left)?\??$/i,
      /\bhow much\s+(.+?)\s+(?:do we have|is there|is left)\??$/i,
      /\bhow many\s+(.+?)\s+(?:do we have|are there|are left)\??$/i
    ];
    
    for (const pattern of queryPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.cleanUpItemName(match[1]);
      }
    }
    
    // Fallback - just remove question words and common verbs
    const cleanText = text.replace(/\b(?:do|we|have|is|there|any|some|how|much|many|left|check)\b/gi, '');
    return this.cleanUpItemName(cleanText);
  }
  
  /**
   * Check if the text contains any common inventory items
   */
  private containsCommonInventoryItem(text: string): boolean {
    const commonItems = this.getCommonInventoryItems();
    const words = text.toLowerCase().split(/\s+/);
    
    // Check for direct matches
    for (const item of commonItems) {
      if (words.includes(item)) {
        return true;
      }
    }
    
    // Check for partial matches (e.g., "coffee" in "coffeemaker")
    for (const word of words) {
      for (const item of commonItems) {
        if (word.includes(item) && item.length > 3) { // Only consider substantial matches
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Get list of common inventory items
   */
  private getCommonInventoryItems(): string[] {
    return [
      'coffee', 'milk', 'sugar', 'syrup', 'tea', 'cups', 'beans', 'napkins',
      'almond', 'oat', 'soy', 'vanilla', 'chocolate', 'caramel', 'cream', 'water',
      'espresso', 'decaf', 'regular', 'juice', 'pastry', 'muffin', 'cookie',
      'stirrer', 'straw', 'lid', 'sleeve', 'filter', 'honey', 'cinnamon',
      'nutmeg', 'powder', 'cup', 'box', 'bag', 'bottle', 'carton', 'container',
      'packet', 'pallet', 'case', 'spoon', 'fork', 'knife', 'napkin', 'towel'
    ];
  }

  /**
   * Extract probable item name from any text
   */
  private extractItemName(text: string): string {
    // First, check if there are common inventory items in the text
    const commonItems = this.getCommonInventoryItems();
    
    const words = text.toLowerCase().split(/\s+/);
    
    for (const item of commonItems) {
      if (words.includes(item)) {
        // Try to expand to include adjectives before the item
        const itemIndex = words.indexOf(item);
        if (itemIndex > 0) {
          // Get up to 3 words before the item, but stop at action words or numbers
          let startIndex = Math.max(0, itemIndex - 3);
          const phrase = words.slice(startIndex, itemIndex + 1).join(' ');
          return phrase;
        }
        return item;
      }
    }
    
    // If no common items found, remove common words and return what's left
    const commonWords = [
      'add', 'set', 'remove', 'update', 'change', 'get', 'put', 'take',
      'need', 'want', 'have', 'please', 'thank', 'you', 'should', 'would',
      'could', 'will', 'can', 'may', 'might', 'must', 'shall', 'some', 'few',
      'many', 'much', 'more', 'less', 'several', 'few', 'the', 'a', 'an', 'and',
      'but', 'or', 'so', 'because', 'since', 'although', 'even', 'though', 'if',
      'unless', 'until', 'when', 'where', 'while'
    ];
    
    const filteredWords = words.filter(word => 
      !commonWords.includes(word) && 
      !word.match(/^\d+$/) // Remove numbers
    );
    
    // If we have some words left after filtering, use them
    if (filteredWords.length) {
      return filteredWords.join(' ');
    }
    
    // Last resort: just take all non-numeric words
    const allNonNumeric = words.filter(word => !word.match(/^\d+$/));
    if (allNonNumeric.length) {
      return allNonNumeric.join(' ');
    }
    
    return 'item'; // Better default than 'unknown'
  }

  /**
   * Determine if a command is complete based on its components
   */
  private isCommandComplete(action: string, item: string, quantity: number | string, unit: string): boolean {
    // Basic validation
    if (!action || action === 'unknown') {
      return false;
    }

    if (!item || item === 'unknown') {
      return false;
    }

    // Action-specific validation
    switch (action) {
      case 'set':
        // For set commands, we need both a valid item AND a valid quantity/unit
        const hasValidQuantity = typeof quantity === 'number' && quantity > 0 && unit !== 'unknown' && unit !== '';
        
        // Special case for handling partial set commands
        // If the item contains "to NUMBER UNIT" pattern, it might be complete
        if (typeof item === 'string' && /\bto\s+\d+\s+\w+\b/i.test(item)) {
          return hasValidQuantity;
        }
        
        // If item doesn't contain "to" but has a valid quantity, it's likely missing the quantity part
        if (!item.toLowerCase().includes(' to ') && !hasValidQuantity) {
          console.log('🧠 [NLP] Set command appears incomplete - missing "to QUANTITY UNIT" part');
          return false;
        }
        
        // Check for incomplete set commands
        if (item.toLowerCase().endsWith(' to')) {
          console.log('🧠 [NLP] Set command appears incomplete - ends with "to"');
          return false;
        }
        
        return hasValidQuantity;
      
      case 'add':
      case 'remove':
        // Add/remove commands need at least an item to be complete
        // but for multi-segment remove commands, we also want to ensure we have both quantity and item
        if (item.toLowerCase().startsWith('to ')) {
          // If the item starts with "to", it's likely part of a multi-segment command
          // and we need to check if we have a valid quantity
          return typeof quantity === 'number' && quantity > 0;
        }
        
        // For normal add/remove commands, we're good if we have an item
        // If quantity is specified, it should be valid
        if (quantity === 'unknown' || quantity === '') {
          // No quantity specified, that's fine for basic add/remove
          return true;
        }
        
        // Quantity was specified, so it should be a valid number
        return typeof quantity === 'number' && quantity > 0;
      
      default:
        return false;
    }
  }
}

export default new NlpService(); 