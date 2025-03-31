import { ApiError } from './ApiError';

export class ValidationError extends ApiError {
  constructor(message: string = 'Invalid input data') {
    super(message, 400, 'VALIDATION_ERROR');
  }
} 