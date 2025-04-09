/**
 * Utility for creating consistent Supabase mocks
 */
import { jest } from '@jest/globals';

/**
 * Creates a chainable mock for Supabase queries
 */
export const createSupabaseMock = () => {
  const createQueryBuilder = () => {
    const builder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      data: null,
      error: null
    };
    
    builder.then = jest.fn((callback: any) => {
      return Promise.resolve(callback({ data: builder.data, error: builder.error }));
    });
    
    builder.mockResolvedValue = function(value: any) {
      this.single = jest.fn().mockImplementation(() => {
        return {
          then: (callback: any) => Promise.resolve(callback(value))
        };
      });
      return this;
    };
    
    return builder;
  };
  
  const mockAuth: any = {
    signInWithPassword: jest.fn(),
    admin: {
      createUser: jest.fn(),
    },
    getUser: jest.fn(),
  };
  
  mockAuth.signInWithPassword.mockImplementation(() => Promise.resolve({ data: null, error: null }));
  mockAuth.admin.createUser.mockImplementation(() => Promise.resolve({ data: null, error: null }));
  mockAuth.getUser.mockImplementation(() => Promise.resolve({ data: null, error: null }));
  
  const mockDb: any = {
    from: jest.fn().mockImplementation(() => createQueryBuilder()),
    auth: mockAuth,
    rpc: jest.fn().mockImplementation(() => createQueryBuilder()),
  };
  
  return mockDb;
};
