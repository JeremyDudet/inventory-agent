import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';
import { AppError, ErrorType } from '../errors/AppError';

describe('Error Handler Middleware', () => {
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

  test('should handle AppError correctly', () => {
    const error = new AppError('Test error', ErrorType.VALIDATION_ERROR);
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      type: ErrorType.VALIDATION_ERROR,
      message: 'Test error'
    });
  });

  test('should handle unknown errors as internal server errors', () => {
    const error = new Error('Unknown error');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      type: ErrorType.INTERNAL_ERROR,
      message: 'An unexpected error occurred'
    });
  });

  test('should handle non-operational errors without exposing details', () => {
    const error = new AppError('System error', ErrorType.INTERNAL_ERROR, 500, false);
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      type: ErrorType.INTERNAL_ERROR,
      message: 'An unexpected error occurred'
    });
  });

  test('should handle validation errors with details', () => {
    const error = new AppError('Invalid input', ErrorType.VALIDATION_ERROR);
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      type: ErrorType.VALIDATION_ERROR,
      message: 'Invalid input'
    });
  });
}); 