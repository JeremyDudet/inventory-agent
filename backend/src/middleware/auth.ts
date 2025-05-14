// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import authService from "../services/authService";
import { AuthTokenPayload, UserPermissions, AuthUser } from "../types";
// import { asyncMiddleware } from "./utils";
import { UnauthorizedError, ForbiddenError } from "../errors/AuthError";
import db from "../db";
import { eq } from "drizzle-orm";
import { user_locations, user_roles, locations } from "../db/schema";
import { InventoryItem } from "../types";
// Define custom request interface with user property
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser | AuthTokenPayload;
      locationId?: string;
      item?: InventoryItem;
    }
  }
}

/**
 * Authentication middleware to verify JWT token or Supabase token
 * Attaches user information to the request object if token is valid
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(
        "No token provided. Please log in to access this resource."
      );
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // First try to verify with our JWT
    const payload = await authService.verifyToken(token);

    if (payload) {
      // Get user's locations and roles
      const userLocations = await db
        .select({
          location: {
            id: locations.id,
            name: locations.name,
          },
          role: user_roles,
        })
        .from(user_locations)
        .innerJoin(locations, eq(user_locations.location_id, locations.id))
        .innerJoin(user_roles, eq(user_locations.role_id, user_roles.id))
        .where(eq(user_locations.user_id, payload.userId));

      req.user = {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        locations: userLocations.map((ul) => ({
          id: ul.location.id,
          name: ul.location.name,
          role: {
            id: ul.role.id,
            name: ul.role.name,
            permissions: ul.role.permissions as UserPermissions,
          },
        })),
      };

      return next();
    }

    // If JWT verification fails, try Supabase token
    const user = await authService.validateSupabaseToken(token);

    if (!user) {
      throw new UnauthorizedError(
        "Invalid or expired token. Please log in again."
      );
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
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(
          "You must be logged in to access this resource."
        );
      }

      // Use req.locationId if set (from loadItem), else fallback to params or body
      const locationId =
        req.locationId || req.params.locationId || req.body.location_id;
      if (!locationId) {
        throw new ForbiddenError(
          "Location ID is required for permission check"
        );
      }

      if (!("locations" in req.user)) {
        throw new ForbiddenError("User data is incomplete");
      }

      const location = req.user.locations?.find((loc) => loc.id === locationId);
      if (!location) {
        throw new ForbiddenError("You don't have access to this location");
      }

      if (!location.role.permissions[permission]) {
        throw new ForbiddenError(
          `You don't have the required ${permission} permission for this location`
        );
      }

      req.locationId = locationId; // Set for downstream use if needed
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
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new UnauthorizedError(
          "You must be logged in to access this resource."
        );
      }

      const locationId = req.params.locationId || req.body.locationId;
      if (!locationId) {
        throw new ForbiddenError("Location ID is required for role check");
      }

      if (!("locations" in req.user)) {
        throw new ForbiddenError("User data is incomplete");
      }

      const location = req.user.locations?.find((loc) => loc.id === locationId);
      if (!location) {
        throw new ForbiddenError("You don't have access to this location");
      }

      if (!roles.includes(location.role.name)) {
        throw new ForbiddenError(
          `Access denied. Your role (${
            location.role.name
          }) doesn't have permission for this action. Required role: ${roles.join(
            " or "
          )}`
        );
      }

      req.locationId = locationId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Wrap the async authenticate middleware for Express compatibility
export const authMiddleware = function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Call authenticate and handle the promise
  authenticate(req, res, next).catch(next);
};

// For backward compatibility
export const checkRole = requireRole;
