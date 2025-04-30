import { Request, Response, NextFunction } from "express";
import { errorHandler } from "@/middleware/errorHandler";
import { ApiError } from "@/errors/ApiError";

describe("Error Handler Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  test("should handle ApiError correctly", () => {
    const error = new ApiError("Test error", 400, "VALIDATION_ERROR");
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: "error",
      type: "VALIDATION_ERROR",
      message: "Test error",
    });
  });

  test("should handle unknown errors as internal server errors", () => {
    const error = new Error("Unknown error");
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: "error",
      type: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  });

  test("should handle non-operational errors without exposing details", () => {
    const error = new ApiError("System error", 500, "INTERNAL_ERROR", false);
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: "error",
      type: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  });

  test("should handle validation errors with details", () => {
    const error = new ApiError("Invalid input", 400, "VALIDATION_ERROR");
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: "error",
      type: "VALIDATION_ERROR",
      message: "Invalid input",
    });
  });
});
