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
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: UserPermissions;
}

// Default permissions for different roles
const rolePermissions: Record<UserRole, UserPermissions> = {
  [UserRole.OWNER]: {
    'inventory:read': true,
    'inventory:write': true,
    'inventory:delete': true,
    'user:read': true,
    'user:write': true
  },
  [UserRole.MANAGER]: {
    'inventory:read': true,
    'inventory:write': true,
    'inventory:delete': false,
    'user:read': true,
    'user:write': false
  },
  [UserRole.STAFF]: {
    'inventory:read': true,
    'inventory:write': true,
    'inventory:delete': false,
    'user:read': false,
    'user:write': false
  },
  [UserRole.READONLY]: {
    'inventory:read': true,
    'inventory:write': false,
    'inventory:delete': false,
    'user:read': false,
    'user:write': false
  }
};

class AuthService {
  /**
   * Helper to check if JWT secret is configured
   */
  private isJwtConfigured(): boolean {
    return Boolean(process.env.JWT_SECRET);
  }

  /**
   * Get permissions for a given role
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
        console.warn(`Role ${role} not found in database, using default permissions`);
        return rolePermissions[role] || rolePermissions[UserRole.READONLY];
      }

      return data.permissions as UserPermissions;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return rolePermissions[role] || rolePermissions[UserRole.READONLY];
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
   * Generate a JWT token for a user
   */
  generateToken(user: User): string {
    if (!this.isJwtConfigured()) {
      throw new Error('JWT secret is not configured');
    }

    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h' // Token expires in 24 hours
    });
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): AuthTokenPayload | null {
    if (!this.isJwtConfigured()) {
      throw new Error('JWT secret is not configured');
    }

    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as AuthTokenPayload;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
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
      
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || 'User',
        role,
        permissions
      };
    } catch (error) {
      console.error('Error validating Supabase token:', error);
      return null;
    }
  }

  /**
   * Authenticate a user based on credentials using Supabase Auth
   */
  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
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
      
      // Generate our own JWT (optional, you could use Supabase's token)
      const token = this.generateToken(user);
      
      return {
        user,
        token
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }
  
  /**
   * Register a new user with Supabase Auth
   */
  async registerUser(email: string, password: string, name: string, role: UserRole = UserRole.STAFF): Promise<{ user: User; token: string } | null> {
    try {
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
      
      // Generate JWT
      const token = this.generateToken(user);
      
      return {
        user,
        token
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return null;
    }
  }
}

export default new AuthService();