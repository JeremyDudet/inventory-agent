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
    quantity: number | undefined;
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
    quantity: number | undefined;
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
        quantity: undefined,
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
    quantity: number | undefined;
    unit: string;
    confidence: number;
    isComplete: boolean;
  }): void {
    // Only store meaningful parts of the command
    this.previousCommand = {
      action: result.action !== 'unknown' ? result.action : '',
      item: result.item !== 'unknown' ? result.item : '',
      quantity: result.quantity !== undefined ? result.quantity : undefined,
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
    quantity: number | undefined;
    unit: string;
    confidence: number;
    isComplete: boolean;
  }): {
    action: string;
    item: string;
    quantity: number | undefined;
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
      action: result.action !== '' ? result.action : this.previousCommand.action || '',
      item: result.item !== '' ? result.item : this.previousCommand.item || '',
      quantity: result.quantity !== undefined ? result.quantity : this.previousCommand.quantity || undefined,
      unit: result.unit !== '' ? result.unit : this.previousCommand.unit || '',
      confidence: result.confidence,
      isComplete: result.isComplete || this.isCommandComplete(
        result.action !== '' ? result.action : this.previousCommand.action || '',
        result.item !== '' ? result.item : this.previousCommand.item || '',
        result.quantity !== undefined ? result.quantity : this.previousCommand.quantity || undefined,
        result.unit !== '' ? result.unit : this.previousCommand.unit || ''
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
    quantity: number | undefined;
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
              content: `You are a natural language processor for an inventory management system. Your task is to extract inventory commands from user input.

Key requirements:
1. Extract these fields from the command:
   - action: must be one of "add", "remove", or "set" (empty string if not found)
   - item: the inventory item name (empty string if not found)
   - quantity: a number if explicitly specified, undefined if not found
   - unit: standard unit (e.g., "gallons", "pounds", "boxes", "units" if not specified)

2. Handle common patterns:
   - "add X units of Y" (e.g., "add 2 gallons of milk")
   - "remove X from Y" (e.g., "remove 5 pounds from coffee")
   - "set X to Y" (e.g., "set milk to 10 gallons")
   - "X units Y" (e.g., "20 gallons whole milk")

3. Return a JSON object that matches this Zod schema:
   {
     action: z.enum(["add", "remove", "set"]).optional(),
     item: z.string().min(1),
     quantity: z.number().positive().optional(),
     unit: z.string().min(1),
     confidence: z.number().min(0).max(1)
   }

4. Confidence scoring:
   - 0.95: Complete command with all fields
   - 0.8: Command with action and item
   - 0.6: Partial command with some fields
   - 0.4: Unclear or incomplete command

5. Normalize units to standard forms:
   - "gal" → "gallons"
   - "lb" → "pounds"
   - "box" → "boxes"
   - "unit" → "units"

6. Clean up item names by:
   - Removing filler words (the, a, an, some, etc.)
   - Removing action words
   - Removing punctuation
   - Trimming whitespace

7. Validation rules:
   - action must be one of: "add", "remove", "set" (or empty string if not found)
   - item must be a non-empty string
   - quantity must be a positive number (or undefined if not found)
   - unit must be a non-empty string
   - confidence must be between 0 and 1

Return only valid JSON that matches the Zod schema.`
            },
            {
              role: 'user',
              content: transcription
            }
          ],
          temperature: 0.3,
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      
      // Convert unknown values to empty strings
      const action = result.action?.toLowerCase() === 'unknown' ? '' : (result.action?.toLowerCase() || '');
      const item = result.item?.toLowerCase() === 'unknown' ? '' : (result.item?.toLowerCase() || '');
      const unit = result.unit?.toLowerCase() === 'unknown' ? 'units' : (result.unit?.toLowerCase() || 'units');
      // Only set quantity if explicitly provided
      const quantity = result.quantity === 'unknown' || result.quantity === '' ? undefined : 
        (typeof result.quantity === 'number' ? result.quantity : undefined);
      
      // Base confidence on presence of fields
      const baseConfidence = result.confidence || 0.8;
      const hasAllFields = Boolean(action && item && quantity && unit);
      const confidence = hasAllFields ? baseConfidence : baseConfidence * 0.75;

      return {
        action,
        item,
        quantity,
        unit,
        confidence,
        isComplete: this.isCommandComplete(action, item, quantity, unit)
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
  private processWithRules(transcription: string): {
    action: string;
    item: string;
    quantity: number | undefined;
    unit: string;
    confidence: number;
    isComplete: boolean;
  } {
    const lowerTranscription = transcription.toLowerCase();

    if (!lowerTranscription) {
      return {
        action: '',
        item: '',
        quantity: undefined,
        unit: '',
        confidence: 0.1,
        isComplete: false
      };
    }

    // Default case - try to extract what we can
    let action = '';
    let item = '';
    let quantity: number | undefined = undefined;
    let unit = 'units';
    let confidence = 0.95;
    let isComplete = false;

    // Extract action
    if (lowerTranscription.includes('add')) {
      action = 'add';
    } else if (lowerTranscription.includes('remove')) {
      action = 'remove';
    } else if (lowerTranscription.includes('set')) {
      action = 'set';
    }

    // Pattern for "X units of Y" (e.g., "2 gal of milk")
    const unitPattern = /(\d+)\s+(\w+)\s+(?:of\s+)?(.+)/i;
    const unitMatch = lowerTranscription.match(unitPattern);
    if (unitMatch) {
      const [_, extractedQuantity, extractedUnit, extractedItem] = unitMatch;
      quantity = parseInt(extractedQuantity, 10);
      unit = this.normalizeUnit(extractedUnit);
      item = extractedItem.trim();

      // If we have an item, try to determine a better unit if none was specified
      if (item && unit === 'units') {
        unit = this.determineUnitForItem(item);
      }
    } else {
      // Pattern for "X to Y" (e.g., "20 gallons to whole milk")
      const toPattern = /(\d+)\s+(\w+)\s+to\s+(.+)/i;
      const toMatch = lowerTranscription.match(toPattern);
      if (toMatch) {
        const [_, extractedQuantity, extractedUnit, extractedItem] = toMatch;
        quantity = parseInt(extractedQuantity, 10);
        unit = this.normalizeUnit(extractedUnit);
        item = extractedItem.trim();
      } else {
        // Pattern for "action X units Y" (e.g., "add 5 gallons whole milk")
        const actionPattern = /(add|remove|set)\s+(\d+)\s+(\w+)\s+(.+)/i;
        const actionMatch = lowerTranscription.match(actionPattern);
        if (actionMatch) {
          const [_, extractedAction, extractedQuantity, extractedUnit, extractedItem] = actionMatch;
          action = extractedAction;
          quantity = parseInt(extractedQuantity, 10);
          unit = this.normalizeUnit(extractedUnit);
          item = extractedItem.trim();
        } else {
          // Extract item (remove action words and filler words)
          item = lowerTranscription
            .replace(/\b(add|remove|set|to|some|more|of|the)\b/g, '')
            .trim();
          
          // Try to determine appropriate unit for the item
          if (item) {
            unit = this.determineUnitForItem(item);
          }
        }
      }
    }

    // For set commands, we need all fields
    if (action === 'set' && (!quantity || quantity <= 0)) {
      confidence = 0.5;
      isComplete = false;
    }
    // For add/remove commands, we need at least an item
    else if ((action === 'add' || action === 'remove') && !item) {
      confidence = 0.5;
      isComplete = false;
    }
    // If we have all required fields, command is complete
    else {
      isComplete = this.isCommandComplete(action, item, quantity, unit);
    }

    return {
      action,
      item,
      quantity,
      unit,
      confidence,
      isComplete
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
    const unitMap: { [key: string]: string } = {
      'gal': 'gallons',
      'gallon': 'gallons',
      'gallons': 'gallons',
      'lb': 'pounds',
      'lbs': 'pounds',
      'pound': 'pounds',
      'pounds': 'pounds',
      'unit': 'units',
      'units': 'units',
      'piece': 'units',
      'pieces': 'units'
    };

    const normalizedUnit = unitMap[unit.toLowerCase()];
    return normalizedUnit || 'units';
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
  private isCommandComplete(action: string, item: string, quantity: number | undefined, unit: string): boolean {
    // If action is empty, command is incomplete
    if (!action) {
      return false;
    }

    // For set commands, we need all fields and quantity must be greater than 0
    if (action === 'set') {
      if (!item || !unit || quantity === undefined || quantity === null || quantity === 0) {
        console.log('🧠 [NLP] Set command appears incomplete - missing required fields or zero quantity');
        return false;
      }
      return true;
    }

    // For add/remove commands, we need at least an item
    if (action === 'add' || action === 'remove') {
      if (!item) {
        console.log('🧠 [NLP] Add/remove command appears incomplete - missing item');
        return false;
      }
      return true;
    }

    // If we get here, the command is incomplete
    return false;
  }
}

export default new NlpService(); 