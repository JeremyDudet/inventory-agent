import { Request, Response, NextFunction } from 'express';
import authService, { AuthTokenPayload, UserPermissions, User } from '../services/authService';
import { asyncMiddleware } from './utils';
import { UnauthorizedError, ForbiddenError } from '../errors/AuthError';

// Define custom request interface with user property
declare global {
  namespace Express {
    interface Request {
      user?: User | AuthTokenPayload;
    }
  }
}

/**
 * Authentication middleware to verify JWT token or Supabase token
 * Attaches user information to the request object if token is valid
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided. Please log in to access this resource.');
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // First try to verify with our JWT
    const payload = await authService.verifyToken(token);
    
    if (payload) {
      // Get fresh permissions for the user's role
      const permissions = await authService.getPermissionsForRole(payload.role);
      
      // Attach user info to request
      req.user = {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        permissions,
        sessionId: payload.sessionId
      };
      
      return next();
    }
    
    // If JWT verification fails, try Supabase token
    const user = await authService.validateSupabaseToken(token);
    
    if (!user) {
      throw new UnauthorizedError('Invalid or expired token. Please log in again.');
    }
    
    // Attach user info to request including sessionId
    req.user = user;
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware to check if user has specific permission
 * Must be used after authenticate middleware
 * @param permission - The permission to check
 */
export const authorize = (permission: keyof UserPermissions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new UnauthorizedError('You must be logged in to access this resource.');
      }
      
      // Check if user has required permission
      if (!req.user.permissions || !(req.user.permissions as any)[permission]) {
        throw new ForbiddenError(`You don't have the required ${permission} permission`);
      }
      
      // User has permission, continue
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to limit access to specific roles
 * Must be used after authenticate middleware
 * @param roles - Array of allowed roles
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new UnauthorizedError('You must be logged in to access this resource.');
      }
      
      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access denied. Your role (${req.user.role}) doesn't have permission for this action. Required role: ${roles.join(' or ')}`
        );
      }
      
      // User has the required role, continue
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Wrap the async authenticate middleware for Express compatibility
export const authMiddleware = function(req: Request, res: Response, next: NextFunction) {
  // Call authenticate and handle the promise
  authenticate(req, res, next).catch(next);
};

// For backward compatibility
export const checkRole = requireRole; 