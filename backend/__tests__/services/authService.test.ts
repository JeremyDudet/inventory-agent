// backend/__tests__/services/authService.test.ts
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock implementations
let mockSelect: any;
let mockFrom: any;
let mockWhere: any;
let mockLimit: any;
let mockInsert: any;
let mockValues: any;
let mockReturning: any;
let mockUpdate: any;
let mockSet: any;
let mockInnerJoin: any;
let mockLeftJoin: any;

interface MockInviteCode {
  id: string;
  code: string;
  role: string;
  created_by: string;
  expires_at: string;
  created_at: string;
  used_by: string | null;
  used_at: string | null;
}

// Create the mock db object
const mockDb = {
  select: jest.fn(() => mockDb),
  from: jest.fn(() => mockDb),
  where: jest.fn(() => mockDb),
  limit: jest.fn(() => mockDb),
  insert: jest.fn(() => mockDb),
  values: jest.fn(() => mockDb),
  returning: jest.fn(() => mockDb),
  update: jest.fn(() => mockDb),
  set: jest.fn(() => mockDb),
  innerJoin: jest.fn(() => mockDb),
  leftJoin: jest.fn(() => mockDb),
} as any;

// Mock Supabase client
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    getUser: jest.fn(),
  },
  rpc: jest.fn().mockReturnThis(),
};

const mockSupabaseAdmin = {
  auth: {
    admin: {
      createUser: jest.fn(),
    },
  },
};

jest.mock("@/db", () => mockDb);
jest.mock("@/config/supabase", () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabaseAdmin,
}));

// Mock Drizzle operators
jest.mock("drizzle-orm", () => ({
  eq: jest.fn((field, value) => ({ type: "eq", field, value })),
  isNull: jest.fn((field) => ({ type: "isNull", field })),
  gt: jest.fn((field, value) => ({ type: "gt", field, value })),
  and: jest.fn((...conditions) => ({ type: "and", conditions })),
}));

import AuthService, { UserPermissions } from "@/services/authService";
import { UserRoleEnum } from "@/types";
import jwt from "jsonwebtoken";
import { createUser } from "../utils/testFixtures";

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock-token"),
  verify: jest.fn(),
  decode: jest.fn(),
}));

jest.mock("@/services/session/sessionLogsService", () => ({
  resetSessionId: jest.fn().mockReturnValue("test-session-id"),
  getSessionId: jest.fn().mockReturnValue("test-session-id"),
  logSystemAction: jest.fn().mockImplementation(() => Promise.resolve()),
}));

process.env.JWT_SECRET = "test-secret";

