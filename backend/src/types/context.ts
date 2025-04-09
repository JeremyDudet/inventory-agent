import { RecentCommand } from "./session";

/**
 * Interface for providing conversation context to NLP services
 */
export interface ContextProvider {
  /**
   * Get the conversation history for context
   * @returns Array of conversation entries with role and content
   */
  getConversationHistory(): Array<{ role: "user" | "assistant"; content: string }>;
  
  /**
   * Get recent commands for context
   * @returns Array of recent commands
   */
  getRecentCommands(): Array<RecentCommand>;
  
  /**
   * Add an entry to the conversation history
   * @param role The role of the message sender (user or assistant)
   * @param content The message content
   */
  addToHistory(role: "user" | "assistant", content: string): void;
  
  /**
   * Add a command to the recent commands list
   * @param command The command to add
   */
  addCommand(command: RecentCommand): void;
}
