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
    const { email, password, name, inviteCode } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email, password, and name are required',
        },
      });
    }

    try {
      // Register the user with invite code
      const result = await authService.registerUser(email, password, name, inviteCode);
      
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
    } catch (error: any) {
      // Handle specific error for invite code
      if (error.message && error.message.includes('Invite code required')) {
        return res.status(400).json({
          error: {
            code: 'INVITE_CODE_REQUIRED',
            message: 'Invite code is required for staff and management roles',
          },
        });
      } else if (error.message && error.message.includes('Invalid or expired invite code')) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INVITE_CODE',
            message: 'Invalid or expired invite code',
          },
        });
      }
      
      throw error; // Re-throw other errors to be caught by the catch block
    }
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

// Create invite code route
router.post('/invite-code', requirePermission('user:write'), async function(req: Request, res: Response, next: NextFunction) {
  try {
    const { role = UserRole.STAFF, expiresInDays = 7 } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }
    
    // Validate role
    if (!Object.values(UserRole).includes(role) || role === UserRole.READONLY) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ROLE',
          message: 'Invalid role for invite code',
        },
      });
    }
    
    const inviteCode = await authService.createInviteCode(role, req.user.id, expiresInDays);
    
    if (!inviteCode) {
      return res.status(500).json({
        error: {
          code: 'INVITE_CODE_CREATION_FAILED',
          message: 'Failed to create invite code',
        },
      });
    }
    
    res.status(201).json({
      code: inviteCode.code,
      role: inviteCode.role,
      expiresAt: inviteCode.expires_at,
    });
  } catch (error) {
    console.error('Error creating invite code:', error);
    next(error);
  }
});

// Verify invite code route
router.get('/verify-invite/:code', async function(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params;
    
    const result = await authService.validateInviteCode(code);
    
    if (!result.valid) {
      return res.status(404).json({
        error: {
          code: 'INVALID_INVITE_CODE',
          message: 'Invalid or expired invite code',
        },
      });
    }
    
    res.status(200).json({
      valid: true,
      role: result.role,
    });
  } catch (error) {
    console.error('Error verifying invite code:', error);
    next(error);
  }
});

export default router; 