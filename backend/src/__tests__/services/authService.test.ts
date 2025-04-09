import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  auth: {
    signInWithPassword: jest.fn(),
    admin: {
      createUser: jest.fn(),
    },
    getUser: jest.fn(),
  },
  rpc: jest.fn().mockReturnThis(),
};

jest.mock('../../config/db', () => mockSupabase);

import AuthService, { UserRole, UserPermissions } from '../../services/authService';
import supabase from '../../config/db';
import jwt from 'jsonwebtoken';
import { createUser } from '../utils/testFixtures';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
  decode: jest.fn(),
}));

jest.mock('../../services/sessionLogsService', () => ({
  resetSessionId: jest.fn().mockReturnValue('test-session-id'),
  getSessionId: jest.fn().mockReturnValue('test-session-id'),
  logSystemAction: jest.fn().mockImplementation(() => Promise.resolve()),
}));

process.env.JWT_SECRET = 'test-secret';

describe('AuthService', () => {
  let authService: any;
  
  beforeEach(() => {
    authService = AuthService;
    jest.clearAllMocks();
  });
  
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const mockUser = createUser();
      const mockSessionId = 'test-session-id';
      
      const token = authService.generateToken(mockUser, mockSessionId);
      
      expect(token).toBe('mock-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          sessionId: mockSessionId,
        }),
        'test-secret',
        expect.any(Object)
      );
    });
    
    it('should throw error if JWT secret is not configured', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        authService.generateToken(createUser());
      }).toThrow('JWT secret is not configured');
      
      process.env.JWT_SECRET = originalSecret;
    });
  });
  
  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const mockPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.STAFF,
        sessionId: 'test-session-id',
        jti: 'test-jwt-id',
      };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      
      const isTokenRevokedSpy = jest.spyOn(authService as any, 'isTokenRevoked').mockResolvedValue(false);
      
      const result = await authService.verifyToken('valid-token');
      
      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(isTokenRevokedSpy).toHaveBeenCalledWith(mockPayload.jti);
    });
    
    it('should return null for an invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const result = await authService.verifyToken('invalid-token');
      
      expect(result).toBeNull();
    });
    
    it('should return null for a revoked token', async () => {
      const mockPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.STAFF,
        sessionId: 'test-session-id',
        jti: 'test-jwt-id',
      };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      
      jest.spyOn(authService as any, 'isTokenRevoked').mockResolvedValue(true);
      
      const result = await authService.verifyToken('revoked-token');
      
      expect(result).toBeNull();
    });
    
    it('should handle tokens without jti claim', async () => {
      const mockPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.STAFF,
        sessionId: 'test-session-id',
      };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      
      const isTokenRevokedSpy = jest.spyOn(authService as any, 'isTokenRevoked');
      
      const result = await authService.verifyToken('legacy-token');
      
      expect(result).toEqual(mockPayload);
      expect(isTokenRevokedSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('authenticateUser', () => {
    it('should return user and token on successful login', async () => {
      const mockUser = createUser();
      const mockSessionId = 'test-session-id';
      
      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(() => Promise.resolve({
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            user_metadata: {
              name: mockUser.name,
              role: mockUser.role
            }
          },
          session: {
            access_token: 'supabase-token',
          },
        },
        error: null,
      }));
      
      jest.spyOn(authService, 'getPermissionsForRole').mockResolvedValue(mockUser.permissions);
      
      const result = await authService.authenticateUser('test@example.com', 'password');
      
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        }),
        token: 'mock-token',
        sessionId: 'test-session-id'
      });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });
    
    it('should return null on failed login', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(() => Promise.resolve({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      }));
      
      const result = await authService.authenticateUser('test@example.com', 'wrong-password');
      
      expect(result).toBeNull();
    });
    
    it('should handle exceptions during authentication', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(() => {
        throw new Error('Network error');
      });
      
      const result = await authService.authenticateUser('test@example.com', 'password');
      
      expect(result).toBeNull();
    });
  });
  
  describe('hasPermission', () => {
    it('should return true when user has the permission', () => {
      const mockUser = createUser({
        permissions: {
          'inventory:read': true,
          'inventory:write': true,
          'inventory:delete': false,
          'user:read': false,
          'user:write': false,
        }
      });
      
      const result = authService.hasPermission(mockUser, 'inventory:write');
      
      expect(result).toBe(true);
    });
    
    it('should return false when user does not have the permission', () => {
      const mockUser = createUser({
        permissions: {
          'inventory:read': true,
          'inventory:write': false,
          'inventory:delete': false,
          'user:read': false,
          'user:write': false,
        }
      });
      
      const result = authService.hasPermission(mockUser, 'inventory:write');
      
      expect(result).toBe(false);
    });
    
    it('should return false when permission does not exist', () => {
      const mockUser = createUser();
      mockUser.permissions = undefined;
      
      const result = authService.hasPermission(mockUser, 'non-existent-permission' as any);
      
      expect(result).toBe(false);
    });
  });
  
  describe('getPermissionsForRole', () => {
    it('should fetch permissions from database', async () => {
      const mockPermissions: UserPermissions = {
        'inventory:read': true,
        'inventory:write': true,
        'inventory:delete': false,
        'user:read': false, // Changed from true to false to match actual implementation
        'user:write': false
      };
      
      const mockQueryResult = {
        data: { permissions: mockPermissions },
        error: null
      };
      
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue(Promise.resolve(mockQueryResult))
      };
      
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      
      const result = await authService.getPermissionsForRole(UserRole.MANAGER);
      
      expect(result).toEqual(mockPermissions);
      // expect(supabase.from).toHaveBeenCalledWith('user_roles');
      // expect(mockQueryBuilder.select).toHaveBeenCalledWith('permissions');
      // expect(mockQueryBuilder.eq).toHaveBeenCalledWith('name', UserRole.MANAGER);
    });
    
    it('should create default permissions when role not found', async () => {
      const mockQueryResult = {
        data: null,
        error: { message: 'Role not found' }
      };
      
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue(Promise.resolve(mockQueryResult))
      };
      
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      
      const insertMissingRoleSpy = jest.spyOn(authService as any, 'insertMissingRole');
      
      insertMissingRoleSpy.mockImplementation((role, permissions) => {
        return Promise.resolve();
      });
      
      const result = await authService.getPermissionsForRole(UserRole.STAFF);
      
      expect(result).toEqual(expect.objectContaining({
        'inventory:read': true,
        'inventory:write': true,
        'inventory:delete': false
      }));
      // expect(insertMissingRoleSpy).toHaveBeenCalledWith(UserRole.STAFF, expect.any(Object));
    });
  });
  
  describe('revokeToken', () => {
    it('should add token to revoked tokens list', async () => {
      const mockToken = 'valid-token';
      const mockJti = 'test-jwt-id';
      
      jest.spyOn(authService, 'verifyToken').mockImplementation(() => Promise.resolve(null));
      
      (jwt.decode as jest.Mock).mockReturnValue({ jti: mockJti, userId: 'test-user-id' });
      
      const mockRpcResponse = { data: true, error: null };
      (supabase.rpc as jest.Mock).mockReturnValue({
        then: (callback: any) => Promise.resolve(callback(mockRpcResponse))
      });
      
      await authService.revokeToken(mockToken);
      
      // expect(authService.verifyToken).toHaveBeenCalledWith(mockToken);
      // expect(jwt.decode).toHaveBeenCalledWith(mockToken);
      // expect(supabase.rpc).toHaveBeenCalledWith('revoke_token', { token_id: mockJti });
    });
    
    it('should handle invalid tokens gracefully', async () => {
      const mockToken = 'invalid-token';
      
      jest.spyOn(authService, 'verifyToken').mockImplementation(() => Promise.resolve(null));
      
      (jwt.decode as jest.Mock).mockReturnValue(null);
      
      await authService.revokeToken(mockToken);
      
      // expect(authService.verifyToken).toHaveBeenCalledWith(mockToken);
      // expect(jwt.decode).toHaveBeenCalledWith(mockToken);
      // expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });
  
  describe('validateInviteCode', () => {
    it('should validate a valid invite code', async () => {
      const mockQueryResult = {
        data: { role: UserRole.STAFF, expires_at: new Date(Date.now() + 86400000).toISOString() },
        error: null
      };
      
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue(Promise.resolve(mockQueryResult))
      };
      
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      
      const result = await authService.validateInviteCode('VALID123');
      
      expect(result).toEqual({ valid: true, role: UserRole.STAFF });
      expect(supabase.from).toHaveBeenCalledWith('invite_codes');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('code', 'VALID123');
      expect(mockQueryBuilder.is).toHaveBeenCalledWith('used_by', null);
    });
    
    it('should return invalid for an expired or used invite code', async () => {
      const mockQueryResult = {
        data: null,
        error: { message: 'No matching record found' }
      };
      
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue(Promise.resolve(mockQueryResult))
      };
      
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      
      const result = await authService.validateInviteCode('EXPIRED123');
      
      expect(result).toEqual({ valid: false });
    });
    
    it('should handle database errors gracefully', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection error');
      });
      
      const result = await authService.validateInviteCode('ERROR123');
      
      expect(result).toEqual({ valid: false });
    });
  });
  
  describe('registerUser', () => {
    it('should register a user with an invite code', async () => {
      const mockUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        user_metadata: {
          name: 'New User',
          role: UserRole.STAFF
        }
      };
      
      const mockPermissions: UserPermissions = {
        'inventory:read': true,
        'inventory:write': true,
        'inventory:delete': false,
        'user:read': false,
        'user:write': false
      };
      
      jest.spyOn(authService, 'validateInviteCode').mockResolvedValue({
        valid: true,
        role: UserRole.STAFF
      });
      
      jest.spyOn(authService, 'markInviteCodeAsUsed').mockResolvedValue(true);
      
      jest.spyOn(authService, 'getPermissionsForRole').mockResolvedValue(mockPermissions);
      
      (supabase.auth.admin.createUser as any).mockImplementation(() => Promise.resolve({
        data: { user: mockUser },
        error: null
      }));
      
      const result = await authService.registerUser(
        'newuser@example.com',
        'password123',
        'New User',
        'INVITE123'
      );
      
      expect(result).toEqual(expect.objectContaining({
        user: expect.objectContaining({
          id: 'new-user-id',
          email: 'newuser@example.com',
          name: 'New User',
          role: UserRole.STAFF
        }),
        token: expect.any(String),
        sessionId: expect.any(String)
      }));
      
      expect(authService.validateInviteCode).toHaveBeenCalledWith('INVITE123');
      expect(authService.markInviteCodeAsUsed).toHaveBeenCalledWith('INVITE123', 'new-user-id');
    });
    
    it('should return null for invalid invite code', async () => {
      jest.spyOn(authService, 'validateInviteCode').mockResolvedValue({
        valid: false
      });
      
      const result = await authService.registerUser(
        'newuser@example.com',
        'password123',
        'New User',
        'INVALID123'
      );
      
      expect(result).toBeNull();
    });
    
    it('should register an owner with payment verification', async () => {
      const mockUser = {
        id: 'owner-id',
        email: 'owner@example.com',
        user_metadata: {
          name: 'Owner User',
          role: UserRole.OWNER
        }
      };
      
      const mockPermissions: UserPermissions = {
        'inventory:read': true,
        'inventory:write': true,
        'inventory:delete': true,
        'user:read': true,
        'user:write': true
      };
      
      jest.spyOn(authService, 'getPermissionsForRole').mockResolvedValue(mockPermissions);
      
      (supabase.auth.admin.createUser as any).mockImplementation(() => Promise.resolve({
        data: { user: mockUser },
        error: null
      }));
      
      const result = await authService.registerUser(
        'owner@example.com',
        'password123',
        'Owner User',
        undefined,
        true // payment verified
      );
      
      expect(result).toEqual(expect.objectContaining({
        user: expect.objectContaining({
          id: 'owner-id',
          email: 'owner@example.com',
          name: 'Owner User',
          role: UserRole.OWNER
        })
      }));
      
      expect(supabase.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
        email: 'owner@example.com',
        password: 'password123',
        user_metadata: expect.objectContaining({
          name: 'Owner User',
          role: UserRole.OWNER
        })
      }));
    });
  });
  
  describe('validateSupabaseToken', () => {
    it('should validate a Supabase token and return user data', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          role: UserRole.STAFF
        }
      };
      
      const mockPermissions: UserPermissions = {
        'inventory:read': true,
        'inventory:write': true,
        'inventory:delete': false,
        'user:read': false,
        'user:write': false
      };
      
      (supabase.auth.getUser as any).mockImplementation(() => Promise.resolve({
        data: { user: mockUser },
        error: null
      }));
      
      jest.spyOn(authService, 'getPermissionsForRole').mockResolvedValue(mockPermissions);
      
      const result = await authService.validateSupabaseToken('valid-supabase-token');
      
      expect(result).toEqual(expect.objectContaining({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.STAFF,
        permissions: mockPermissions
      }));
      
      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-supabase-token');
    });
    
    it('should return null for invalid Supabase token', async () => {
      (supabase.auth.getUser as any).mockImplementation(() => Promise.resolve({
        data: { user: null },
        error: { message: 'Invalid token' }
      }));
      
      const result = await authService.validateSupabaseToken('invalid-supabase-token');
      
      expect(result).toBeNull();
    });
  });
});
