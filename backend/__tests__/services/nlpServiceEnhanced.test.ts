import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { NlpService } from "@/services/speech/nlpService";
import { NlpResult } from "@/types/nlp";
import { createNlpResult } from "../utils/testFixtures";
import { MockSessionStateService } from "../mocks/sessionStateService";
import { RecentCommand } from "@/types/session";
import { ContextProvider } from "@/types/context";

jest.mock("axios", () => ({
  post: jest.fn(),
}));

jest.mock("@/config/env", () => ({
  OPENAI_API_KEY: "mock-api-key",
}));

describe("Enhanced NlpService Tests", () => {
  let nlpService: NlpService;
  let mockAxios: any;
  let mockSessionState: MockSessionStateService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxios = require("axios").post;

    nlpService = new NlpService();

    mockSessionState = new MockSessionStateService();

    mockAxios.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify([
                createNlpResult({
                  action: "add",
                  item: "milk",
                  quantity: 5,
                  unit: "gallons",
                  confidence: 0.95,
                  isComplete: true,
                }),
              ]),
            },
          },
        ],
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("processTranscription", () => {
    it("should process a simple command correctly", async () => {
      const transcription = "add 5 gallons of milk";
      const conversationHistory: {
        role: "user" | "assistant";
        content: string;
      }[] = [];
      const recentCommands: RecentCommand[] = [];

      const results = await nlpService.processTranscription(
        transcription,
        conversationHistory,
        recentCommands
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(
        expect.objectContaining({
          action: "add",
          item: "milk",
          quantity: 5,
          unit: "gallons",
          confidence: 0.95,
          isComplete: true,
        })
      );

      expect(mockAxios).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining(transcription),
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it("should handle multiple commands in a single transcription", async () => {
      const transcription =
        "add 5 gallons of milk and remove 2 boxes of cereal";

      mockAxios.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify([
                  createNlpResult({
                    action: "add",
                    item: "milk",
                    quantity: 5,
                    unit: "gallons",
                    confidence: 0.95,
                    isComplete: true,
                  }),
                  createNlpResult({
                    action: "remove",
                    item: "cereal",
                    quantity: 2,
                    unit: "boxes",
                    confidence: 0.92,
                    isComplete: true,
                  }),
                ]),
              },
            },
          ],
        },
      });

      const results = await nlpService.processTranscription(
        transcription,
        [],
        []
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(
        expect.objectContaining({
          action: "add",
          item: "milk",
          quantity: 5,
          unit: "gallons",
        })
      );
      expect(results[1]).toEqual(
        expect.objectContaining({
          action: "remove",
          item: "cereal",
          quantity: 2,
          unit: "boxes",
        })
      );
    });

    it("should handle incomplete commands", async () => {
      const transcription = "add some";

      mockAxios.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify([
                  createNlpResult({
                    action: "add",
                    item: "",
                    quantity: 0,
                    unit: "",
                    confidence: 0.45,
                    isComplete: false,
                  }),
                ]),
              },
            },
          ],
        },
      });

      const results = await nlpService.processTranscription(
        transcription,
        [],
        []
      );

      expect(results).toHaveLength(1);
      expect(results[0].action).toBe("add");
      expect(results[0].isComplete).toBe(false);
      expect(results[0].confidence).toBeLessThan(0.5);
    });

    it("should use conversation history for context", async () => {
      const transcription = "make it 10";
      const conversationHistory: {
        role: "user" | "assistant";
        content: string;
      }[] = [
        { role: "user", content: "add 5 gallons of milk" },
        { role: "assistant", content: "Added 5 gallons of milk" },
      ];
      const recentCommands: RecentCommand[] = [
        {
          action: "add",
          item: "milk",
          quantity: 5,
          unit: "gallons",
          timestamp: Date.now(),
        },
      ];

      mockAxios.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify([
                  createNlpResult({
                    action: "update",
                    item: "milk",
                    quantity: 10,
                    unit: "gallons",
                    confidence: 0.9,
                    isComplete: true,
                  }),
                ]),
              },
            },
          ],
        },
      });

      const results = await nlpService.processTranscription(
        transcription,
        conversationHistory,
        recentCommands
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(
        expect.objectContaining({
          action: "update",
          item: "milk",
          quantity: 10,
          unit: "gallons",
        })
      );

      expect(mockAxios).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("add 5 gallons of milk"),
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it("should handle API errors gracefully", async () => {
      const transcription = "add 5 gallons of milk";

      mockAxios.mockRejectedValue(new Error("API Error"));

      const results = await nlpService.processTranscription(
        transcription,
        [],
        []
      );
      expect(results).toEqual([]);
    });

    it("should handle invalid JSON responses", async () => {
      const transcription = "add 5 gallons of milk";

      mockAxios.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: "This is not valid JSON",
              },
            },
          ],
        },
      });

      const results = await nlpService.processTranscription(
        transcription,
        [],
        []
      );
      expect(results).toEqual([]);
    });

    it("should use context provider when set", async () => {
      const transcription = "add 5 gallons of milk";

      const mockGetConversationHistory = jest.fn();
      const mockGetRecentCommands = jest.fn();
      const mockAddToHistory = jest.fn();
      const mockAddCommand = jest.fn();

      mockGetConversationHistory.mockReturnValue([
        { role: "user", content: "What do we have in stock?" },
        { role: "assistant", content: "We have milk, eggs, and bread." },
      ]);
      mockGetRecentCommands.mockReturnValue([]);

      const mockContextProvider = {
        getConversationHistory: mockGetConversationHistory,
        getRecentCommands: mockGetRecentCommands,
        addToHistory: mockAddToHistory,
        addCommand: mockAddCommand,
      };

      nlpService.setContextProvider(
        mockContextProvider as unknown as ContextProvider
      );

      await nlpService.processTranscription(transcription, [], []);

      expect(mockGetConversationHistory).toHaveBeenCalled();

      expect(mockAxios).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("What do we have in stock?"),
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it("should handle empty transcriptions", async () => {
      const transcription = "";

      mockAxios.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify([]),
              },
            },
          ],
        },
      });

      const results = await nlpService.processTranscription(
        transcription,
        [],
        []
      );

      expect(results).toEqual([]);
    });

    it("should handle unrecognized actions", async () => {
      const transcription = "do something weird";

      mockAxios.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify([
                  {
                    action: "unknown_action",
                    item: "something",
                    quantity: null,
                    unit: null,
                    confidence: 0.8,
                    isComplete: false,
                  },
                ]),
              },
            },
          ],
        },
      });

      const results = await nlpService.processTranscription(
        transcription,
        [],
        []
      );

      expect(results).toHaveLength(1);
      expect(results[0].action).toBe("unknown_action");
    });
  });
});
