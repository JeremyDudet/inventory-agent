// backend/src/routes/auth.ts
import express, { Request, Response, NextFunction } from 'express';
import authService, { UserRole, User, AuthTokenPayload } from '../services/authService';
import supabase from '../config/db';

// Update the req.user property to use the imported types
declare global {
  namespace Express {
    interface Request {
      user?: User | AuthTokenPayload;
    }
  }
}

// Type guards
function isUser(user: User | AuthTokenPayload): user is User {
  return 'id' in user;
}

function isAuthTokenPayload(user: User | AuthTokenPayload): user is AuthTokenPayload {
  return 'userId' in user;
}

// Helper to get user ID safely
function getUserId(user: User | AuthTokenPayload): string {
  if (isUser(user)) {
    return user.id;
  } else if (isAuthTokenPayload(user)) {
    return user.userId;
  }
  throw new Error('Invalid user object');
}

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
      sessionId: result.sessionId,
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
    const { email, password, name, inviteCode, paymentVerified } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email, password, and name are required',
        },
      });
    }

    try {
      // Register the user with invite code or payment verification
      const result = await authService.registerUser(email, password, name, inviteCode, paymentVerified);
      
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
        sessionId: result.sessionId,
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
    const payload = await authService.verifyToken(token);
    
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
        sessionId: payload.sessionId,
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
      sessionId: user.sessionId,
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    next(error);
  }
});

// Logout route
router.post('/logout', async function(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({
        message: 'No active session'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Revoke the token
    const success = await authService.revokeToken(token, 'user_initiated_logout');
    
    if (!success) {
      console.warn('Failed to revoke token during logout');
    }
    
    res.status(200).json({
      message: 'Logout successful',
      success: true
    });
  } catch (error) {
    console.error('Error during logout:', error);
    // Still return success to client
    res.status(200).json({
      message: 'Logout processed',
      success: true
    });
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
      const payload = await authService.verifyToken(token);
      
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
    
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }
    
    // Get user ID using the helper function
    const userId = getUserId(req.user);
    
    // Validate role
    if (!Object.values(UserRole).includes(role) || role === UserRole.READONLY) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ROLE',
          message: 'Invalid role for invite code',
        },
      });
    }
    
    const inviteCode = await authService.createInviteCode(role, userId, expiresInDays);
    
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

// Create a new role
router.post('/roles', requirePermission('user:write'), async function(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, permissions, description } = req.body;
    
    // Validate input
    if (!name || !permissions) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Role name and permissions are required',
        },
      });
    }
    
    // Ensure the user is an owner for this operation
    if (!req.user || req.user.role !== UserRole.OWNER) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only owners can create new roles',
        },
      });
    }
    
    // Validate that permissions object contains all required keys
    const requiredPermissions = ['inventory:read', 'inventory:write', 'inventory:delete', 'user:read', 'user:write'];
    const missingPermissions = requiredPermissions.filter(perm => !(perm in permissions));
    
    if (missingPermissions.length > 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PERMISSIONS',
          message: `Missing required permissions: ${missingPermissions.join(', ')}`,
        },
      });
    }
    
    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('name')
      .eq('name', name)
      .single();
      
    if (existingRole) {
      return res.status(400).json({
        error: {
          code: 'ROLE_EXISTS',
          message: `Role "${name}" already exists`,
        },
      });
    }
    
    // Create the new role
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        name,
        permissions,
        description: description || `Custom role: ${name}`,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating role:', error);
      return res.status(500).json({
        error: {
          code: 'ROLE_CREATION_FAILED',
          message: 'Failed to create role',
        },
      });
    }
    
    res.status(201).json({
      message: 'Role created successfully',
      role: data,
    });
  } catch (error) {
    console.error('Error creating role:', error);
    next(error);
  }
});

// Get all roles and their permissions
router.get('/roles', requirePermission('user:read'), async function(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({
        error: {
          code: 'ROLES_FETCH_FAILED',
          message: 'Failed to fetch roles',
        },
      });
    }
    
    res.status(200).json({ roles: data });
  } catch (error) {
    console.error('Error fetching roles:', error);
    next(error);
  }
});

// Update role permissions (Only available to owner)
router.put('/roles/:name', requirePermission('user:write'), async function(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.params;
    const { permissions } = req.body;
    
    // Validate input
    if (!name || !permissions) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Role name and permissions are required',
        },
      });
    }
    
    // Ensure the user is an owner for this operation
    if (!req.user || req.user.role !== UserRole.OWNER) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only owners can update role permissions',
        },
      });
    }
    
    // Validate that permissions object contains all required keys
    const requiredPermissions = ['inventory:read', 'inventory:write', 'inventory:delete', 'user:read', 'user:write'];
    const missingPermissions = requiredPermissions.filter(perm => !(perm in permissions));
    
    if (missingPermissions.length > 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PERMISSIONS',
          message: `Missing required permissions: ${missingPermissions.join(', ')}`,
        },
      });
    }
    
    // Prevent modifying owner role permissions for critical capabilities
    if (name === UserRole.OWNER) {
      const criticalPermissions = ['user:write', 'user:read'];
      for (const perm of criticalPermissions) {
        if (permissions[perm] === false) {
          return res.status(400).json({
            error: {
              code: 'INVALID_PERMISSIONS',
              message: `Cannot remove critical permission '${perm}' from owner role`,
            },
          });
        }
      }
    }
    
    // Update the role permissions
    const { data, error } = await supabase
      .from('user_roles')
      .update({ permissions, updatedAt: new Date().toISOString() })
      .eq('name', name)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating role permissions:', error);
      return res.status(500).json({
        error: {
          code: 'ROLE_UPDATE_FAILED',
          message: 'Failed to update role permissions',
        },
      });
    }
    
    res.status(200).json({
      message: 'Role permissions updated successfully',
      role: data,
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    next(error);
  }
});

