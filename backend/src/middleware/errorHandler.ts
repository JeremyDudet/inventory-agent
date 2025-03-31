import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error details
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (err instanceof ApiError) {
    // Handle operational errors (known errors)
    return res.status(err.statusCode).json({
      status: 'error',
      type: err.type,
      message: err.isOperational ? err.message : 'An unexpected error occurred'
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    status: 'error',
    type: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred'
  });
}; 