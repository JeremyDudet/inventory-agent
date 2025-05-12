import { jest, describe, it, expect } from "@jest/globals";
import { NlpService } from "@/services/speech/nlpService";
import { NlpResult } from "@/types";
import { MockInventoryRepository } from "../mocks/inventoryRepository";

describe("Mock Utilities", () => {
  it("should export mock creation functions", () => {
    expect(typeof createMockNlpService).toBe("function");
    expect(typeof createMockInventoryRepository).toBe("function");
    expect(typeof createMockWebSocket).toBe("function");
  });
});

/**
 * Create a mock NLP service with configurable response
 */
export const createMockNlpService = (results: NlpResult[] = []) => {
  const mockNlpService = {
    processTranscription: jest.fn(async () => results),
    setContextProvider: jest.fn(),
  } as unknown as jest.Mocked<NlpService>;
  return mockNlpService;
};

/**
 * Create a mock inventory repository populated with test items
 */
export const createMockInventoryRepository = (items: any[] = []) => {
  const mockRepo = new MockInventoryRepository();

  items.forEach((item) => mockRepo.addTestItem(item));

  return mockRepo;
};

/**
 * Create a mock WebSocket client
 */
export const createMockWebSocket = () => ({
  send: jest.fn(),
  on: jest.fn(),
  close: jest.fn(),
});
