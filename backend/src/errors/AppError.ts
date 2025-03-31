export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL_ERROR,
    statusCode: number = AppError.getDefaultStatusCode(type),
    isOperational: boolean = true
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  private static getDefaultStatusCode(type: ErrorType): number {
    const statusCodes: Record<ErrorType, number> = {
      [ErrorType.VALIDATION_ERROR]: 400,
      [ErrorType.NOT_FOUND]: 404,
      [ErrorType.UNAUTHORIZED]: 401,
      [ErrorType.FORBIDDEN]: 403,
      [ErrorType.CONFLICT]: 409,
      [ErrorType.INTERNAL_ERROR]: 500
    };
    return statusCodes[type];
  }
} 