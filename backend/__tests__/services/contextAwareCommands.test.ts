import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterEach,
} from "@jest/globals";
import { RecentCommand, NlpResult } from "@/types";

const mockProcessTranscription = jest.fn();

jest.mock("@/services/speech/nlpService", () => {
  return {
    NlpService: jest.fn().mockImplementation(() => {
      return {
        processTranscription: mockProcessTranscription,
      };
    }),
  };
});

import { NlpService } from "@/services/speech/nlpService";

describe("Context-Aware Command Processing", () => {
  let nlpService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    nlpService = new NlpService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Using Conversation History", () => {
    it('should complete commands with "more" using conversation history', async () => {
      const mockResult: NlpResult[] = [
        {
          action: "add",
          item: "milk",
          quantity: 5,
          unit: "gallons",
          confidence: 0.9,
          isComplete: true,
        },
      ];

      (mockProcessTranscription as any).mockResolvedValue(mockResult);

      const conversationHistory = [
        { role: "user" as const, content: "add 10 gallons of milk" },
        {
          role: "assistant" as const,
          content: "Added 10 gallons of milk to inventory",
        },
      ];
      const emptyRecentCommands: RecentCommand[] = [];

      const results = await nlpService.processTranscription(
        "add 5 more",
        conversationHistory,
        emptyRecentCommands
      );

      expect(results).toHaveLength(1);
      expect((results as any)[0]).toEqual({
        action: "add",
        item: "milk",
        quantity: 5,
        unit: "gallons",
        confidence: 0.9,
        isComplete: true,
      });

      expect(mockProcessTranscription).toHaveBeenCalledWith(
        "add 5 more",
        conversationHistory,
        emptyRecentCommands
      );
    });

    it("should handle multi-part commands with context", async () => {
      const firstMockResult: NlpResult[] = [
        {
          action: "set",
          item: "coffee",
          quantity: undefined,
          unit: "",
          confidence: 0.7,
          isComplete: false,
        },
      ];

      const secondMockResult: NlpResult[] = [
        {
          action: "set",
          item: "coffee",
          quantity: 15,
          unit: "pounds",
          confidence: 0.95,
          isComplete: true,
        },
      ];

      (mockProcessTranscription as any).mockResolvedValueOnce(firstMockResult);
      (mockProcessTranscription as any).mockResolvedValueOnce(secondMockResult);

      const conversationHistory = [
        { role: "user" as const, content: "we need to order more coffee" },
        {
          role: "assistant" as const,
          content: "Would you like to update the coffee inventory?",
        },
      ];
      const emptyRecentCommands: RecentCommand[] = [];

      const firstResults = await nlpService.processTranscription(
        "set coffee to",
        conversationHistory,
        emptyRecentCommands
      );

      expect(firstResults).toHaveLength(1);
      expect((firstResults as any)[0].isComplete).toBe(false);
      expect((firstResults as any)[0].action).toBe("set");
      expect((firstResults as any)[0].item).toBe("coffee");

      const secondResults = await nlpService.processTranscription(
        "15 pounds",
        conversationHistory,
        emptyRecentCommands
      );

      expect(secondResults).toHaveLength(1);
      expect((secondResults as any)[0].isComplete).toBe(true);
      expect((secondResults as any)[0].action).toBe("set");
      expect((secondResults as any)[0].item).toBe("coffee");
      expect((secondResults as any)[0].quantity).toBe(15);
      expect((secondResults as any)[0].unit).toBe("pounds");
    });
  });

  describe("Using Recent Commands", () => {
    it("should use recent commands to resolve ambiguous references", async () => {
      const mockResult: NlpResult[] = [
        {
          action: "add",
          item: "sugar",
          quantity: 5,
          unit: "pounds",
          confidence: 0.9,
          isComplete: true,
        },
      ];

      (mockProcessTranscription as any).mockResolvedValue(mockResult);

      const emptyConversationHistory: Array<{
        role: "user" | "assistant";
        content: string;
      }> = [];
      const recentCommands: RecentCommand[] = [
        {
          action: "add",
          item: "sugar",
          quantity: 10,
          unit: "pounds",
          timestamp: Date.now() - 60000, // 1 minute ago
        },
      ];

      const results = await nlpService.processTranscription(
        "add 5 more of the same",
        emptyConversationHistory,
        recentCommands
      );

      expect(results).toHaveLength(1);
      expect((results as any)[0]).toEqual({
        action: "add",
        item: "sugar",
        quantity: 5,
        unit: "pounds",
        confidence: 0.9,
        isComplete: true,
      });

      expect(mockProcessTranscription).toHaveBeenCalledWith(
        "add 5 more of the same",
        emptyConversationHistory,
        recentCommands
      );
    });

    it("should handle relative quantity references", async () => {
      const mockResult: NlpResult[] = [
        {
          action: "add",
          item: "napkins",
          quantity: 10,
          unit: "boxes",
          confidence: 0.9,
          isComplete: true,
        },
      ];

      (mockProcessTranscription as any).mockResolvedValue(mockResult);

      const emptyConversationHistory: Array<{
        role: "user" | "assistant";
        content: string;
      }> = [];
      const recentCommands: RecentCommand[] = [
        {
          action: "set",
          item: "napkins",
          quantity: 20,
          unit: "boxes",
          timestamp: Date.now() - 30000, // 30 seconds ago
        },
      ];

      const results = await nlpService.processTranscription(
        "add 10 more boxes",
        emptyConversationHistory,
        recentCommands
      );

      expect(results).toHaveLength(1);
      expect((results as any)[0]).toEqual({
        action: "add",
        item: "napkins",
        quantity: 10,
        unit: "boxes",
        confidence: 0.9,
        isComplete: true,
      });
    });
  });

  describe("Handling Ambiguous Commands", () => {
    it("should handle incomplete commands by inferring missing parts", async () => {
      const mockResult: NlpResult[] = [
        {
          action: "add",
          item: "milk",
          quantity: 3,
          unit: "gallons",
          confidence: 0.9,
          isComplete: true,
        },
      ];

      (mockProcessTranscription as any).mockResolvedValue(mockResult);

      const conversationHistory = [
        { role: "user" as const, content: "how much milk do we have?" },
        {
          role: "assistant" as const,
          content: "You have 5 gallons of milk in inventory",
        },
      ];
      const recentCommands: RecentCommand[] = [
        {
          action: "add",
          item: "milk",
          quantity: 5,
          unit: "gallons",
          timestamp: Date.now() - 120000, // 2 minutes ago
        },
      ];

      const results = await nlpService.processTranscription(
        "add 3 more",
        conversationHistory,
        recentCommands
      );

      expect(results).toHaveLength(1);
      expect((results as any)[0]).toEqual({
        action: "add",
        item: "milk",
        quantity: 3,
        unit: "gallons",
        confidence: 0.9,
        isComplete: true,
      });
    });
  });
});
