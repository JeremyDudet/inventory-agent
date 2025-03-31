// backend/src/services/nlpService.ts
import dotenv from 'dotenv';
import axios from 'axios';
import { NlpResult } from '../types/nlp';

// Load environment variables
dotenv.config();

// OpenAI API key for more advanced NLP processing
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const useOpenAI = openaiApiKey !== '';

/**
 * NLP service for processing transcriptions and extracting inventory commands
 */
export class NlpService {
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
   * Process a transcription and extract inventory commands
   * @param transcription - The transcription to process
   * @returns Array of NLP results
   */
  async processTranscription(transcription: string): Promise<NlpResult[]> {
    const startTime = Date.now();
    console.log(`🧠 [NLP] Processing transcription: "${transcription}"`);
    console.log(`🧠 [NLP] OpenAI API key available: ${!!openaiApiKey}`);
    
    try {
      // Split transcription into individual commands
      const commands = this.splitIntoCommands(transcription);
      console.log(`🧠 [NLP] Split into ${commands.length} commands`);
      
      // Process each command
      const results = await Promise.all(commands.map(async (command) => {
        let commandResults: NlpResult[];
        
        // If OpenAI API key is available, use it for more advanced processing
        if (useOpenAI) {
          console.log('🧠 [NLP] Using OpenAI API for NLP processing');
          commandResults = await this.processWithOpenAI(command);
          console.log('🧠 [NLP] OpenAI processing results:', JSON.stringify(commandResults, null, 2));
        } else {
          // Otherwise, use the rule-based approach
          console.log('🧠 [NLP] Using rule-based processing (OpenAI API not configured)');
          commandResults = this.processWithRules(command);
          console.log('🧠 [NLP] Rule-based processing results:', JSON.stringify(commandResults, null, 2));
        }
        
        return commandResults;
      }));
      
      // Flatten results array
      const flattenedResults = results.flat();
      
      // Merge with previous context, skipping undo commands
      const mergedCommands = flattenedResults.map(cmd =>
        cmd.type === 'undo' ? cmd : this.mergeWithPreviousContext(cmd)
      );
      
      // Update context only for incomplete commands
      mergedCommands.forEach(cmd => {
        if (!cmd.isComplete && !cmd.type) {
          this.updateCommandContext(cmd);
        } else if (cmd.isComplete && !cmd.type) {
          this.previousCommand = null;
        }
      });
      
      // Calculate processing time
      const processTime = Date.now() - startTime;
      
      // Log detailed results
      console.log(`🧠 [NLP] Processing complete in ${processTime}ms`);
      mergedCommands.forEach((result: NlpResult) => {
        console.log(`🧠 [NLP] Extracted action: "${result.action}"`);
        console.log(`🧠 [NLP] Extracted item: "${result.item}"`);
        console.log(`🧠 [NLP] Extracted quantity: ${result.quantity}`);
        console.log(`🧠 [NLP] Extracted unit: "${result.unit}"`);
        console.log(`🧠 [NLP] Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`🧠 [NLP] Command complete: ${result.isComplete}`);
      });
      
      return mergedCommands;
    } catch (error) {
      console.error('🧠 [NLP] ❌ Error processing transcription:', error);
      console.trace('🧠 [NLP] Error stack trace:');
      
      // Return basic unknown result instead of crashing
      return [{
        action: 'unknown',
        item: 'unknown',
        quantity: undefined,
        unit: 'units',
        confidence: 0.3,
        isComplete: false
      }];
    }
  }

  /**
   * Split a transcription into individual commands
   * @param transcription - The transcription to split
   * @returns Array of individual commands
   */
  private splitIntoCommands(transcription: string): string[] {
    // Handle undo commands first
    if (transcription.toLowerCase().includes('undo')) {
      return [transcription];
    }

    // Split by commas or 'and' for multiple items
    const segments = transcription
      .split(/[,;]|\s+and\s+/i)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    // If no delimiters found, try to detect multiple commands by pattern
    if (segments.length === 1) {
      const command = segments[0];
      
      // Pattern for "X units of Y, Z units of W"
      const quantityUnitPattern = /(\d+)\s+(gallons?|pounds?|cups?|boxes?|sleeves?|units?)\s+of\s+([^,]+?)(?:\s*,\s*(\d+)\s+(gallons?|pounds?|cups?|boxes?|sleeves?|units?)\s+of\s+([^,]+?))*/gi;
      
      const matches = [...command.matchAll(quantityUnitPattern)];
      if (matches.length > 1) {
        return matches.map(match => match[0].trim());
      }
      
      // Pattern for "add X, remove Y, set Z"
      const actionPattern = /(add|remove|set)\s+([^,]+?)(?:\s*,\s*(add|remove|set)\s+([^,]+?))*/gi;
      const actionMatches = [...command.matchAll(actionPattern)];
      if (actionMatches.length > 1) {
        return actionMatches.map(match => match[0].trim());
      }

      // Pattern for "add X and Y"
      const andPattern = /(add|remove|set)\s+([^,]+?)\s+and\s+([^,]+?)/gi;
      const andMatches = [...command.matchAll(andPattern)];
      if (andMatches.length > 0) {
        const match = andMatches[0];
        const action = match[1];
        const firstItem = match[2].trim();
        const secondItem = match[3].trim();
        return [
          `${action} ${firstItem}`,
          `${action} ${secondItem}`
        ];
      }
    }
    
    return segments;
  }

  /**
   * Update the command context with the current result
   */
  private updateCommandContext(result: NlpResult): void {
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
  private mergeWithPreviousContext(result: NlpResult): NlpResult {
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
      action: result.action || '',
      item: result.item || '',
      quantity: typeof result.quantity === 'number' ? result.quantity : undefined,
      unit: result.unit?.toLowerCase(),
      confidence: result.confidence || 0.8,
      isComplete: this.isCommandComplete(result.action || '', result.item || '', result.quantity, result.unit || 'units'),
      type: result.type // Include if present (e.g., 'undo')
    };
  }

  /**
   * Process transcription using OpenAI API
   * @param transcription - The transcription to process
   * @returns Array of extracted inventory commands
   */
  private async processWithOpenAI(transcription: string): Promise<NlpResult[]> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a natural language processor for an inventory management system. Your task is to extract one or more inventory commands from the user's input. Each command should have:

action: 'add', 'remove', or 'set' (empty string if not found)
item: the item name, including any specified attributes like size (return an empty string if not found)
quantity: a positive number if specified, undefined if not found
unit: standard unit e.g., 'gallons', 'pounds', 'bags', 'boxes' (empty string if not found)
confidence: 0 to 1 (0.95 for complete, 0.8 for action+item, 0.6 for partial)

Additionally, if the input contains 'undo' or 'revert last', return a single command with {type: 'undo'}.

IMPORTANT RULES:
1. If the input contains 'undo' or 'revert last', return a single command with {type: 'undo'}
2. For statements about CURRENT inventory levels, ALWAYS use action: 'set'. Examples:
   - "We have 30 gallons of whole milk" → action: 'set'
   - "30 gallons of whole milk" → action: 'set'
   - "There is 5 pounds of coffee" → action: 'set'
   - "We have 20 boxes of tea" → action: 'set'
3. Only use 'add' when explicitly adding to inventory
4. Only use 'remove' when explicitly removing from inventory
5. When attributes like size are mentioned, include them in the item name. For example:
   - "We have 60 bags of 12 ounce paper cups" → item: "12 ounce paper cups"
   - "Add 10 boxes of large coffee filters" → item: "large coffee filters"
6. If the input has a structure like "X units of Y item", treat it as a single command.
   If the input lists multiple "X units of Y item" separated by "and" or commas, treat them as separate commands.

Examples:
Input: "We have 30 gallons of whole milk"
Output: [{"action": "set", "item": "whole milk", "quantity": 30, "unit": "gallons", "confidence": 0.95}]

Input: "Add 5 gallons of milk"
Output: [{"action": "add", "item": "milk", "quantity": 5, "unit": "gallons", "confidence": 0.95}]

Input: "We have 60 bags of 12 ounce paper cups"
Output: [{"action": "set", "item": "12 ounce paper cups", "quantity": 60, "unit": "bags", "confidence": 0.95}]

Input: "Add 10 boxes of large coffee filters"
Output: [{"action": "add", "item": "large coffee filters", "quantity": 10, "unit": "boxes", "confidence": 0.95}]

Input: "We have 30 gallons of whole milk and 20 boxes of tea"
Output: [
  {"action": "set", "item": "whole milk", "quantity": 30, "unit": "gallons", "confidence": 0.95},
  {"action": "set", "item": "tea", "quantity": 20, "unit": "boxes", "confidence": 0.95}
]

Return a JSON array of commands.`
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

      // Validate response structure
      if (!response.data?.choices?.[0]?.message?.content) {
        console.error('🧠 [NLP] Invalid OpenAI API response structure');
        return this.processWithRules(transcription);
      }

      let results;
      try {
        results = JSON.parse(response.data.choices[0].message.content);
      } catch (parseError) {
        console.error('🧠 [NLP] Failed to parse OpenAI API response:', parseError);
        return this.processWithRules(transcription);
      }

      // Validate results is an array
      if (!Array.isArray(results)) {
        console.error('🧠 [NLP] OpenAI API response is not an array');
        return this.processWithRules(transcription);
      }

      // Process and validate each result
      const processedResults = results.map((result: any) => {
        // Ensure all required fields are present and properly formatted
        const processedResult = {
          action: (result.action || '').toLowerCase(),
          item: (result.item || '').toLowerCase(),
          quantity: typeof result.quantity === 'number' ? result.quantity : undefined,
          unit: (result.unit || '').toLowerCase(),
          confidence: typeof result.confidence === 'number' ? result.confidence : 0.6,
          isComplete: this.isCommandComplete(
            result.action || '',
            result.item || '',
            result.quantity,
            result.unit || ''
          ),
          type: result.type // Include if present (e.g., 'undo')
        };

        return processedResult;
      });

      console.log('🧠 [NLP] OpenAI extracted commands:', processedResults);
      return processedResults;

    } catch (error) {
      console.error('🧠 [NLP] Error with OpenAI API:', error);
      // Fall back to rule-based approach
      return this.processWithRules(transcription);
    }
  }

  /**
   * Process transcription using enhanced rule-based approach
   * @param transcription - The transcription to process
   * @returns Array of extracted inventory commands
   */
  private processWithRules(transcription: string): NlpResult[] {
    const results = this.extractMultipleCommands(transcription);
    
    // Process each result to ensure proper formatting and confidence
    return results.map(result => {
      // Clean up item names
      const cleanItem = this.cleanUpItemName(result.item);
      
      // Ensure proper unit
      const unit = result.unit || this.determineUnitForItem(cleanItem);
      
      // Determine if the command is complete
      const isComplete = this.isCommandComplete(result.action, cleanItem, result.quantity, unit);
      
      // Calculate confidence based on completeness and available data
      const confidence = this.calculateConfidence({
        ...result,
        item: cleanItem,
        unit,
        isComplete,
        confidence: 0.6  // Add default confidence
      });
      
      return {
        ...result,
        item: cleanItem,
        unit,
        confidence,
        isComplete
      };
    });
  }

  /**
   * Extract multiple commands from a transcription using rule-based processing
   */
  private extractMultipleCommands(transcription: string): NlpResult[] {
    // First check for undo command
    if (transcription.toLowerCase().includes('undo') || 
        transcription.toLowerCase().includes('revert last')) {
      // Extract referenced item if present
      const itemMatch = transcription.toLowerCase().match(/(?:undo|revert last)(?:\s+(?:the\s+)?(.+))?/i);
      const referencedItem = itemMatch?.[1]?.trim() || '';
      
      return [{
        action: 'undo',
        item: referencedItem,
        quantity: undefined,
        unit: '',
        confidence: 0.95,
        isComplete: true,
        type: 'undo' as const
      }];
    }

    // Split by common delimiters
    const segments = transcription.split(/[,;]|\band\b/).map(s => s.trim());
    let lastUnit: string | undefined;
    let lastAction: string | undefined;

    return segments.map(segment => {
      const result = this.extractSingleCommand(segment);
      
      // Inherit unit from previous command if not specified
      if (!result.unit && lastUnit) {
        result.unit = lastUnit;
      }
      lastUnit = result.unit;

      // Inherit action from previous command if not specified
      if (!result.action && lastAction) {
        result.action = lastAction;
      }
      lastAction = result.action;

      // Special case for "We have X" or "There is X" -> set command
      if (segment.toLowerCase().match(/^(we have|there (is|are))/)) {
        result.action = 'set';
      }

      return result;
    });
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
    
    // If no match, return empty string instead of default unit
    return '';
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
      'gals': 'gallons',
      'gallon': 'gallons',
      'lb': 'pounds',
      'lbs': 'pounds',
      'pound': 'pounds',
      'cups': 'cups',
      'box': 'boxes',
      'sleeve': 'sleeves'
    };
    return unitMap[unit.toLowerCase()] || unit.toLowerCase();
  }
  
  /**
   * Clean up item names by removing unnecessary words
   */
  private cleanUpItemName(item: string): string {
    if (!item) return ''; // Safety check for undefined or empty input
    
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
    
    // Return empty string if no valid item remains
    if (!cleanItem) return '';
    
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
  private isCommandComplete(action: string, item: string, quantity?: number, unit?: string): boolean {
    // Special case for undo commands
    if (action === 'undo') {
      return true;
    }

    // For set commands, we need all fields
    if (action === 'set') {
      return Boolean(item && typeof quantity === 'number' && quantity > 0 && unit);
    }

    // For add/remove commands, we need at least an item
    if (['add', 'remove'].includes(action)) {
      return Boolean(item);
    }

    return false;
  }

  private calculateConfidence(result: NlpResult): number {
    // Undo commands always have high confidence
    if (result.type === 'undo' || result.action === 'undo') {
      return 0.95;
    }

    // Base confidence levels
    if (!result.isComplete) {
      return 0.45;
    }

    // Complete commands with action and item
    if (result.action && result.item) {
      if (typeof result.quantity === 'number' && result.quantity > 0) {
        return 0.95;
      }
      return 0.8;
    }

    // Default low confidence for other cases
    return 0.6;
  }

  private extractSingleCommand(segment: string): NlpResult {
    // Check for inventory status statements first
    const statusPattern = /(?:we have|there is|there are|we got|we've got|we got)\s+(\d+)\s+(gallons?|pounds?|cups?|boxes?|sleeves?|units?)\s+of\s+([^,]+)/i;
    const statusMatch = segment.match(statusPattern);
    if (statusMatch) {
      console.log('🧠 [NLP] Detected inventory status statement');
      return {
        action: 'set',
        item: statusMatch[3].trim(),
        quantity: parseInt(statusMatch[1], 10),
        unit: statusMatch[2].toLowerCase(),
        confidence: 0.95,
        isComplete: true
      };
    }

    // Check for "X units of Y" pattern
    const quantityUnitPattern = /(\d+)\s+(gallons?|pounds?|cups?|boxes?|sleeves?|units?)\s+of\s+([^,]+)/i;
    const quantityMatch = segment.match(quantityUnitPattern);
    if (quantityMatch) {
      console.log('🧠 [NLP] Detected quantity-unit-item pattern');
      return {
        action: 'set', // Default to set for inventory status
        item: quantityMatch[3].trim(),
        quantity: parseInt(quantityMatch[1], 10),
        unit: quantityMatch[2].toLowerCase(),
        confidence: 0.95,
        isComplete: true
      };
    }

    const lowerSegment = segment.toLowerCase();
    let action = '';
    let item = '';
    let quantity: number | undefined;
    let unit = '';
    let type: 'undo' | undefined;

    // Check for undo command first
    if (lowerSegment.includes('undo') || lowerSegment.includes('revert last')) {
      // Extract referenced item if present
      const itemMatch = lowerSegment.match(/(?:undo|revert last)(?:\s+(?:the\s+)?(.+))?/i);
      const referencedItem = itemMatch?.[1]?.trim() || '';
      
      return {
        action: 'undo',
        item: referencedItem,
        quantity: undefined,
        unit: '',
        confidence: 0.95,
        isComplete: true,
        type: 'undo' as const
      };
    }

    // Extract action
    if (lowerSegment.includes('add')) action = 'add';
    else if (lowerSegment.includes('remove')) action = 'remove';
    else if (lowerSegment.includes('set')) action = 'set';

    // Extract quantity, unit, and item
    const patterns = [
      // Pattern 1: "{number} {unit} of {item}"
      /(\d+)\s+(\w+)\s+(?:of\s+)?(.+)/i,
      // Pattern 2: "{action} {number} {unit} of {item}"
      /(?:add|remove|set)\s+(\d+)\s+(\w+)\s+(?:of\s+)?(.+)/i,
      // Pattern 3: "{item} to {number} {unit}"
      /(.+?)\s+to\s+(\d+)\s+(\w+)/i
    ];

    let matched = false;
    for (const pattern of patterns) {
      const match = lowerSegment.match(pattern);
      if (match) {
        matched = true;
        if (pattern === patterns[2]) {
          // Pattern 3: item comes first
          item = match[1].trim();
          quantity = parseInt(match[2], 10);
          unit = this.normalizeUnit(match[3]);
        } else {
          // Pattern 1 & 2: quantity comes first
          quantity = parseInt(match[1], 10);
          unit = this.normalizeUnit(match[2]);
          item = match[3].trim();
        }
        break;
      }
    }

    // If no patterns matched but we have a number at the start, treat it as quantity and unit
    if (!matched) {
      const numberMatch = lowerSegment.match(/^(\d+)\s+(.+)/);
      if (numberMatch) {
        quantity = parseInt(numberMatch[1], 10);
        const remainder = numberMatch[2].trim();
        // For incomplete commands, keep the full text as the item
        item = `${quantity} ${remainder}`;
        // Try to extract unit from the remainder
        const unitMatch = remainder.match(/^(\w+)(?:\s+(?:of\s+)?(.+))?/i);
        if (unitMatch) {
          unit = this.normalizeUnit(unitMatch[1]);
          if (unitMatch[2]) {
            // Only update item if we have a complete command
            if (action) {
              item = unitMatch[2].trim();
            }
          }
        }
      } else {
        // Try to extract just the item
        item = segment
          .replace(/\b(add|remove|set)\b/gi, '')
          .replace(/\b(to|of)\b/gi, '')
          .trim();
      }
    }

    // Clean up item name and determine default unit if none specified
    item = this.cleanUpItemName(item);
    if (!unit) {
      unit = this.determineUnitForItem(item);
    }

    // Determine if command is complete
    const isComplete = this.isCommandComplete(action, item, quantity, unit);

    // Calculate confidence
    const confidence = this.calculateConfidence({
      action,
      item,
      quantity,
      unit,
      confidence: 0.6,
      isComplete,
      type
    });

    return {
      action,
      item,
      quantity,
      unit,
      confidence,
      isComplete,
      type
    };
  }
} 