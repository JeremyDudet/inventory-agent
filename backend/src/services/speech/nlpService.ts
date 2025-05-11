// backend/src/services/nlpService.ts

/*
NLP Service
This service is responsible for processing transcriptions and extracting inventory commands.
It uses OpenAI's GPT-3.5-turbo model for advanced NLP processing.
*/

import dotenv from "dotenv";
import axios from "axios";
import { NlpResult, RecentCommand, ContextProvider } from "@/types";

// Load environment variables
dotenv.config();

// OpenAI API key for advanced NLP processing
const openaiApiKey = process.env.OPENAI_API_KEY || "";
const useOpenAI = openaiApiKey !== "";

// Define the CommandAccumulator interface
interface CommandAccumulator {
  action: string;
  item: string;
  quantity: number | undefined;
  unit: string;
  timestamp: number;
}

/**
 * NLP service for processing transcriptions and extracting inventory commands
 */
export class NlpService {
  // Command accumulator to build commands incrementally
  private commandAccumulator: CommandAccumulator | null = null;

  // Time window for considering accumulator context (5 seconds)
  private contextWindowMs = 5000;

  private contextProvider: ContextProvider | null = null;

  /**
   * Set the context provider for this NLP service
   * @param provider The context provider to use
   */
  setContextProvider(provider: ContextProvider): void {
    this.contextProvider = provider;
  }

  /**
   * Process a transcription and extract inventory commands
   * @param transcription - The transcription to process
   * @param conversationHistory - Recent conversation history for context (deprecated, use context provider)
   * @param recentCommands - Recent inventory commands for context (deprecated, use context provider)
   * @returns Array of NLP results
   */
  async processTranscription(
    transcription: string,
    conversationHistory?: Array<{
      role: "user" | "assistant";
      content: string;
    }>,
    recentCommands?: Array<RecentCommand>
  ): Promise<NlpResult[]> {
    console.log(`🧠 [NLP] Processing transcription: "${transcription}"`);

    try {
      const history = this.contextProvider
        ? this.contextProvider.getConversationHistory()
        : conversationHistory || [];

      const commands = this.contextProvider
        ? this.contextProvider.getRecentCommands()
        : recentCommands || [];

      // Parse the transcription into NLP result(s)
      const parsedResults = await this.parseTranscription(
        transcription,
        history,
        commands
      );

      let output: NlpResult[] = [];

      // First, enhance incomplete results with context if available
      for (let i = 0; i < parsedResults.length; i++) {
        if (!parsedResults[i].isComplete && (commands.length > 0 || history.length > 0)) {
          parsedResults[i] = this.enhanceWithContext(
            parsedResults[i],
            history,
            commands
          );
        }
      }

      // Process each parsed result
      for (const result of parsedResults) {
        if (result.isComplete) {
          // Complete commands are added directly to output
          output.push(result);
        } else {
          // Handle incomplete commands with the accumulator
          if (
            this.commandAccumulator &&
            Date.now() - this.commandAccumulator.timestamp <= this.contextWindowMs
          ) {
            const mergedResult = this.mergeWithAccumulator(
              this.commandAccumulator,
              result
            );
            this.commandAccumulator = mergedResult;
            
            if (this.isCommandComplete(mergedResult)) {
              output.push({
                action: mergedResult.action as "add" | "remove" | "set",
                item: mergedResult.item,
                quantity: mergedResult.quantity,
                unit: mergedResult.unit,
                confidence: 0.95,
                isComplete: true,
              });
              this.commandAccumulator = null;
            }
          } else {
            // Start new accumulator
            this.commandAccumulator = {
              action: result.action as "add" | "remove" | "set",
              item: result.item,
              quantity: result.quantity,
              unit: result.unit,
              timestamp: Date.now(),
            };
          }
        }
      }

      // If an incomplete accumulator remains, include it in the output
      if (this.commandAccumulator) {
        output.push({
          action: this.commandAccumulator.action as "add" | "remove" | "set",
          item: this.commandAccumulator.item,
          quantity: this.commandAccumulator.quantity,
          unit: this.commandAccumulator.unit,
          confidence: this.calculateConfidence(this.commandAccumulator),
          isComplete: false,
        });
      }

      return output;
    } catch (error) {
      console.error("🧠 [NLP] ❌ Error processing transcription:", error);
      return [
        {
          action: "unknown" as "add" | "remove" | "set",
          item: "unknown",
          quantity: undefined,
          unit: "",
          confidence: 0.3,
          isComplete: false,
        },
      ];
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
      "more",
      "another",
      "additional",
      "extra",
      "same",
      "again",
      "also",
      "too",
      "as well",
      "like before",
    ];

    return relativeTerms.some((term) => lowerText.includes(term));
  }

