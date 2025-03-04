// backend/src/services/authService.ts
import supabase from '../config/db';
import jwt from 'jsonwebtoken';

// Define types for user roles and permissions
export enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  STAFF = 'staff',
  READONLY = 'readonly'
}

export interface UserPermissions {
  'inventory:read': boolean;
  'inventory:write': boolean;
  'inventory:delete': boolean;
  'user:read': boolean;
  'user:write': boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: UserPermissions;
  sessionId?: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: UserPermissions;
  sessionId: string;
  jti: string; // JWT ID for token revocation
}

// Default permissions are now stored in the database (user_roles table)

interface InviteCode {
  id: string;
  code: string;
  role: UserRole;
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
  async getPermissionsForRole(role: UserRole): Promise<UserPermissions> {
    try {
      // Get permissions from database
      const { data, error } = await supabase
        .from('user_roles')
        .select('permissions')
        .eq('name', role)
        .single();

      if (error || !data) {
        console.error(`Role ${role} not found in database, this should never happen!`);
        // Create default fallback permission based on role
        const defaultPermissions: UserPermissions = {
          'inventory:read': true,  // All roles can read inventory
          'inventory:write': role !== UserRole.READONLY, // All except READONLY can write
          'inventory:delete': role === UserRole.OWNER, // Only OWNER can delete
          'user:read': role === UserRole.OWNER || role === UserRole.MANAGER, // OWNER and MANAGER can read users
          'user:write': role === UserRole.OWNER // Only OWNER can write users
        };
        
        // Try to insert the missing role into the database for future use
        await this.insertMissingRole(role, defaultPermissions);
        return defaultPermissions;
      }

      return data.permissions as UserPermissions;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // If there's an error, default to read-only permissions for safety
      return {
        'inventory:read': true,
        'inventory:write': false,
        'inventory:delete': false,
        'user:read': false,
        'user:write': false
      };
    }
  }
  
