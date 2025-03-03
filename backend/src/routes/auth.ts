import express, { Request, Response, NextFunction } from 'express';
import authService, { UserRole } from '../services/authService';
import supabase from '../config/db';

const router = express.Router();

// Login route
router.post('/login', async function(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required',
        },
      });
    }

    // Authenticate using Supabase Auth
    const result = await authService.authenticateUser(email, password);

    if (!result) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid email or password',
        },
      });
    }

    // If role was specified in the request, make sure it matches the user's role
    if (role && result.user.role !== role) {
      return res.status(403).json({
        error: {
          code: 'ROLE_MISMATCH',
          message: `You are not authorized as ${role}`,
          actualRole: result.user.role,
        },
      });
    }

    res.status(200).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      token: result.token,
      permissions: result.user.permissions,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Error during login:', error);
    next(error);
  }
});

// Register route
router.post('/register', async function(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email, password, and name are required',
        },
      });
    }

    // Validate role
    const userRole = role || UserRole.STAFF; // Default to staff if role not specified
    if (!Object.values(UserRole).includes(userRole)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ROLE',
          message: 'Invalid role specified',
        },
      });
    }

    // Register the user with Supabase Auth
    const result = await authService.registerUser(email, password, name, userRole);
    
    if (!result) {
      return res.status(500).json({
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register user',
        },
      });
    }

    res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      token: result.token,
      permissions: result.user.permissions,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Error during registration:', error);
    next(error);
  }
});

// Verify token and get user info using Supabase Auth
router.get('/me', async function(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication token required',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    
    // First try to validate with our own JWT
    const payload = authService.verifyToken(token);
    
    if (payload) {
      // Get fresh permissions for the user's role
      const permissions = await authService.getPermissionsForRole(payload.role);

      return res.status(200).json({
        user: {
          id: payload.userId,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
        permissions,
      });
    }
    
    // If our JWT validation fails, try to validate with Supabase
    const user = await authService.validateSupabaseToken(token);
    
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }
    
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      permissions: user.permissions,
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    next(error);
  }
});

// Create a middleware to check permissions
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authentication token required',
          },
        });
      }

      const token = authHeader.split(' ')[1];
      
      // First try our own JWT token
      const payload = authService.verifyToken(token);
      
      if (payload && payload.permissions && payload.permissions[permission as keyof typeof payload.permissions]) {
        return next();
      }
      
      // If JWT fails or doesn't have permission, try Supabase token
      const user = await authService.validateSupabaseToken(token);
      
      if (!user) {
        return res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        });
      }
      
      if (!user.permissions || !user.permissions[permission as keyof typeof user.permissions]) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `You do not have the required permission: ${permission}`,
          },
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in permission middleware:', error);
      next(error);
    }
  };
};

export default router; 