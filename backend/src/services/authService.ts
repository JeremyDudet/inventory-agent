// backend/src/services/authService.ts
import {
  UserRoleEnum,
  AuthUser,
  AuthTokenPayload,
  UserPermissions,
} from "@/types";
import { supabase, supabaseAdmin } from "../config/supabase";
import jwt from "jsonwebtoken";
import db from "@/db";
import {
  profiles,
  user_roles,
  user_locations,
  locations,
  invite_codes,
  revoked_tokens,
} from "@/db/schema";
import { eq, isNull, gt, and } from "drizzle-orm";
import crypto from "crypto";

interface InviteCode {
  id: string;
  code: string;
  role: string;
  created_by?: string;
  used_by?: string;
  used_at?: string;
  expires_at: string;
  created_at: string;
}

class AuthService {
  /**
   * Helper to check if JWT secret is configured
   */
  private isJwtConfigured(): boolean {
    return Boolean(process.env.JWT_SECRET);
  }

  /**
   * Get permissions for a given role from the database
   */
  async getPermissionsForRole(role: string): Promise<UserPermissions> {
    try {
      // Get permissions from database using Drizzle
      const [roleData] = await db
        .select()
        .from(user_roles)
        .where(eq(user_roles.name, role))
        .limit(1);

      if (!roleData) {
        console.error(
          `Role ${role} not found in database, this should never happen!`
        );
        // Create default fallback permission based on role
        const defaultPermissions: UserPermissions = {
          "inventory:read": true, // All roles can read inventory
          "inventory:write": role !== UserRoleEnum.READONLY, // All except READONLY can write
          "inventory:delete": role === UserRoleEnum.OWNER, // Only OWNER can delete
          "user:read":
            role === UserRoleEnum.OWNER || role === UserRoleEnum.MANAGER, // OWNER and MANAGER can read users
          "user:write": role === UserRoleEnum.OWNER, // Only OWNER can write users
        };

        // Try to insert the missing role into the database for future use
        await this.insertMissingRole(role, defaultPermissions);
        return defaultPermissions;
      }

      return roleData.permissions as UserPermissions;
    } catch (error) {
      console.error("Error fetching permissions:", error);
      // If there's an error, default to read-only permissions for safety
      return {
        "inventory:read": true,
        "inventory:write": false,
        "inventory:delete": false,
        "user:read": false,
        "user:write": false,
      };
    }
  }

  /**
   * Insert a missing role into the database with default permissions
   * This is a recovery mechanism in case a role is missing
   */
  private async insertMissingRole(
    role: string,
    permissions: UserPermissions
  ): Promise<void> {
    try {
      await db.insert(user_roles).values({
        name: role,
        permissions: permissions,
      });

      console.log(
        `Successfully inserted missing role ${role} with default permissions`
      );
    } catch (error) {
      console.error(`Error inserting missing role ${role}:`, error);
    }
  }

  /**
   * Validate if a user has a specific permission
   */
  // hasPermission(user: AuthUser, permission: keyof UserPermissions): boolean {
  //   if (!user.permissions) {
  //     return false;
  //   }
  //   return user.permissions[permission] === true;
  // }

  /**
   * Generate a JWT token for a user with session management
   */
  generateToken(user: AuthUser, sessionId?: string): string {
    if (!this.isJwtConfigured()) {
      throw new Error("JWT secret is not configured");
    }

    // Generate a new session ID or use provided one
    const session = sessionId || crypto.randomBytes(16).toString("hex");

    // Generate a unique JWT ID for token revocation
    const jwtId = crypto.randomBytes(16).toString("hex");

    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      sessionId: session,
    };

