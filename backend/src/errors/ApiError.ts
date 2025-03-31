export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly type: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    type: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
} 