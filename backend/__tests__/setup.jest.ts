import dotenv from "dotenv";
import { initializeSupabase } from "@/config/db";
import { createClient } from "@supabase/supabase-js";
import { describe, it, expect, jest } from "@jest/globals";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Mock Supabase client
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
  }),
}));

// Global test setup
global.beforeAll(async () => {
  // Initialize Supabase with test configuration
  await initializeSupabase();

  // Set test environment
  process.env.NODE_ENV = "test";

  // Mock console methods to reduce noise during tests
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

// Clean up after each test
global.afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset Supabase client mock
  (createClient as jest.Mock).mockClear();
});

// Global test teardown
global.afterAll(async () => {
  // Clean up any test data or connections
  jest.resetAllMocks();

  // Restore console methods
  jest.restoreAllMocks();
});

// Global test timeout
jest.setTimeout(10000); // 10 seconds

// Suppress specific console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Warning: ReactDOM.render is no longer supported")
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

describe("Jest Setup", () => {
  it("should set up environment variables for testing", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });

  it("should mock Supabase client correctly", () => {
    expect(createClient).toBeDefined();
    expect(jest.isMockFunction(createClient)).toBe(true);
  });
});
