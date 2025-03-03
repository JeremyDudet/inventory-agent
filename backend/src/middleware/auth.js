// backend/src/middleware/auth.js
const authService = require('../services/authService').default;

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticateUser = async (req, res, next) => {
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
    
    // First try with our JWT
    const payload = authService.verifyToken(token);
    
    if (payload) {
      // Get fresh permissions for the user's role
      const permissions = await authService.getPermissionsForRole(payload.role);
      
      req.user = {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        permissions,
      };
      
      return next();
    }
    
    // If JWT validation fails, try with Supabase
    const user = await authService.validateSupabaseToken(token);
    
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }
    
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'An error occurred during authentication',
      },
    });
  }
};

/**
 * Permission middleware factory
 * Creates middleware to check if user has specific permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }
    
    if (!req.user.permissions[permission]) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `You don't have the required permission: ${permission}`,
        },
      });
    }
    
    next();
  };
};

/**
 * Role middleware factory
 * Creates middleware to check if user has a specific role
 */
const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }
    
    if (!roleArray.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: `You don't have the required role`,
        },
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateUser,
  requirePermission,
  requireRole,
};