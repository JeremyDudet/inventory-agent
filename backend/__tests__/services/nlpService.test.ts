// backend/src/__tests__/services/nlpService.test.ts
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import axios from "axios";
import { NlpService } from "@/services/speech/nlpService";
import { RecentCommand } from "@/types/session";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("NlpService", () => {
  let nlpService: NlpService;
  const emptyConversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [];
  const emptyRecentCommands: Array<RecentCommand> = [];

  beforeEach(() => {
    nlpService = new NlpService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  // Helper function to mock OpenAI API responses
  const mockOpenAIResponse = (commands: any[]) => {
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify(commands),
            },
          },
        ],
      },
    });
  };

  it("processes a single complete command", async () => {
    mockOpenAIResponse([
      {
        action: "add",
        item: "milk",
        quantity: 5,
        unit: "gallons",
        confidence: 0.95,
        isComplete: true,
      },
    ]);

    const result = await nlpService.processTranscription(
      "add 5 gallons of milk",
      emptyConversationHistory,
      emptyRecentCommands
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      action: "add",
      item: "milk",
      quantity: 5,
      unit: "gallons",
      confidence: expect.any(Number), // e.g., 0.95,
      isComplete: true,
    });
  });

  it("processes multiple complete commands in a single transcription", async () => {
    mockOpenAIResponse([
      {
        action: "add",
        item: "milk",
        quantity: 5,
        unit: "gallons",
        confidence: 0.95,
        isComplete: true,
      },
      {
        action: "remove",
        item: "coffee",
        quantity: 2,
        unit: "pounds",
        confidence: 0.95,
        isComplete: true,
      },
    ]);

    const result = await nlpService.processTranscription(
      "add 5 gallons of milk and remove 2 pounds of coffee",
      emptyConversationHistory,
      emptyRecentCommands
    );
    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        action: "add",
        item: "milk",
        quantity: 5,
        unit: "gallons",
        confidence: expect.any(Number),
        isComplete: true,
      },
      {
        action: "remove",
        item: "coffee",
        quantity: 2,
        unit: "pounds",
        confidence: expect.any(Number),
        isComplete: true,
      },
    ]);
  });

  it("accumulates partial commands across multiple transcriptions", async () => {
    mockOpenAIResponse([
      {
        action: "set",
        item: "",
        quantity: undefined,
        unit: "",
        confidence: 0.45,
        isComplete: false,
      },
    ]);
    let result = await nlpService.processTranscription(
      "set",
      emptyConversationHistory,
      emptyRecentCommands
    );
    expect(result).toHaveLength(1);
    expect(result[0].isComplete).toBe(false);

    mockOpenAIResponse([
      {
        action: "",
        item: "whole milk",
        quantity: 30,
        unit: "gallons",
        confidence: 0.8,
        isComplete: false,
      },
    ]);
    result = await nlpService.processTranscription(
      "whole milk to 30 gallons",
      emptyConversationHistory,
      emptyRecentCommands
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      action: "set",
      item: "whole milk",
      quantity: 30,
      unit: "gallons",
      confidence: expect.any(Number), // Confidence may vary
      isComplete: true,
    });
  });

  it("processes mixed complete and incomplete commands", async () => {
    mockOpenAIResponse([
      {
        action: "add",
        item: "milk",
        quantity: 5,
        unit: "gallons",
        confidence: 0.95,
        isComplete: true,
      },
      {
        action: "set",
        item: "whole milk",
        quantity: undefined,
        unit: "",
        confidence: 0.6,
        isComplete: false,
      },
    ]);

    const result = await nlpService.processTranscription(
      "add 5 gallons of milk and set whole milk",
      emptyConversationHistory,
      emptyRecentCommands
    );
    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        action: "add",
        item: "milk",
        quantity: 5,
        unit: "gallons",
        confidence: expect.any(Number),
        isComplete: true,
      },
      {
        action: "set",
        item: "whole milk",
        quantity: undefined,
        unit: "",
        confidence: expect.any(Number),
        isComplete: false,
      },
    ]);
  });

  it("resets accumulator after timeout", async () => {
    mockOpenAIResponse([
      {
        action: "set",
        item: "",
        quantity: undefined,
        unit: "",
        confidence: 0.45,
        isComplete: false,
      },
    ]);
    let result = await nlpService.processTranscription(
      "set",
      emptyConversationHistory,
      emptyRecentCommands
    );
    expect(result[0].isComplete).toBe(false);

    jest.advanceTimersByTime(6000); // Advance time by 6 seconds

    mockOpenAIResponse([
      {
        action: "",
        item: "whole milk",
        quantity: 30,
        unit: "gallons",
        confidence: 0.8,
        isComplete: false,
      },
    ]);
    result = await nlpService.processTranscription(
      "whole milk to 30 gallons",
      emptyConversationHistory,
      emptyRecentCommands
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      action: "",
      item: "whole milk",
      quantity: 30,
      unit: "gallons",
      confidence: expect.any(Number),
      isComplete: false,
    });
  });

  it("processes undo commands", async () => {
    mockOpenAIResponse([
      { action: "undo", confidence: 0.95, isComplete: true },
    ]);

    const result = await nlpService.processTranscription(
      "undo",
      emptyConversationHistory,
      emptyRecentCommands
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      action: "undo",
      confidence: expect.any(Number),
      item: "",
      quantity: undefined,
      unit: "",
      isComplete: true,
    });
  });

  it("handles invalid transcriptions gracefully", async () => {
    mockOpenAIResponse([]); // No commands recognized

    const result = await nlpService.processTranscription(
      "this is not a command",
      emptyConversationHistory,
      emptyRecentCommands
    );
    expect(result).toHaveLength(0);
  });

  it('uses conversation history to complete commands with "more"', async () => {
    const conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [
      { role: "user", content: "Add 10 gallons of milk" },
      { role: "assistant", content: "Added 10 gallons of milk" },
    ];

    mockOpenAIResponse([
      {
        action: "add",
        item: "milk",
        quantity: 5,
        unit: "gallons",
        confidence: 0.95,
        isComplete: true,
      },
    ]);

    const result = await nlpService.processTranscription(
      "add 5 more",
      conversationHistory,
      emptyRecentCommands
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      action: "add",
      item: "milk",
      quantity: 5,
      unit: "gallons",
      confidence: expect.any(Number),
      isComplete: true,
    });
  });

  it("uses recent commands to complete ambiguous commands", async () => {
    const recentCommands = [
      {
        action: "add",
        item: "coffee",
        quantity: 10,
        unit: "pounds",
        timestamp: Date.now() - 60000, // 1 minute ago
      },
    ];

    mockOpenAIResponse([
      {
        action: "add",
        item: "coffee",
        quantity: 5,
        unit: "pounds",
        confidence: 0.95,
        isComplete: true,
      },
    ]);

    const result = await nlpService.processTranscription(
      "add 5 more of the same",
      emptyConversationHistory,
      recentCommands
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      action: "add",
      item: "coffee",
      quantity: 5,
      unit: "pounds",
      confidence: expect.any(Number),
      isComplete: true,
    });
  });
});
