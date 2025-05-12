import { logTranscript } from "@/services/session/sessionLogsService";
import { createTranscriptLog } from "@/types";

// Mock the SessionLog model
jest.mock("@/models/SessionLog", () => ({
  createTranscriptLog: jest.fn(),
}));

describe("sessionLogsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("logTranscript", () => {
    it("should successfully log a transcript with a valid UUID user ID", async () => {
      const validUserId = "123e4567-e89b-12d3-a456-426614174000";
      const text = "Test transcript";
      const isFinal = true;
      const confidence = 0.95;

      (createTranscriptLog as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      const result = await logTranscript(
        text,
        isFinal,
        confidence,
        validUserId
      );

      expect(result.success).toBe(true);
      const callArgs = (createTranscriptLog as jest.Mock).mock.calls[0][0];
      expect(callArgs).toMatchObject({
        userId: validUserId,
        text,
        isFinal,
        confidence,
      });
      expect(callArgs.sessionId).toBeDefined();
      expect(callArgs.timestamp).toBeDefined();
    });

    it("should handle non-UUID user IDs by omitting the user ID field", async () => {
      const nonUuidUserId = "H__c_pawMJwLP6u9AAAI";
      const text = "Test transcript";
      const isFinal = true;
      const confidence = 0.95;

      (createTranscriptLog as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      const result = await logTranscript(
        text,
        isFinal,
        confidence,
        nonUuidUserId
      );

      expect(result.success).toBe(true);
      const callArgs = (createTranscriptLog as jest.Mock).mock.calls[0][0];
      expect(callArgs).toMatchObject({
        text,
        isFinal,
        confidence,
      });
      expect(callArgs.sessionId).toBeDefined();
      expect(callArgs.timestamp).toBeDefined();
      expect(callArgs).not.toHaveProperty("userId");
    });

    it("should handle database errors gracefully", async () => {
      const text = "Test transcript";
      const isFinal = true;
      const confidence = 0.95;

      (createTranscriptLog as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      const result = await logTranscript(text, isFinal, confidence);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
