import { AppError, ErrorType } from './AppError';

describe('AppError', () => {
  test('should create an AppError with default values', () => {
    const error = new AppError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.type).toBe(ErrorType.INTERNAL_ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  test('should create an AppError with custom type', () => {
    const error = new AppError('Not found', ErrorType.NOT_FOUND);
    expect(error.message).toBe('Not found');
    expect(error.type).toBe(ErrorType.NOT_FOUND);
    expect(error.statusCode).toBe(404);
  });

  test('should create an AppError with custom status code', () => {
    const error = new AppError('Custom error', ErrorType.INTERNAL_ERROR, 503);
    expect(error.message).toBe('Custom error');
    expect(error.type).toBe(ErrorType.INTERNAL_ERROR);
    expect(error.statusCode).toBe(503);
  });

  test('should create a non-operational error', () => {
    const error = new AppError('System error', ErrorType.INTERNAL_ERROR, 500, false);
    expect(error.isOperational).toBe(false);
  });

  test('should include stack trace', () => {
    const error = new AppError('Test error');
    expect(error.stack).toBeDefined();
  });
}); 