    // Log the session creation if sessionLogsService is available
    try {
      const { logSystemAction } = require("../services/sessionLogsService");
      logSystemAction(
        "auth:session:created",
        "User session created",
        "success",
        user.id
      ).catch((err: Error) => {
        console.error("Failed to log session creation:", err);
      });
    } catch (error) {
      // sessionLogsService might not be available
      console.log("Session logging service not available");
    }

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "24h", // Token expires in 24 hours
      jwtid: jwtId, // Set the JWT ID in the token options (this will add 'jti' to the payload)
    });
  }

  /**
   * Verify and decode a JWT token, checking if it has been revoked
   */
  async verifyToken(token: string): Promise<AuthTokenPayload | null> {
    if (!this.isJwtConfigured()) {
      throw new Error("JWT secret is not configured");
    }

    try {
      // First verify the token signature and expiration
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as AuthTokenPayload;

      // Check if the token has been revoked
      if (payload.jti) {
        const isRevoked = await this.isTokenRevoked(payload.jti);
        if (isRevoked) {
          console.warn(`Token with jti ${payload.jti} has been revoked`);
          return null;
        }
      } else {
        // For backwards compatibility with tokens that don't have jti
        console.warn(
          "Token does not have a jti claim, skipping revocation check"
        );
      }

      return payload;
    } catch (error) {
      console.error("Error verifying token:", error);
      return null;
    }
  }

  /**
   * Check if token is revoked using Drizzle
   */
  private async isTokenRevoked(jti: string): Promise<boolean> {
    try {
      const [result] = await db
        .select()
        .from(revoked_tokens)
        .where(eq(revoked_tokens.token_jti, jti))
        .limit(1);

      return !!result;
    } catch (error) {
      console.error("Exception checking for revoked token:", error);
      return false;
    }
  }

  /**
   * Revoke a token
   */
  async revokeToken(
    token: string,
    reason: string = "user_logout"
  ): Promise<boolean> {
    try {
      // Decode token to get the payload
      let payload: AuthTokenPayload | null = null;
      try {
        payload = await this.verifyToken(token);
      } catch (error) {
        // If verification fails, try to decode without verification
        payload = jwt.decode(token) as AuthTokenPayload;
      }

      if (!payload || !payload.jti || !payload.userId) {
        console.error(
          "Cannot revoke token: Invalid or missing jti/userId in token payload"
        );
        return false;
      }

      // Calculate token expiration
      let expiresAt: Date;
      if ((payload as any).exp) {
        expiresAt = new Date((payload as any).exp * 1000);
      } else {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
      }

      // Insert into revoked_tokens table
      await db.insert(revoked_tokens).values({
        token_jti: payload.jti,
        user_id: payload.userId,
        revoked_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        reason,
      });

      return true;
    } catch (error) {
      console.error("Exception revoking token:", error);
      return false;
    }
  }

  /**
   * Clean up expired revoked tokens to keep the table small
   */
  private async cleanupExpiredRevokedTokens(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc(
        "cleanup_expired_revoked_tokens"
      );

      if (error) {
        console.error("Error cleaning up expired revoked tokens:", error);
        return 0;
      }

      console.log(`Cleaned up ${data} expired revoked tokens`);
      return data || 0;
    } catch (error) {
      console.error("Exception cleaning up expired revoked tokens:", error);
      return 0;
    }
  }

  /**
   * Validate Supabase token
   */
  async validateSupabaseToken(token: string): Promise<AuthUser | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      // Get user's profile from database
      const userProfile = await this.getUserWithProfile(user.id);

      if (!userProfile) {
        return null;
      }

      const authUser: AuthUser = {
        id: userProfile.id,
        email: userProfile.email!,
        name: userProfile.name || "",
        locations: userProfile.locations?.map((ul: any) => ({
          id: ul.location.id,
          name: ul.location.name,
          role: {
            id: ul.role.id,
            name: ul.role.name,
            permissions: ul.role.permissions as UserPermissions,
          },
        })),
      };

      return authUser;
    } catch (error) {
      console.error("Error validating Supabase token:", error);
      return null;
    }
  }

  /**
   * Get user with profile and locations
   */
  private async getUserWithProfile(userId: string): Promise<any | null> {
    try {
      const [userProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);

      if (!userProfile) {
        return null;
      }

      // Get user locations with roles
      const userLocations = await db
        .select({
          location: locations,
          role: user_roles,
        })
        .from(user_locations)
        .innerJoin(locations, eq(user_locations.location_id, locations.id))
        .innerJoin(user_roles, eq(user_locations.role_id, user_roles.id))
        .where(eq(user_locations.user_id, userId));

      return {
        ...userProfile,
        locations: userLocations,
      };
    } catch (error) {
      console.error("Error getting user with profile:", error);
      return null;
    }
  }

  /**
   * Get user permissions
   */
  private async getUserPermissions(userId: string): Promise<UserPermissions> {
    try {
      // Get user's primary role
      const [userLocation] = await db
        .select({
          role: user_roles,
        })
        .from(user_locations)
        .innerJoin(user_roles, eq(user_locations.role_id, user_roles.id))
        .where(eq(user_locations.user_id, userId))
        .limit(1);

      if (!userLocation) {
        // Default permissions for users without locations
        return {
          "inventory:read": true,
          "inventory:write": false,
          "inventory:delete": false,
          "user:read": false,
          "user:write": false,
        };
      }

      return userLocation.role.permissions as UserPermissions;
    } catch (error) {
      console.error("Error getting user permissions:", error);
      return {
        "inventory:read": true,
        "inventory:write": false,
        "inventory:delete": false,
        "user:read": false,
        "user:write": false,
      };
    }
  }

  /**
   * Create user profile
   */
  private async createUserProfile(data: {
    id: string;
    email: string | null;
    name: string;
  }): Promise<any> {
    console.log("Attempting to create profile for ID:", data.id);
    try {
      // Check if profile already exists
      const [existingProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, data.id))
        .limit(1);

      if (existingProfile) {
        console.log("Found existing profile:", existingProfile);
        throw new Error("Profile already exists for this user");
      }

      const [profile] = await db
        .insert(profiles)
        .values({
          id: data.id,
          email: data.email,
          name: data.name,
        })
        .returning();

      return profile;
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  }

  /**
   * Authenticate a user based on credentials using Supabase Auth with session management
   */
  async authenticateUser(
    email: string,
    password: string
  ): Promise<{
    user: AuthUser;
    token: string;
    sessionId: string;
  } | null> {
    try {
      console.log("Attempting to authenticate user:", email);

      // Authenticate with Supabase Auth using the anon client
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase auth error details:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        return null;
      }

      if (!data.user) {
        console.error("No user data returned from Supabase");
        return null;
      }

      console.log("Supabase authentication successful for:", email);

      // Get user's profile with locations
      const userProfile = await this.getUserWithProfile(data.user.id);

      if (!userProfile) {
        console.error("User profile not found");
        return null;
      }

      // Create AuthUser object with locations
      const authUser: AuthUser = {
        id: userProfile.id,
        email: userProfile.email!,
        name: userProfile.name || "User",
        locations:
          userProfile.locations?.map((ul: any) => ({
            id: ul.location.id,
            name: ul.location.name,
            role: {
              id: ul.role.id,
              name: ul.role.name,
              permissions: ul.role.permissions as UserPermissions,
            },
          })) || [],
      };

      // Generate a new session ID for this login
      const sessionId = crypto.randomBytes(16).toString("hex");

      // Create a User object for token generation (without locations)
      const userForToken: AuthUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
      };

      // Generate our own JWT with the session ID
      const token = this.generateToken(userForToken, sessionId);

      console.log("Generated token:");

      return {
        user: authUser,
        token,
        sessionId,
      };
    } catch (error) {
      console.error("Error authenticating user:", error);
      return null;
    }
  }

  /**
   * Create a new invite code
   */
  async createInviteCode(
    role: string,
    locationId: string,
    createdBy: string,
    expiresInDays: number = 7
  ): Promise<InviteCode | null> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      const [inviteData] = await db
        .insert(invite_codes)
        .values({
          code: code,
          role: role,
          location_id: locationId,
          created_by: createdBy,
          expires_at: expiresAt.toISOString(),
        })
        .returning();

      return inviteData as InviteCode;
    } catch (error) {
      console.error("Error creating invite code:", error);
      return null;
    }
  }

  /**
   * Validate an invite code
   */
  async validateInviteCode(
    code: string
  ): Promise<{ valid: boolean; role?: string; locationId?: string }> {
    try {
      const [inviteCodeData] = await db
        .select({
          role: invite_codes.role,
          location_id: invite_codes.location_id,
          expires_at: invite_codes.expires_at,
          used_by: invite_codes.used_by,
        })
        .from(invite_codes)
        .where(
          and(
            eq(invite_codes.code, code),
            isNull(invite_codes.used_by),
            gt(invite_codes.expires_at, new Date().toISOString())
          )
        )
        .limit(1);

      if (!inviteCodeData) {
        return { valid: false };
      }

      return {
        valid: true,
        role: inviteCodeData.role,
        locationId: inviteCodeData.location_id,
      };
    } catch (error) {
      console.error("Error validating invite code:", error);
      return { valid: false };
    }
  }

  /**
   * Mark an invite code as used
   */
  async markInviteCodeAsUsed(code: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .update(invite_codes)
        .set({
          used_by: userId,
          used_at: new Date().toISOString(),
        })
        .where(eq(invite_codes.code, code));

      return !!result;
    } catch (error) {
      console.error("Error marking invite code as used:", error);
      return false;
    }
  }

  /**
   * Register a new user with Supabase Auth with enhanced authentication flow
   */
  async registerUser(
    email: string,
    password: string,
    name: string,
    inviteCode?: string,
    locationName?: string
  ): Promise<{ user: AuthUser; token: string; sessionId: string } | null> {
    try {
      // Check if user with this email already exists
      const { data: users, error: listError } =
        await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error("Error listing users:", listError);
        throw new Error("Failed to check existing users");
      }
      const existingUser = users.users.find((u) => u.email === email);
      if (existingUser) {
        console.log(
          `User with email ${email} already exists:`,
          existingUser.id
        );
        throw new Error("User with this email already exists");
      }

      // Proceed with role and location setup
      let role = UserRoleEnum.READONLY;
      let locationId: string | undefined;

      if (inviteCode) {
        const {
          valid,
          role: inviteRole,
          locationId: inviteLocationId,
        } = await this.validateInviteCode(inviteCode);
        if (!valid) throw new Error("Invalid or expired invite code");
        role = inviteRole as UserRoleEnum;
        locationId = inviteLocationId;
      } else if (locationName) {
        const [newLocation] = await db
          .insert(locations)
          .values({
            name: locationName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .returning();
        locationId = newLocation.id;
        role = UserRoleEnum.OWNER;
      } else {
        throw new Error("Either invite code or location name is required");
      }

      // Register user with Supabase
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role },
        email_confirm: true,
      });

      if (error || !data.user) {
        console.error("Supabase registration error:", error);
        throw new Error("Registration failed");
      }

      const userId = data.user.id;

      // Verify user exists in auth.users
      const { data: userCheck } = await supabaseAdmin.auth.admin.getUserById(
        userId
      );
      if (!userCheck.user) {
        console.error("User not found in auth.users after creation:", userId);
        throw new Error("User creation failed or user not found");
      }

      // Fetch the existing profile (created by the trigger)
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);

      if (!profile) {
        console.error("Profile not found after user creation:", userId);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw new Error("Profile not created");
      }

      // Get role data
      const [roleData] = await db
        .select()
        .from(user_roles)
        .where(eq(user_roles.name, role))
        .limit(1);

      if (!roleData) {
        console.error(`Role ${role} not found`);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw new Error(`Role ${role} not found`);
      }

      // Assign user to location
      if (locationId) {
        await db.insert(user_locations).values({
          user_id: userId,
          location_id: locationId,
          role_id: roleData.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Mark invite code as used
      if (inviteCode) {
        await this.markInviteCodeAsUsed(inviteCode, userId);
      }

      // Fetch location name
      let locName = locationName;
      if (inviteCode && locationId) {
        const [loc] = await db
          .select({ name: locations.name })
          .from(locations)
          .where(eq(locations.id, locationId))
          .limit(1);
        locName = loc?.name;
      }

      // Create auth user
      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email!,
        name: profile.name || "",
        locations: locationId
          ? [
              {
                id: locationId,
                name: locName || "",
                role: {
                  id: roleData.id,
                  name: role,
                  permissions: roleData.permissions as UserPermissions,
                },
              },
            ]
          : [],
      };

      const sessionId = crypto.randomBytes(16).toString("hex");
      const token = this.generateToken(authUser, sessionId);

      return { user: authUser, token, sessionId };
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }
}

export default new AuthService();
export type { UserRoleEnum as UserRole, UserPermissions };
