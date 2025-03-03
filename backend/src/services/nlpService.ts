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
  /**
   * Process a transcription and extract inventory command
   * @param transcription - The transcription to process
   * @returns Extracted inventory command
   */
  async processTranscription(transcription: string): Promise<{
    action: string;
    item: string;
    quantity: number;
    unit: string;
    confidence: number;
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
      
      // Calculate processing time
      const processTime = Date.now() - startTime;
      
      // Log detailed results
      console.log(`🧠 [NLP] Processing complete in ${processTime}ms`);
      console.log(`🧠 [NLP] Extracted action: "${result.action}"`);
      console.log(`🧠 [NLP] Extracted item: "${result.item}"`);
      console.log(`🧠 [NLP] Extracted quantity: ${result.quantity}`);
      console.log(`🧠 [NLP] Extracted unit: "${result.unit}"`);
      console.log(`🧠 [NLP] Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      
      return result;
    } catch (error) {
      console.error('🧠 [NLP] ❌ Error processing transcription:', error);
      console.trace('🧠 [NLP] Error stack trace:');
      
      // Return basic unknown result instead of crashing
      return {
        action: 'unknown',
        item: 'unknown',
        quantity: 0,
        unit: 'units',
        confidence: 0.3
      };
    }
  }

  /**
   * Process transcription using OpenAI API
   * @param transcription - The transcription to process
   * @returns Extracted inventory command
   */
  private async processWithOpenAI(transcription: string): Promise<{
    action: string;
    item: string;
    quantity: number;
    unit: string;
    confidence: number;
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
              1. Action (add, remove, or set)
              2. Item name
              3. Quantity (as a number)
              4. Unit of measurement
              
              Respond with a JSON object with these fields: action, item, quantity, unit.
              If any field is missing or unclear, make your best guess.`
            },
            {
              role: 'user',
              content: transcription
            }
          ],
          temperature: 0.3,
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
      const action = result.action?.toLowerCase() || '';
      const item = result.item || '';
      const quantity = parseInt(result.quantity, 10) || 0;
      const unit = result.unit || '';
      
      // Calculate confidence based on completeness
      let confidence = 0.8; // Base confidence
      if (!action || !item || !quantity || !unit) {
        confidence = 0.6; // Lower confidence if any field is missing
      }
      
      return {
        action,
        item,
        quantity,
        unit,
        confidence
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
  }> {
    const lowerTranscription = transcription.toLowerCase().trim();
    
    if (!lowerTranscription) {
      return {
        action: 'unknown',
        item: 'unknown',
        quantity: 0,
        unit: 'unknown',
        confidence: 0.1, // Very low confidence for empty transcription
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
          confidence: 0.7
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
            confidence: 0.4
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
            return {
              action,
              item: this.cleanUpItemName(extracted.item || ''),
              quantity,
              unit: this.normalizeUnit(extracted.unit || ''),
              confidence: pattern.confidence
            };
          }
          
          // If we need to extract unit from the item string
          if ('itemWithUnit' in extracted) {
            const { item, unit } = this.extractItemAndUnit(extracted.itemWithUnit);
            return {
              action,
              item: this.cleanUpItemName(item),
              quantity,
              unit,
              confidence: pattern.confidence * 0.9 // Slightly reduced confidence
            };
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
      confidence
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
}

export default new NlpService(); 