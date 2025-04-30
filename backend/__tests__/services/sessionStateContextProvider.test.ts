import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { SessionStateContextProvider } from "@/services/session/sessionStateContextProvider";
import { SessionStateService } from "@/services/session/sessionStateService";
import { RecentCommand } from "@/types/session";

describe("SessionStateContextProvider", () => {
  let sessionStateService: SessionStateService;
  let contextProvider: SessionStateContextProvider;

  beforeEach(() => {
    sessionStateService = new SessionStateService();
    contextProvider = new SessionStateContextProvider(sessionStateService);
  });

  describe("getConversationHistory", () => {
    it("should return the conversation history from the session state", () => {
      const mockHistory = [
        { role: "user" as const, content: "add 5 pounds of coffee" },
        { role: "assistant" as const, content: "Added 5 pounds of coffee" },
      ];
      sessionStateService.setState({
        ...sessionStateService.getState(),
        conversationHistory: mockHistory,
      });

      const result = contextProvider.getConversationHistory();

      expect(result).toEqual(mockHistory);
    });
  });

  describe("getRecentCommands", () => {
    it("should return recent commands from the session state", () => {
      const mockCommands: RecentCommand[] = [
        {
          action: "add",
          item: "coffee",
          quantity: 5,
          unit: "pounds",
          timestamp: Date.now(),
        },
      ];

      jest
        .spyOn(sessionStateService, "getRecentCommands")
        .mockReturnValue(mockCommands);

      const result = contextProvider.getRecentCommands();

      expect(result).toEqual(mockCommands);
      expect(sessionStateService.getRecentCommands).toHaveBeenCalled();
    });
  });

  describe("addToHistory", () => {
    it("should add a user message to history", () => {
      const spy = jest.spyOn(sessionStateService, "addUserMessage");

      contextProvider.addToHistory("user", "Hello");

      expect(spy).toHaveBeenCalledWith("Hello");
    });

    it("should add an assistant message to history", () => {
      const spy = jest.spyOn(sessionStateService, "addAssistantMessage");

      contextProvider.addToHistory("assistant", "Hello back");

      expect(spy).toHaveBeenCalledWith("Hello back");
    });
  });

  describe("addCommand", () => {
    it("should add a command to recent commands", () => {
      const command: RecentCommand = {
        action: "add",
        item: "coffee",
        quantity: 5,
        unit: "pounds",
        timestamp: Date.now(),
      };
      const spy = jest.spyOn(sessionStateService, "addRecentCommand");

      contextProvider.addCommand(command);

      expect(spy).toHaveBeenCalledWith(command);
    });
  });
});
