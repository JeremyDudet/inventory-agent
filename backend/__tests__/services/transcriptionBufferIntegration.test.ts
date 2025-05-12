import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import TranscriptionBuffer from "@/services/speech/transcriptionBuffer";
import { NlpService } from "@/services/speech/nlpService";
import { NlpResult } from "@/types";
import { SessionStateService } from "@/services/session/sessionStateService";

type ProcessTranscriptionFn = (
  transcription: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  recentCommands: Array<any>
) => Promise<NlpResult[]>;

jest.mock("@/services/speech/nlpService", () => {
  return {
    NlpService: jest.fn().mockImplementation(() => ({
      processTranscription: jest.fn<ProcessTranscriptionFn>(),
    })),
  };
});

jest.mock("@/services/session/sessionStateService", () => {
  return {
    SessionStateService: jest.fn().mockImplementation(() => ({
      getState: jest.fn().mockReturnValue({
        conversationHistory: [],
        recentCommands: [],
      }),
      getRecentCommands: jest.fn().mockReturnValue([]),
    })),
  };
});

describe("TranscriptionBuffer Integration Tests", () => {
  let nlpService: NlpService;
  let sessionState: SessionStateService;
  let transcriptionBuffer: TranscriptionBuffer;
  let mockProcessTranscription: jest.Mock<ProcessTranscriptionFn>;

  const mockResult: NlpResult = {
    action: "add",
    item: "test item",
    quantity: 1,
    unit: "units",
    confidence: 0.9,
    isComplete: true,
    type: undefined,
  };

  beforeEach(() => {
    nlpService = new NlpService();
    sessionState = new SessionStateService();
    mockProcessTranscription =
      nlpService.processTranscription as jest.Mock<ProcessTranscriptionFn>;
    mockProcessTranscription.mockImplementation(async (transcription) => [
      mockResult,
    ]);
    transcriptionBuffer = new TranscriptionBuffer(nlpService, sessionState);
    jest.clearAllMocks();
  });

  it("should process command through NLP and clear buffer when complete", async () => {
    const result: NlpResult = {
      action: "add",
      item: "coffee",
      quantity: 5,
      unit: "pounds",
      confidence: 0.9,
      isComplete: true,
      type: undefined,
    };
    mockProcessTranscription.mockResolvedValueOnce([result]);

    transcriptionBuffer.addTranscription("add 5 pounds of coffee");
    const buffer = transcriptionBuffer.getCurrentBuffer();
    const emptyConversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];
    const emptyRecentCommands: Array<any> = [];
    const nlpResults = await nlpService.processTranscription(
      buffer,
      emptyConversationHistory,
      emptyRecentCommands
    );

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenCalledWith(
      "add 5 pounds of coffee",
      expect.any(Array),
      expect.any(Array)
    );
    expect(transcriptionBuffer.getCurrentBuffer()).toBe("");
  });

  it("should retain buffer content when command is incomplete", async () => {
    const result: NlpResult = {
      action: "add",
      item: "",
      quantity: 5,
      unit: "pounds",
      confidence: 0.8,
      isComplete: false,
      type: undefined,
    };
    mockProcessTranscription.mockResolvedValueOnce([result]);

    transcriptionBuffer.addTranscription("add 5 pounds of");
    const buffer = transcriptionBuffer.getCurrentBuffer();
    const emptyConversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];
    const emptyRecentCommands: Array<any> = [];
    const nlpResults = await nlpService.processTranscription(
      buffer,
      emptyConversationHistory,
      emptyRecentCommands
    );

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenCalledWith(
      "add 5 pounds of",
      expect.any(Array),
      expect.any(Array)
    );
    expect(transcriptionBuffer.getCurrentBuffer()).toBe("add 5 pounds of");
  });

  it("should combine multiple transcriptions into a complete command", async () => {
    const incompleteResult: NlpResult = {
      action: "add",
      item: "",
      quantity: 5,
      unit: "pounds",
      confidence: 0.8,
      isComplete: false,
      type: undefined,
    };
    const completeResult: NlpResult = {
      action: "add",
      item: "coffee",
      quantity: 5,
      unit: "pounds",
      confidence: 0.9,
      isComplete: true,
      type: undefined,
    };
    mockProcessTranscription
      .mockImplementationOnce(async () => [incompleteResult])
      .mockImplementationOnce(async () => [completeResult]);

    transcriptionBuffer.addTranscription("add 5 pounds of");
    let buffer = transcriptionBuffer.getCurrentBuffer();
    const emptyConversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];
    const emptyRecentCommands: Array<any> = [];
    let nlpResults = await nlpService.processTranscription(
      buffer,
      emptyConversationHistory,
      emptyRecentCommands
    );

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenNthCalledWith(
      1,
      "add 5 pounds of",
      expect.any(Array),
      expect.any(Array)
    );
    expect(transcriptionBuffer.getCurrentBuffer()).toBe("add 5 pounds of");

    transcriptionBuffer.addTranscription("coffee");
    buffer = transcriptionBuffer.getCurrentBuffer();
    nlpResults = await nlpService.processTranscription(
      buffer,
      emptyConversationHistory,
      emptyRecentCommands
    );

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenNthCalledWith(
      2,
      "add 5 pounds of coffee",
      expect.any(Array),
      expect.any(Array)
    );
    expect(transcriptionBuffer.getCurrentBuffer()).toBe("");
  });

  it("should handle split set commands correctly", async () => {
    const incompleteResult: NlpResult = {
      action: "set",
      item: "16 ounce paper cups",
      quantity: 0,
      unit: "",
      confidence: 0.7,
      isComplete: false,
      type: undefined,
    };
    const completeResult: NlpResult = {
      action: "set",
      item: "paper cups",
      quantity: 30,
      unit: "sleeves",
      confidence: 0.9,
      isComplete: true,
      type: undefined,
    };
    mockProcessTranscription
      .mockImplementationOnce(async () => [incompleteResult])
      .mockImplementationOnce(async () => [completeResult]);

    transcriptionBuffer.addTranscription("Set the 16 ounce paper cups");
    let buffer = transcriptionBuffer.getCurrentBuffer();
    const emptyConversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];
    const emptyRecentCommands: Array<any> = [];
    let nlpResults = await nlpService.processTranscription(
      buffer,
      emptyConversationHistory,
      emptyRecentCommands
    );

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription).toHaveBeenNthCalledWith(
      1,
      "Set the 16 ounce paper cups",
      expect.any(Array),
      expect.any(Array)
    );
    expect(transcriptionBuffer.getCurrentBuffer()).toBe(
      "Set the 16 ounce paper cups"
    );

    transcriptionBuffer.addTranscription("to 30 sleeves");
    buffer = transcriptionBuffer.getCurrentBuffer();
    nlpResults = await nlpService.processTranscription(
      buffer,
      emptyConversationHistory,
      emptyRecentCommands
    );

    if (nlpResults[0].isComplete) {
      transcriptionBuffer.clearBuffer();
    }

    expect(mockProcessTranscription.mock.calls[1][0]).toBe(
      "Set the 16 ounce paper cups to 30 sleeves"
    );
    expect(transcriptionBuffer.getCurrentBuffer()).toBe("");
  });
});
