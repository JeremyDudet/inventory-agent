import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterEach,
} from "@jest/globals";
import { NlpService } from "@/services/speech/nlpService";
import { RecentCommand } from "@/types/session";
import { NlpResult } from "@/types/nlp";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("NLP Context Awareness", () => {
  let nlpService: NlpService;
  const emptyConversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [];
  const emptyRecentCommands: Array<RecentCommand> = [];

  beforeEach(() => {
    nlpService = new NlpService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

  it("should use conversation history to complete relative commands", async () => {
    const conversationHistory = [
      { role: "user" as const, content: "add 10 gallons of milk" },
      {
        role: "assistant" as const,
        content: "Added 10 gallons of milk to inventory",
      },
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

  it("should use recent commands to complete ambiguous commands", async () => {
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