describe("AuthService", () => {
  let authService: any;

  beforeEach(() => {
    authService = AuthService;
    jest.clearAllMocks();
    
    // Reset the chain returns
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.limit.mockReturnValue(mockDb);
    mockDb.insert.mockReturnValue(mockDb);
    mockDb.values.mockReturnValue(mockDb);
    mockDb.returning.mockReturnValue(mockDb);
    mockDb.update.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    mockDb.innerJoin.mockReturnValue(mockDb);
    mockDb.leftJoin.mockReturnValue(mockDb);
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const mockUser = createUser();
      const mockSessionId = "test-session-id";

      const token = authService.generateToken(mockUser, mockSessionId);

      expect(token).toBe("mock-token");
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          permissions: mockUser.permissions,
          sessionId: mockSessionId,
        }),
        "test-secret",
        expect.any(Object)
      );
    });

    it("should throw error if JWT secret is not configured", () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => {
        authService.generateToken(createUser());
      }).toThrow("JWT secret is not configured");

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", async () => {
      const mockPayload = {
        userId: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        role: UserRoleEnum.STAFF,
        permissions: {
          "inventory:read": true,
          "inventory:write": true,
          "inventory:delete": false,
          "user:read": false,
          "user:write": false,
        },
        sessionId: "test-session-id",
        jti: "test-jwt-id",
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      // Mock isTokenRevoked check - return empty array (not revoked)
      mockDb.limit.mockResolvedValue([]);

      const result = await authService.verifyToken("valid-token");

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
    });

    it("should return null for an invalid token", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = await authService.verifyToken("invalid-token");

      expect(result).toBeNull();
    });

    it("should return null for a revoked token", async () => {
      const mockPayload = {
        userId: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        role: UserRoleEnum.STAFF,
        permissions: {
          "inventory:read": true,
          "inventory:write": true,
          "inventory:delete": false,
          "user:read": false,
          "user:write": false,
        },
        sessionId: "test-session-id",
        jti: "test-jwt-id",
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      // Mock isTokenRevoked check - return a revoked token
      mockDb.limit.mockResolvedValue([{ token_jti: "test-jwt-id" }]);

      const result = await authService.verifyToken("revoked-token");

      expect(result).toBeNull();
    });

    it("should handle tokens without jti claim", async () => {
      const mockPayload = {
        userId: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        role: UserRoleEnum.STAFF,
        permissions: {
          "inventory:read": true,
          "inventory:write": true,
          "inventory:delete": false,
          "user:read": false,
          "user:write": false,
        },
        sessionId: "test-session-id",
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = await authService.verifyToken("legacy-token");

      expect(result).toEqual(mockPayload);
      expect(mockDb.select).not.toHaveBeenCalled();
    });
  });

  describe("authenticateUser", () => {
    it("should return user and token on successful login", async () => {
      const mockUser = createUser();
      const mockSessionId = "test-session-id";

      (mockSupabase.auth.signInWithPassword as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          data: {
            user: {
              id: mockUser.id,
              email: mockUser.email,
              user_metadata: {
                name: mockUser.name,
                role: mockUser.role,
              },
            },
            session: {
              access_token: "supabase-token",
            },
          },
          error: null,
        })
      );

      // Mock getPermissionsForRole
      mockDb.limit.mockResolvedValue([{
        permissions: mockUser.permissions,
      }]);

      const result = await authService.authenticateUser(
        "test@example.com",
        "password"
      );

      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          permissions: mockUser.permissions,
        }),
        token: "mock-token",
        sessionId: expect.any(String),
      });
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
    });

    it("should return null on failed login", async () => {
      (mockSupabase.auth.signInWithPassword as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          data: { user: null, session: null },
          error: { message: "Invalid login credentials" },
        })
      );

      const result = await authService.authenticateUser(
        "test@example.com",
        "wrong-password"
      );

      expect(result).toBeNull();
    });

    it("should handle exceptions during authentication", async () => {
      (mockSupabase.auth.signInWithPassword as jest.Mock).mockImplementation(() => {
        throw new Error("Network error");
      });

      const result = await authService.authenticateUser(
        "test@example.com",
        "password"
      );

      expect(result).toBeNull();
    });
  });

  describe("hasPermission", () => {
    it("should return true when user has the permission", () => {
      const mockUser = createUser({
        permissions: {
          "inventory:read": true,
          "inventory:write": true,
          "inventory:delete": false,
          "user:read": false,
          "user:write": false,
        },
      });

      const result = authService.hasPermission(mockUser, "inventory:write");

      expect(result).toBe(true);
    });

    it("should return false when user does not have the permission", () => {
      const mockUser = createUser({
        permissions: {
          "inventory:read": true,
          "inventory:write": false,
          "inventory:delete": false,
          "user:read": false,
          "user:write": false,
        },
      });

      const result = authService.hasPermission(mockUser, "inventory:write");

      expect(result).toBe(false);
    });

    it("should return false when permission does not exist", () => {
      const mockUser = createUser();
      mockUser.permissions = undefined as any;

      const result = authService.hasPermission(
        mockUser,
        "non-existent-permission" as any
      );

      expect(result).toBe(false);
    });
  });

  describe("getPermissionsForRole", () => {
    it("should fetch permissions from database", async () => {
      const mockPermissions: UserPermissions = {
        "inventory:read": true,
        "inventory:write": true,
        "inventory:delete": false,
        "user:read": false,
        "user:write": false,
      };

      mockDb.limit.mockResolvedValue([{ permissions: mockPermissions }]);

      const result = await authService.getPermissionsForRole(UserRoleEnum.MANAGER);

      expect(result).toEqual(mockPermissions);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it("should create default permissions when role not found", async () => {
      mockDb.limit.mockResolvedValue([]);
      
      // Mock insertMissingRole - returning should resolve to an array
      mockDb.returning.mockResolvedValue([{
        name: UserRoleEnum.STAFF,
        permissions: {
          "inventory:read": true,
          "inventory:write": true,
          "inventory:delete": false,
          "user:read": false,
          "user:write": false,
        }
      }]);

      const result = await authService.getPermissionsForRole(UserRoleEnum.STAFF);

      expect(result).toEqual(
        expect.objectContaining({
          "inventory:read": true,
          "inventory:write": true,
          "inventory:delete": false,
        })
      );
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("revokeToken", () => {
    it("should add token to revoked tokens list", async () => {
      const mockToken = "valid-token";
      const mockJti = "test-jwt-id";

      (jwt.decode as jest.Mock).mockReturnValue({
        jti: mockJti,
        userId: "test-user-id",
      });

      // Mock successful insert
      mockDb.values.mockReturnValue(mockDb);

      const result = await authService.revokeToken(mockToken);

      expect(result).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          token_jti: mockJti,
          user_id: "test-user-id",
          reason: "user_logout",
        })
      );
    });

    it("should handle invalid tokens gracefully", async () => {
      const mockToken = "invalid-token";

      (jwt.decode as jest.Mock).mockReturnValue(null);

      const result = await authService.revokeToken(mockToken);

      expect(result).toBe(false);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe("validateInviteCode", () => {
    it("should validate a valid invite code", async () => {
      mockDb.limit.mockResolvedValue([{
        role: UserRoleEnum.STAFF,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        used_by: null,
      }]);

      const result = await authService.validateInviteCode("VALID123");

      expect(result).toEqual({ valid: true, role: UserRoleEnum.STAFF });
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it("should return invalid for an expired or used invite code", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await authService.validateInviteCode("EXPIRED123");

      expect(result).toEqual({ valid: false });
    });

    it("should handle database errors gracefully", async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error("Database connection error");
      });

      const result = await authService.validateInviteCode("ERROR123");

      expect(result).toEqual({ valid: false });
    });
  });

  describe("registerUser", () => {
    it("should register a user with an invite code", async () => {
      const mockUser = {
        id: "new-user-id",
        email: "newuser@example.com",
        user_metadata: {
          name: "New User",
          role: UserRoleEnum.STAFF,
        },
      };

      const mockPermissions: UserPermissions = {
        "inventory:read": true,
        "inventory:write": true,
        "inventory:delete": false,
        "user:read": false,
        "user:write": false,
      };

      jest.spyOn(authService, "validateInviteCode").mockResolvedValue({
        valid: true,
        role: UserRoleEnum.STAFF,
      });

      jest.spyOn(authService, "markInviteCodeAsUsed").mockResolvedValue(true);

      jest
        .spyOn(authService, "getPermissionsForRole")
        .mockResolvedValue(mockPermissions);

      // Mock createUserProfile
      jest.spyOn(authService as any, "createUserProfile").mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: "New User",
      });

      (mockSupabaseAdmin.auth.admin.createUser as any).mockImplementation(() =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        })
      );

      const result = await authService.registerUser(
        "newuser@example.com",
        "password123",
        "New User",
        "INVITE123"
      );

      expect(result).toEqual(
        expect.objectContaining({
          user: expect.objectContaining({
            id: "new-user-id",
            email: "newuser@example.com",
            name: "New User",
            role: UserRoleEnum.STAFF,
            permissions: mockPermissions,
          }),
          token: expect.any(String),
          sessionId: expect.any(String),
        })
      );

      expect(authService.validateInviteCode).toHaveBeenCalledWith("INVITE123");
      expect(authService.markInviteCodeAsUsed).toHaveBeenCalledWith(
        "INVITE123",
        "new-user-id"
      );
    });

    it("should throw error for invalid invite code", async () => {
      jest.spyOn(authService, "validateInviteCode").mockResolvedValue({
        valid: false,
      });

      await expect(authService.registerUser(
        "newuser@example.com",
        "password123",
        "New User",
        "INVALID123"
      )).rejects.toThrow("Invalid or expired invite code");
    });

    it("should register an owner with payment verification", async () => {
      const mockUser = {
        id: "owner-id",
        email: "owner@example.com",
        user_metadata: {
          name: "Owner User",
          role: UserRoleEnum.OWNER,
        },
      };

      const mockPermissions: UserPermissions = {
        "inventory:read": true,
        "inventory:write": true,
        "inventory:delete": true,
        "user:read": true,
        "user:write": true,
      };

      jest
        .spyOn(authService, "getPermissionsForRole")
        .mockResolvedValue(mockPermissions);

      // Mock createUserProfile
      jest.spyOn(authService as any, "createUserProfile").mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: "Owner User",
      });

      (mockSupabaseAdmin.auth.admin.createUser as any).mockImplementation(() =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        })
      );

      const result = await authService.registerUser(
        "owner@example.com",
        "password123",
        "Owner User",
        undefined,
        true // payment verified
      );

      expect(result).toEqual(
        expect.objectContaining({
          user: expect.objectContaining({
            id: "owner-id",
            email: "owner@example.com",
            name: "Owner User",
            role: UserRoleEnum.OWNER,
            permissions: mockPermissions,
          }),
        })
      );

      expect(mockSupabaseAdmin.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "owner@example.com",
          password: "password123",
          user_metadata: expect.objectContaining({
            name: "Owner User",
            role: UserRoleEnum.OWNER,
          }),
        })
      );
    });
  });

  describe("validateSupabaseToken", () => {
    it("should validate a Supabase token and return user data", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
        user_metadata: {
          name: "Test User",
          role: UserRoleEnum.STAFF,
        },
      };

      const mockPermissions: UserPermissions = {
        "inventory:read": true,
        "inventory:write": true,
        "inventory:delete": false,
        "user:read": false,
        "user:write": false,
      };

      (mockSupabase.auth.getUser as any).mockImplementation(() =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        })
      );

      // Mock getUserWithProfile
      jest.spyOn(authService as any, "getUserWithProfile").mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: "Test User",
        locations: [{
          location: { id: "loc1", name: "Location 1" },
          role: { id: "role1", name: UserRoleEnum.STAFF, permissions: mockPermissions },
        }],
      });

      // Mock getUserPermissions
      jest.spyOn(authService as any, "getUserPermissions").mockResolvedValue(mockPermissions);

      const result = await authService.validateSupabaseToken(
        "valid-supabase-token"
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: "test-user-id",
          email: "test@example.com",
          name: "Test User",
          role: UserRoleEnum.STAFF,
          permissions: mockPermissions,
        })
      );

      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith(
        "valid-supabase-token"
      );
    });

    it("should return null for invalid Supabase token", async () => {
      (mockSupabase.auth.getUser as any).mockImplementation(() =>
        Promise.resolve({
          data: { user: null },
          error: { message: "Invalid token" },
        })
      );

      const result = await authService.validateSupabaseToken(
        "invalid-supabase-token"
      );

      expect(result).toBeNull();
    });
  });

  describe("markInviteCodeAsUsed", () => {
    it("should mark invite code as used", async () => {
      // Mock the update chain to resolve to a result object
      mockDb.where.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.update.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue({ count: 1 });

      const result = await authService.markInviteCodeAsUsed("CODE123", "user123");

      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          used_by: "user123",
          used_at: expect.any(String),
        })
      );
    });

    it("should return false on error", async () => {
      mockDb.update.mockImplementation(() => {
        throw new Error("Database error");
      });

      const result = await authService.markInviteCodeAsUsed("CODE123", "user123");

      expect(result).toBe(false);
    });
  });

  describe("createInviteCode", () => {
    it("should create an invite code", async () => {
      const mockInviteCode: MockInviteCode = {
        id: "invite123",
        code: "ABCD1234",
        role: UserRoleEnum.STAFF,
        created_by: "user123",
        expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        used_by: null,
        used_at: null,
      };

      mockDb.returning.mockResolvedValue([mockInviteCode]);

      const result = await authService.createInviteCode(
        UserRoleEnum.STAFF,
        "user123",
        7
      );

      expect(result).toEqual(mockInviteCode);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRoleEnum.STAFF,
          created_by: "user123",
          expires_at: expect.any(String),
        })
      );
    });

    it("should return null on error", async () => {
      mockDb.insert.mockImplementation(() => {
        throw new Error("Database error");
      });

      const result = await authService.createInviteCode(
        UserRoleEnum.STAFF,
        "user123"
      );

      expect(result).toBeNull();
    });
  });
});