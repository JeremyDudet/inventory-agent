// backend/src/services/sessionStateContextProvider.ts
import { ContextProvider } from "@/types";
import { RecentCommand } from "@/types";
import { SessionStateService } from "./sessionStateService";

/**
 * Implementation of ContextProvider using SessionStateService
 */
export class SessionStateContextProvider implements ContextProvider {
  constructor(private sessionStateService: SessionStateService) {}

  /**
   * Get the conversation history from the session state
   */
  getConversationHistory(): Array<{
    role: "user" | "assistant";
    content: string;
  }> {
    return this.sessionStateService.getState().conversationHistory;
  }

  /**
   * Get the recent commands from the session state
   */
  getRecentCommands(): Array<RecentCommand> {
    return this.sessionStateService.getRecentCommands();
  }

  /**
   * Add a user message to the conversation history
   */
  addToHistory(role: "user" | "assistant", content: string): void {
    if (role === "user") {
      this.sessionStateService.addUserMessage(content);
    } else {
      this.sessionStateService.addAssistantMessage(content);
    }
  }

  /**
   * Add a command to the recent commands
   */
  addCommand(command: RecentCommand): void {
    this.sessionStateService.addRecentCommand(command);
  }
}
