import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import TranscriptionBuffer from "@/services/speech/transcriptionBuffer";
import { NlpService } from "@/services/speech/nlpService";
import { SessionStateService } from "@/services/session/sessionStateService";

jest.mock("@/services/speech/nlpService");

describe("TranscriptionBuffer Tests", () => {
  let transcriptionBuffer: TranscriptionBuffer;
  let nlpService: NlpService;
  let sessionState: SessionStateService;
  beforeEach(() => {
    sessionState = new SessionStateService();
    nlpService = new NlpService();
    transcriptionBuffer = new TranscriptionBuffer(nlpService, sessionState);
  });

  describe("buffer functionality", () => {
    it("should initially have an empty buffer", () => {
      expect(transcriptionBuffer.getCurrentBuffer()).toBe("");
    });

    it("should add transcription to buffer", () => {
      transcriptionBuffer.addTranscription("add 5");
      expect(transcriptionBuffer.getCurrentBuffer()).toBe("add 5");
    });

    it("should append transcription to existing buffer with space", () => {
      transcriptionBuffer.addTranscription("add");
      transcriptionBuffer.addTranscription("5 pounds of");
      expect(transcriptionBuffer.getCurrentBuffer()).toBe("add 5 pounds of");
    });

    it("should handle multiple words with proper spacing", () => {
      transcriptionBuffer.addTranscription("add 5");
      transcriptionBuffer.addTranscription("pounds of");
      transcriptionBuffer.addTranscription("coffee");
      expect(transcriptionBuffer.getCurrentBuffer()).toBe(
        "add 5 pounds of coffee"
      );
    });

    it("should trim whitespace from transcriptions", () => {
      transcriptionBuffer.addTranscription("  add  ");
      transcriptionBuffer.addTranscription("  5 pounds  ");
      expect(transcriptionBuffer.getCurrentBuffer()).toBe("add 5 pounds");
    });

    it("should ignore empty transcriptions", () => {
      transcriptionBuffer.addTranscription("add 5");
      transcriptionBuffer.addTranscription("");
      transcriptionBuffer.addTranscription("  ");
      expect(transcriptionBuffer.getCurrentBuffer()).toBe("add 5");
    });

    it("should clear the buffer", () => {
      transcriptionBuffer.addTranscription("add 5 pounds of coffee");
      transcriptionBuffer.clearBuffer();
      expect(transcriptionBuffer.getCurrentBuffer()).toBe("");
    });

    it("should be able to add new content after clearing", () => {
      transcriptionBuffer.addTranscription("add 5 pounds of coffee");
      transcriptionBuffer.clearBuffer();
      transcriptionBuffer.addTranscription("remove 2 bags of sugar");
      expect(transcriptionBuffer.getCurrentBuffer()).toBe(
        "remove 2 bags of sugar"
      );
    });
  });
});
