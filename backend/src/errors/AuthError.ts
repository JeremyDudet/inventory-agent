import { ApiError } from './ApiError';

export class AuthError extends ApiError {
  constructor(message: string = 'Authentication failed', statusCode: number = 401) {
    super(message, statusCode, 'AUTH_ERROR');
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'You must be logged in to access this resource') {
    super(message, 401);
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(message, 403);
  }
} 