  /**
   * Enhance an incomplete NLP result with context from conversation history and recent commands
   * @param result - The incomplete NLP result
   * @param conversationHistory - Recent conversation history
   * @param recentCommands - Recent inventory commands
   * @returns Enhanced NLP result
   */
  private enhanceWithContext(
    result: NlpResult,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    recentCommands: Array<RecentCommand>
  ): NlpResult {
    const enhanced = { ...result };

    // If we have a quantity but missing item or unit, try to fill from recent commands
    if (enhanced.quantity !== undefined && (!enhanced.item || !enhanced.unit)) {
      if (recentCommands.length > 0) {
        const mostRecent = recentCommands[recentCommands.length - 1];

        if (!enhanced.action || enhanced.action === mostRecent.action) {
          if (!enhanced.item) enhanced.item = mostRecent.item;
          if (!enhanced.unit) enhanced.unit = mostRecent.unit;
          if (!enhanced.action) enhanced.action = mostRecent.action as "add" | "remove" | "set";
        }
      }

      // Try to extract from conversation history if still incomplete
      if ((!enhanced.item || !enhanced.unit) && conversationHistory.length > 0) {
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
          const message = conversationHistory[i];

          const itemMatch = message.content.match(
            /(?:add|remove|set)\s+\d+\s+(\w+)\s+of\s+([^,.]+)/i
          );
          if (itemMatch) {
            if (!enhanced.unit) enhanced.unit = itemMatch[1];
            if (!enhanced.item) enhanced.item = itemMatch[2].trim();
            break;
          }
        }
      }
    }

    // Check if the command is now complete
    if (this.isCommandComplete({
      action: enhanced.action,
      item: enhanced.item,
      quantity: enhanced.quantity,
      unit: enhanced.unit,
      timestamp: Date.now(),
    })) {
      enhanced.isComplete = true;
      enhanced.confidence = Math.max(enhanced.confidence, 0.9);
    }