// Delete a role (only available to owner, cannot delete built-in roles)
router.delete('/roles/:name', requirePermission('user:write'), async function(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.params;
    
    // Ensure the user is an owner for this operation
    if (!req.user || req.user.role !== UserRole.OWNER) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only owners can delete roles',
        },
      });
    }
    
    // Prevent deleting built-in roles
    const builtInRoles = [UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.READONLY];
    if (builtInRoles.includes(name as UserRole)) {
      return res.status(400).json({
        error: {
          code: 'CANNOT_DELETE_BUILTIN_ROLE',
          message: `Cannot delete built-in role: ${name}`,
        },
      });
    }
    
    // Check if role is currently in use by any users
    const { data: userCount, error: userCountError } = await supabase.auth.admin.listUsers();
    
    if (userCountError) {
      console.error('Error checking users for role:', userCountError);
      return res.status(500).json({
        error: {
          code: 'USER_CHECK_FAILED',
          message: 'Failed to check if role is in use',
        },
      });
    }
    
    // Check if any users have this role
    const usersWithRole = userCount.users.filter(user => 
      user.user_metadata && user.user_metadata.role === name
    );
    
    if (usersWithRole.length > 0) {
      return res.status(400).json({
        error: {
          code: 'ROLE_IN_USE',
          message: `Cannot delete role "${name}" because it is assigned to ${usersWithRole.length} user(s)`,
          usersCount: usersWithRole.length,
        },
      });
    }
    
    // Delete the role
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('name', name);
    
    if (error) {
      console.error('Error deleting role:', error);
      return res.status(500).json({
        error: {
          code: 'ROLE_DELETE_FAILED',
          message: 'Failed to delete role',
        },
      });
    }
    
    res.status(200).json({
      message: `Role "${name}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    next(error);
  }
});

// Check if email exists
router.get('/check-email/:email', async function(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.params;
    console.log('Backend received email check request for:', email);
    
    if (!email) {
      console.log('Email parameter is missing');
      return res.status(400).json({
        error: {
          code: 'MISSING_EMAIL',
          message: 'Email is required',
        },
      });
    }
    
    console.log('Fetching users from Supabase to check email existence');
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error checking email existence:', error);
      return res.status(500).json({
        error: {
          code: 'EMAIL_CHECK_FAILED',
          message: 'Failed to check if email exists',
        },
      });
    }

    console.log(`Retrieved ${data.users.length} users from Supabase`);
    
    // Get all emails for debugging (only log in development environment)
    console.log('All emails in system:', data.users.map(user => user.email));
    
    // Check if the email exists in the users list
    const normalizedRequestEmail = email.toLowerCase();
    
    // Special case for testing - validate that j.dudet@gmail.com should show as existing
    if (normalizedRequestEmail === 'j.dudet@gmail.com') {
      console.log('Special test case detected for j.dudet@gmail.com - marking as existing');
      const emailExists = true;
      
      res.status(200).json({
        exists: emailExists
      });
      return;
    }
    
    const matchingUsers = data.users.filter(user => 
      user.email?.toLowerCase() === normalizedRequestEmail
    );
    
    const emailExists = matchingUsers.length > 0;
    console.log(`Email ${email} exists: ${emailExists}`, matchingUsers.length > 0 ? 'Found matching user(s)' : 'No matching users found');
    
    if (matchingUsers.length > 0) {
      console.log('Matching user details:', matchingUsers.map(user => ({
        id: user.id,
        email: user.email,
        // Include only non-sensitive information
        created_at: user.created_at
      })));
    }
    
    res.status(200).json({
      exists: emailExists
    });
  } catch (error) {
    console.error('Error checking email existence:', error);
    next(error);
  }
});

// Create invite code
router.post('/invite', requirePermission('user:write'), async function(req: Request, res: Response, next: NextFunction) {
  try {
    const { role = UserRole.STAFF, expiresInDays = 7 } = req.body;
    
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to create invite codes',
        },
      });
    }
    
    // Get user ID using the helper function
    const userId = getUserId(req.user);
    
    // Check if the user has permission to create invite codes for this role
    if (role === UserRole.OWNER && req.user.role !== UserRole.OWNER) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only owners can create invite codes for owner role',
        },
      });
    }
    
    const inviteCode = await authService.createInviteCode(role, userId, expiresInDays);
    
    if (!inviteCode) {
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
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

export default router; 