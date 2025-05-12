// backend/__tests__/middleware/auth.test.ts
import { Request, Response, NextFunction } from "express";
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { authenticate, authorize, requireRole } from "@/middleware/auth";
import {
  UserRoleEnum,
  AuthTokenPayload,
} from "@/types";
import authService from "@/services/authService";

// Mock the auth service
jest.mock("@/services/authService");

describe("Authentication Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as jest.MockedFunction<
        Response["status"]
      >,
      json: jest.fn().mockReturnThis() as jest.MockedFunction<Response["json"]>,
    };
    nextFunction = jest.fn();
  });

  describe("authenticate", () => {
    it("should return 401 if no token is provided", async () => {
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No token provided. Please log in to access this resource.",
          statusCode: 401,
        })
      );
    });

    it("should return 401 if token is invalid", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };

      // Mock the auth service to return null for invalid token
      (
        authService.verifyToken as jest.MockedFunction<
          typeof authService.verifyToken
        >
      ).mockResolvedValue(null);
      (
        authService.validateSupabaseToken as jest.MockedFunction<
          typeof authService.validateSupabaseToken
        >
      ).mockResolvedValue(null);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid or expired token. Please log in again.",
          statusCode: 401,
        })
      );
    });

    it("should call next() if token is valid", async () => {
      const mockUser = {
        id: "123",
        email: "test@example.com",
        name: "Test User",
        role: UserRoleEnum.STAFF,
        permissions: {
          "inventory:read": true,
          "inventory:write": false,
          "inventory:delete": false,
          "user:read": true,
          "user:write": false,
        },
        sessionId: "session-123",
      };

      mockRequest.headers = {
        authorization: "Bearer valid-token",
      };

      // Mock the auth service to return a valid user
      (
        authService.verifyToken as jest.MockedFunction<
          typeof authService.verifyToken
        >
      ).mockResolvedValue({
        userId: "123",
        email: "test@example.com",
        name: "Test User",
        role: UserRoleEnum.STAFF,
        sessionId: "session-123",
        jti: "token-123",
      } as AuthTokenPayload);
      (
        authService.getPermissionsForRole as jest.MockedFunction<
          typeof authService.getPermissionsForRole
        >
      ).mockResolvedValue(mockUser.permissions);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user).toEqual(mockUser);
    });
  });

  describe("authorize", () => {
    it("should return 401 if user is not authenticated", () => {
      const middleware = authorize("inventory:read");
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You must be logged in to access this resource.",
          statusCode: 401,
        })
      );
    });

    it("should return 403 if user does not have required permission", () => {
      mockRequest.user = {
        id: "123",
        email: "test@example.com",
        name: "Test User",
        role: UserRoleEnum.READONLY,
        permissions: {
          "inventory:read": true,
          "inventory:write": false,
          "inventory:delete": false,
          "user:read": false,
          "user:write": false,
        },
        sessionId: "session-123",
      };

      const middleware = authorize("inventory:write");
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You don't have the required inventory:write permission",
          statusCode: 403,
        })
      );
    });

    it("should call next() if user has required permission", () => {
      mockRequest.user = {
        id: "123",
        email: "test@example.com",
        name: "Test User",
        role: UserRoleEnum.MANAGER,
        permissions: {
          "inventory:read": true,
          "inventory:write": true,
          "inventory:delete": true,
          "user:read": true,
          "user:write": true,
        },
        sessionId: "session-123",
      };

      const middleware = authorize("inventory:write");
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("should return 401 if user is not authenticated", () => {
      const middleware = requireRole([UserRoleEnum.MANAGER]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You must be logged in to access this resource.",
          statusCode: 401,
        })
      );
    });

    it("should return 403 if user does not have required role", () => {
      mockRequest.user = {
        id: "123",
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
        sessionId: "session-123",
      };

      const middleware = requireRole([UserRoleEnum.MANAGER]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            `Access denied. Your role (${UserRoleEnum.STAFF}) doesn't have permission for this action`
          ),
          statusCode: 403,
        })
      );
    });

    it("should call next() if user has required role", () => {
      mockRequest.user = {
        id: "123",
        email: "test@example.com",
        name: "Test User",
        role: UserRoleEnum.MANAGER,
        permissions: {
          "inventory:read": true,
          "inventory:write": true,
          "inventory:delete": true,
          "user:read": true,
          "user:write": true,
        },
        sessionId: "session-123",
      };

      const middleware = requireRole([UserRoleEnum.MANAGER]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