    return enhanced;
  }

  /**
   * Parse the transcription into NLP results using OpenAI or rule-based approach
   * @param transcription - The transcription to parse
   * @param conversationHistory - Conversation history for context
   * @param recentCommands - Recent commands for context
   * @returns Array of parsed NLP results
   */
  private async parseTranscription(
    transcription: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    recentCommands: Array<RecentCommand>
  ): Promise<NlpResult[]> {
    if (useOpenAI) {
      console.log("🧠 [NLP] Using OpenAI API for NLP processing");
      return await this.processWithOpenAI(
        transcription,
        conversationHistory,
        recentCommands
      );
    } else {
      console.log("🧠 [NLP] ❌ Error: OpenAI API key not found");
      return [];
    }
  }

  /**
   * Merge new NLP result with the existing accumulator
   * @param accumulator - The current command accumulator
   * @param newResult - The new NLP result to merge
   * @returns Updated command accumulator
   */
  private mergeWithAccumulator(
    accumulator: CommandAccumulator,
    newResult: NlpResult
  ): CommandAccumulator {
    return {
      action: newResult.action || accumulator.action,
      item: newResult.item || accumulator.item,
      quantity: newResult.quantity !== undefined
        ? newResult.quantity
        : accumulator.quantity,
      unit: newResult.unit || accumulator.unit,
      timestamp: Date.now(),
    };
  }

  /**
   * Check if the command accumulator has enough information to be complete
   * @param accumulator - The command accumulator to check
   * @returns True if the command is complete, false otherwise
   */
  private isCommandComplete(accumulator: CommandAccumulator): boolean {
    const { action, item, quantity, unit } = accumulator;
    
    if (action === "undo") {
      return true; // Undo commands are always complete
    }
    
    if (action === "set") {
      return Boolean(item && quantity !== undefined && unit);
    }
    
    if (["add", "remove"].includes(action)) {
      return Boolean(item && quantity !== undefined);
    }
    
    return false;
  }

  /**
   * Calculate confidence based on the current state of the accumulator
   * @param accumulator - The command accumulator
   * @returns Confidence level (0 to 1)
   */
  private calculateConfidence(accumulator: CommandAccumulator): number {
    const { action, item, quantity } = accumulator;
    
    if (action === "undo") {
      return 0.95; // Undo commands have high confidence
    }
    
    if (action && item && quantity !== undefined) {
      return 0.8; // High confidence for almost complete commands
    }
    
    if (action && item) {
      return 0.6; // Medium confidence for action and item
    }
    
    if (action) {
      return 0.45; // Low confidence for just the action
    }
    
    return 0.3; // Very low confidence for unknown or empty
  }

  /**
   * Process transcription using OpenAI API
   * @param transcription - The transcription to process
   * @param conversationHistory - Conversation history for context
   * @param recentCommands - Recent commands for context
   * @returns Array of extracted inventory commands
   */
  private async processWithOpenAI(
    transcription: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    recentCommands: Array<RecentCommand>
  ): Promise<NlpResult[]> {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a natural language processor for an inventory management system. Your task is to extract one or more inventory commands from the user's input. Each command should have:

action: 'add', 'remove', 'set', or 'undo' (empty string if not found)
item: the item name, including any specified attributes like size (return an empty string if not found)
quantity: a positive number if specified, undefined if not found
unit: standard unit e.g., 'gallons', 'pounds', 'bags', 'boxes' (empty string if not found)
confidence: 0 to 1 (0.95 for complete, 0.8 for action+item, 0.6 for partial)

If the user says 'more' or 'another X', infer the item and unit from the last mentioned command in the history. 
For 'undo' or 'revert last', return [{"action": "undo", "isComplete": true, "confidence": 0.95}].
If the input isn't an inventory command, return [].

IMPORTANT RULES:
1. For statements about CURRENT inventory levels, ALWAYS use action: 'set'. Examples:
   - "We have 30 gallons of whole milk" → action: 'set'
   - "30 gallons of whole milk" → action: 'set'
   - "There is 5 pounds of coffee" → action: 'set'
   - "We have 20 boxes of tea" → action: 'set'
2. Only use 'add' when explicitly adding to inventory
3. Only use 'remove' when explicitly removing from inventory
4. When attributes like size are mentioned, include them in the item name. For example:
   - "We have 60 bags of 12 ounce paper cups" → item: "12 ounce paper cups"
   - "Add 10 boxes of large coffee filters" → item: "large coffee filters"
5. If the input has a structure like "X units of Y item", treat it as a single command.
6. If the input lists multiple "X units of Y item" separated by "and" or commas, treat them as separate commands.
7. Fill in missing details from the conversation history when possible.
8. If the input is not a command or if it's out of scope, return an empty array.

Examples:
Input: "We have 30 gallons of whole milk"
Output: [{"action": "set", "item": "whole milk", "quantity": 30, "unit": "gallons", "confidence": 0.95, "isComplete": true}]

Input: "Add 5 gallons of milk"
Output: [{"action": "add", "item": "milk", "quantity": 5, "unit": "gallons", "confidence": 0.95, "isComplete": true}]

Input: "undo"
Output: [{"action": "undo", "item": "", "quantity": undefined, "unit": "", "confidence": 0.95, "isComplete": true}]

Return a JSON object with a 'commands' array containing the parsed commands.`,
            },
            {
              role: "user",
              content: `Transcription: ${transcription}
Recent Commands: ${JSON.stringify(recentCommands)}
Conversation History: ${JSON.stringify(conversationHistory)}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 150,
          response_format: { type: "json_object" },
        },
        {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Log the raw content for debugging
      const content = response.data.choices[0].message.content;
      console.log("🧠 [NLP] OpenAI response content:", content);

      let results = [];
      try {
        const parsed: { commands: NlpResult[] } = JSON.parse(content);
        results = parsed.commands || [];
        
        // Handle legacy format (when response is directly an array)
        if (Array.isArray(parsed) && !parsed.commands) {
          results = parsed;
        }
      } catch (parseError) {
        console.error("🧠 [NLP] Error parsing OpenAI response:", parseError);
        console.error("🧠 [NLP] Raw response:", content);
        return [];
      }

      // Map the results to the NlpResult type
      return results.map((result: NlpResult) => {
        console.log("🧠 [NLP] Processing result:", result);
        
        // Convert OpenAI result to NlpResult format
        const nlpResult: NlpResult = {
          action: result.action || "add" as "add" | "remove" | "set",
          item: result.item || "",
          quantity: result.quantity,
          unit: result.unit || "",
          confidence: result.confidence || 0.6,
          isComplete: false,
        };
        
        // Check if command is complete
        nlpResult.isComplete = this.isCommandComplete({
          action: nlpResult.action,
          item: nlpResult.item,
          quantity: nlpResult.quantity ? nlpResult.quantity : undefined,
          unit: nlpResult.unit,
          timestamp: Date.now(),
        });
        
        return nlpResult; 
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("🧠 [NLP] Error with OpenAI API:", error.response?.data || error.message);
      } else {
        console.error("🧠 [NLP] Error with OpenAI API:", error);
      }
      return [];
    }
  }
}