  /**
   * Insert a missing role into the database with default permissions
   * This is a recovery mechanism in case a role is missing
   */
  private async insertMissingRole(role: UserRole, permissions: UserPermissions): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          name: role,
          permissions: permissions
        });
        
      if (error) {
        console.error(`Failed to insert missing role ${role}:`, error);
      } else {
        console.log(`Successfully inserted missing role ${role} with default permissions`);
      }
    } catch (error) {
      console.error(`Error inserting missing role ${role}:`, error);
    }
  }

  /**
   * Validate if a user has a specific permission
   */
  hasPermission(user: User, permission: keyof UserPermissions): boolean {
    if (!user.permissions) {
      return false;
    }
    return user.permissions[permission] === true;
  }

  /**
   * Generate a JWT token for a user with session management
   */
  generateToken(user: User, sessionId?: string): string {
    if (!this.isJwtConfigured()) {
      throw new Error('JWT secret is not configured');
    }

    // Import here to avoid circular dependency
    const { resetSessionId, getSessionId } = require('../services/sessionLogsService');
    
    // Generate a new session ID or use provided one
    const session = sessionId || resetSessionId();
    
    // Generate a unique JWT ID for token revocation
    const jwtId = require('crypto').randomBytes(16).toString('hex');
    
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      sessionId: session,
      jti: jwtId // Include the JWT ID in the payload
    };

    // Log the session creation
    const { logSystemAction } = require('../services/sessionLogsService');
    logSystemAction('auth:session:created', 'User session created', 'success', user.id).catch((err: Error) => {
      console.error('Failed to log session creation:', err);
    });

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h', // Token expires in 24 hours
      jwtid: jwtId // Set the JWT ID in the token
    });
  }

  /**
   * Verify and decode a JWT token, checking if it has been revoked
   */
  async verifyToken(token: string): Promise<AuthTokenPayload | null> {
    if (!this.isJwtConfigured()) {
      throw new Error('JWT secret is not configured');
    }

    try {
      // First verify the token signature and expiration
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthTokenPayload;
      
      // Check if the token has been revoked
      if (payload.jti) {
        const isRevoked = await this.isTokenRevoked(payload.jti);
        if (isRevoked) {
          console.warn(`Token with jti ${payload.jti} has been revoked`);
          return null;
        }
      } else {
        // For backwards compatibility with tokens that don't have jti
        console.warn('Token does not have a jti claim, skipping revocation check');
      }
      
      return payload;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }
  
  /**
   * Check if a token has been revoked
   */
  private async isTokenRevoked(jti: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('revoked_tokens')
        .select('token_jti')
        .eq('token_jti', jti)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error checking for revoked token:', error);
        // Default to treating the token as valid if we can't check
        return false;
      }
      
      // If we found a record, the token has been revoked
      return !!data;
    } catch (error) {
      console.error('Exception checking for revoked token:', error);
      // Default to treating the token as valid if we can't check
      return false;
    }
  }

  /**
   * Revoke a token (logout)
   */
  async revokeToken(token: string, reason: string = 'user_logout'): Promise<boolean> {
    try {
      // First decode the token to get the payload without verifying
      // This allows us to revoke tokens even if they're expired
      let payload: any;
      try {
        // Try to verify the token first to make sure it's valid
        payload = await this.verifyToken(token);
      } catch (error) {
        // If verification fails, try to decode without verification
        payload = jwt.decode(token) as AuthTokenPayload;
      }
      
      if (!payload || !payload.jti || !payload.userId) {
        console.error('Cannot revoke token: Invalid or missing jti/userId in token payload');
        return false;
      }
      
      // Calculate token expiration from the exp claim
      let expiresAt: Date;
      if (payload.exp) {
        expiresAt = new Date(payload.exp * 1000); // exp is in seconds since epoch
      } else {
        // Default to 24h from now if exp is missing
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
      }
      
      // Insert into revoked_tokens table
      const { error } = await supabase
        .from('revoked_tokens')
        .insert({
          token_jti: payload.jti,
          user_id: payload.userId,
          revoked_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          reason
        });
        
      if (error) {
        console.error('Error revoking token:', error);
        return false;
      }
      
      // Log the logout action if we have a session ID
      if (payload.sessionId) {
        const { logSystemAction } = require('../services/sessionLogsService');
        logSystemAction('auth:session:revoked', 'User session revoked: ' + reason, 'info', payload.userId).catch((err: Error) => {
          console.error('Failed to log session revocation:', err);
        });
      }
      
      // Run cleanup of expired tokens occasionally to keep the table small
      if (Math.random() < 0.1) { // 10% chance on each logout
        this.cleanupExpiredRevokedTokens().catch(err => {
          console.error('Error cleaning up expired revoked tokens:', err);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Exception revoking token:', error);
      return false;
    }
  }
  
  /**
   * Clean up expired revoked tokens to keep the table small
   */
  private async cleanupExpiredRevokedTokens(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_revoked_tokens');
      
      if (error) {
        console.error('Error cleaning up expired revoked tokens:', error);
        return 0;
      }
      
      console.log(`Cleaned up ${data} expired revoked tokens`);
      return data || 0;
    } catch (error) {
      console.error('Exception cleaning up expired revoked tokens:', error);
      return 0;
    }
  }

  /**
   * Check if a Supabase JWT token is valid and get the user data
   */
  async validateSupabaseToken(token: string): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error('Error validating Supabase token:', error);
        return null;
      }
      
      // Get user's role from metadata or default to staff
      const role = (user.user_metadata?.role as UserRole) || UserRole.STAFF;
      
      // Get permissions for the role
      const permissions = await this.getPermissionsForRole(role);
      
      // Generate a new session ID for Supabase tokens
      const { resetSessionId, logSystemAction } = require('../services/sessionLogsService');
      const sessionId = resetSessionId();
      
      // Log the Supabase token validation
      logSystemAction('auth:session:supabase', 'Supabase session validated', 'info', user.id).catch((err: Error) => {
        console.error('Failed to log Supabase session validation:', err);
      });
      
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || 'User',
        role,
        permissions,
        sessionId
      };
    } catch (error) {
      console.error('Error validating Supabase token:', error);
      return null;
    }
  }

  /**
   * Authenticate a user based on credentials using Supabase Auth with session management
   */
  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string; sessionId: string } | null> {
    try {
      // Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error || !data.user) {
        console.error('Supabase authentication error:', error);
        return null;
      }
      
      // Get user's role from metadata or default to staff
      const role = (data.user.user_metadata?.role as UserRole) || UserRole.STAFF;
      
      // Get permissions for the role
      const permissions = await this.getPermissionsForRole(role);
      
      // Create user object
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || 'User',
        role,
        permissions
      };
      
      // Generate a new session ID for this login
      const { resetSessionId, logSystemAction } = require('../services/sessionLogsService');
      const sessionId = resetSessionId();
      
      // Log the login
      await logSystemAction(
        'auth:user:login', 
        `User logged in: ${email}`,
        'success',
        data.user.id
      );
      
      // Generate our own JWT with the session ID
      const token = this.generateToken(user, sessionId);
      
      return {
        user,
        token,
        sessionId
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }
  
  /**
   * Create a new invite code
   */
  async createInviteCode(role: UserRole, createdBy: string, expiresInDays: number = 7): Promise<InviteCode | null> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      
      const { data, error } = await supabase.rpc('generate_invite_code');
      if (error) {
        console.error('Error generating invite code:', error);
        // Fallback to simple random code if RPC fails
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Insert the invite code into the database
        const { data: inviteData, error: insertError } = await supabase
          .from('invite_codes')
          .insert({
            code: code,
            role: role,
            created_by: createdBy,
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('Error creating invite code:', insertError);
          return null;
        }
        
        return inviteData as InviteCode;
      }
      
      // Insert the generated code
      const { data: inviteData, error: insertError } = await supabase
        .from('invite_codes')
        .insert({
          code: data,
          role: role,
          created_by: createdBy,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Error creating invite code:', insertError);
        return null;
      }
      
      return inviteData as InviteCode;
    } catch (error) {
      console.error('Error creating invite code:', error);
      return null;
    }
  }
  
  /**
   * Validate an invite code
   */
  async validateInviteCode(code: string): Promise<{ valid: boolean; role?: UserRole }> {
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('role, expires_at')
        .eq('code', code)
        .is('used_by', null)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (error || !data) {
        return { valid: false };
      }
      
      return { valid: true, role: data.role as UserRole };
    } catch (error) {
      console.error('Error validating invite code:', error);
      return { valid: false };
    }
  }
  
  /**
   * Mark an invite code as used
   */
  async markInviteCodeAsUsed(code: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invite_codes')
        .update({
          used_by: userId,
          used_at: new Date().toISOString()
        })
        .eq('code', code);
      
      return !error;
    } catch (error) {
      console.error('Error marking invite code as used:', error);
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
    paymentVerified?: boolean
  ): Promise<{ user: User; token: string; sessionId: string } | null> {
    try {
      let role = UserRole.READONLY; // Default to readonly
      
      // Determine the appropriate role based on input parameters
      if (inviteCode) {
        // If invite code is provided, validate it
        const { valid, role: inviteRole } = await this.validateInviteCode(inviteCode);
        if (!valid) {
          throw new Error('Invalid or expired invite code');
        }
        role = inviteRole || UserRole.STAFF;
      } else if (paymentVerified) {
        // If payment is verified and no invite code, they can be an owner
        role = UserRole.OWNER;
      } else if (role !== UserRole.READONLY) {
        // Per the App Flow Document, all non-readonly roles require either an invite code or payment verification
        throw new Error('Invite code required for staff and management roles');
      }
      
      // Register with Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role },
        email_confirm: true // Auto-confirm email for simplicity
      });
      
      if (error || !data.user) {
        console.error('Supabase registration error:', error);
        return null;
      }
      
      // If invite code was provided, mark it as used
      if (inviteCode) {
        await this.markInviteCodeAsUsed(inviteCode, data.user.id);
      }
      
      // Get permissions for the role
      const permissions = await this.getPermissionsForRole(role);
      
      // Create user object
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || name,
        role,
        permissions
      };
      
      // Generate a new session ID and log onboarding
      const { resetSessionId, logSystemAction } = require('../services/sessionLogsService');
      const sessionId = resetSessionId();
      
      // Log the user registration
      await logSystemAction(
        'auth:user:registered', 
        `New user registered: ${email} with role ${role}`,
        'success',
        data.user.id
      );
      
      // Generate JWT with the session ID
      const token = this.generateToken(user, sessionId);
      
      return {
        user,
        token,
        sessionId
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return null;
    }
  }
}

export default new AuthService();