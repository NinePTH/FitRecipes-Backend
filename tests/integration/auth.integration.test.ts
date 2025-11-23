import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as AuthService from '@/services/authService';
import * as AuthController from '@/controllers/authController';
import { prisma } from '@/utils/database';
import { hashPassword, comparePassword, generateToken } from '@/utils/auth';
import { Context } from 'hono';

/**
 * Integration Tests for Authentication Flow
 *
 * These tests verify the integration between controller, service, and database layers
 * using mocked dependencies to ensure isolation and reliability.
 */

// Mock external dependencies
vi.mock('@/utils/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    session: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/utils/auth', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock('@/utils/email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  generateResetToken: vi.fn().mockReturnValue('reset-token-123'),
  generateVerificationToken: vi.fn().mockReturnValue('verify-token-123'),
}));

// Helper to create mock Hono context
const createMockContext = (body: any = {}, headers: any = {}): Context => {
  const mockResponse = {
    status: 200,
    headers: new Map(),
  };

  return {
    req: {
      json: vi.fn().mockResolvedValue(body),
      header: vi.fn((key: string) => headers[key]),
      param: vi.fn(),
    },
    json: vi.fn((data: any, status?: number) => {
      mockResponse.status = status || 200;
      return new Response(JSON.stringify(data), {
        status: mockResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
    get: vi.fn(),
    set: vi.fn(),
  } as any;
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long';
  });

  describe('Complete Registration Flow', () => {
    it('should successfully register a new user through all layers', async () => {
      // Arrange: Set up test data
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password@123',
        agreeToTerms: true,
      };

      const mockHashedPassword = 'hashed_password_123';
      const mockToken = 'jwt_token_123';
      const mockUserId = 'user_123';

      // Mock database responses
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // No existing user
      vi.mocked(hashPassword).mockResolvedValue(mockHashedPassword);
      vi.mocked(generateToken).mockReturnValue(mockToken);

      vi.mocked(prisma.user.create).mockResolvedValue({
        id: mockUserId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: mockHashedPassword,
        role: 'USER',
        termsAccepted: true,
        emailVerified: false,
        isOAuthUser: false,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        googleId: null,
        oauthProvider: null,
        verificationToken: 'verify-token-123',
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.session.create).mockResolvedValue({
        id: 'session_123',
        userId: mockUserId,
        token: mockToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any);

      // Act: Register user through controller
      const context = createMockContext(userData);
      const response = await AuthController.register(context);
      const responseData = await response.json();

      // Assert: Verify complete flow
      expect(response.status).toBe(201);
      expect(responseData.status).toBe('success');
      expect(responseData.message).toBe('Registration successful');
      expect(responseData.data.user).toMatchObject({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user', // Role is lowercase in response
        termsAccepted: true,
        isOAuthUser: false,
      });
      expect(responseData.data.token).toBe(mockToken);

      // Verify service layer interactions
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(hashPassword).toHaveBeenCalledWith(userData.password);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.session.create).toHaveBeenCalled();
      expect(generateToken).toHaveBeenCalled();
    });

    it('should reject registration if user already exists', async () => {
      // Arrange: User already exists
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'Password@123',
        agreeToTerms: true,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing_user_123',
        email: userData.email,
        emailVerified: true,
      } as any);

      // Act
      const context = createMockContext(userData);
      const response = await AuthController.register(context);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.status).toBe('error');
      expect(responseData.message).toBe('Account already exists');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject registration without terms acceptance', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password@123',
        agreeToTerms: false, // Not agreed
      };

      // Act
      const context = createMockContext(userData);
      const response = await AuthController.register(context);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.status).toBe('error');
      expect(responseData.message).toContain('Terms and Conditions');
    });

    it('should reject registration with invalid email', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email', // Invalid format
        password: 'password123',
        agreeToTerms: true,
      };

      // Act
      const context = createMockContext(userData);
      const response = await AuthController.register(context);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.status).toBe('error');
    });

    it('should reject registration with short password', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: '123', // Too short
        agreeToTerms: true,
      };

      // Act
      const context = createMockContext(userData);
      const response = await AuthController.register(context);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.status).toBe('error');
      expect(responseData.message).toContain('at least 8 characters');
    });
  });

  describe('Complete Login Flow', () => {
    it('should successfully login a user through all layers', async () => {
      // Arrange
      const loginData = {
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user_123',
        email: loginData.email,
        firstName: 'John',
        lastName: 'Doe',
        password: 'hashed_password',
        role: 'USER',
        termsAccepted: true,
        emailVerified: true,
        isOAuthUser: false,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'jwt_token_123';

      // Mock database and auth utilities
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(true);
      vi.mocked(generateToken).mockReturnValue(mockToken);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.session.create).mockResolvedValue({
        id: 'session_123',
        userId: mockUser.id,
        token: mockToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any);

      // Act
      const context = createMockContext(loginData);
      const response = await AuthController.login(context);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.status).toBe('success');
      expect(responseData.message).toBe('Login successful');
      expect(responseData.data.user).toMatchObject({
        email: loginData.email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'user', // Role is lowercase in response
        termsAccepted: true,
        isOAuthUser: false,
      });
      expect(responseData.data.token).toBe(mockToken);

      // Verify service layer interactions
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(comparePassword).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password
      );
      expect(generateToken).toHaveBeenCalled();
      expect(prisma.session.create).toHaveBeenCalled();
    });

    it('should reject login with incorrect password', async () => {
      // Arrange
      const loginData = {
        email: 'john.doe@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 'user_123',
        email: loginData.email,
        password: 'hashed_password',
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(false); // Wrong password
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 1,
      } as any);

      // Act
      const context = createMockContext(loginData);
      const response = await AuthController.login(context);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData.status).toBe('error');
      expect(responseData.message).toBe('Invalid email or password');
      expect(prisma.session.create).not.toHaveBeenCalled();
    });

    it('should reject login for non-existent user', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // User not found

      // Act
      const context = createMockContext(loginData);
      const response = await AuthController.login(context);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData.status).toBe('error');
      expect(responseData.message).toBe('Invalid email or password');
      expect(comparePassword).not.toHaveBeenCalled();
    });

    it('should lock account after 5 failed login attempts', async () => {
      // Arrange
      const loginData = {
        email: 'john.doe@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 'user_123',
        email: loginData.email,
        password: 'hashed_password',
        failedLoginAttempts: 4, // 4th failed attempt
        accountLockedUntil: null,
      };

      const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(false);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 5,
        accountLockedUntil: lockUntil,
      } as any);

      // Act
      const context = createMockContext(loginData);
      const response = await AuthController.login(context);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData.status).toBe('error');
      expect(responseData.message).toBe('Invalid email or password');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 5,
            blockedUntil: expect.any(Date),
          }),
        })
      );
    });

    it('should reject login for locked account', async () => {
      // Arrange
      const loginData = {
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user_123',
        email: loginData.email,
        password: 'hashed_password',
        failedLoginAttempts: 5,
        blockedUntil: new Date(Date.now() + 10 * 60 * 1000), // Still locked
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      // Act
      const context = createMockContext(loginData);
      const response = await AuthController.login(context);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData.status).toBe('error');
      expect(responseData.message).toBe('Account temporarily locked');
      expect(comparePassword).not.toHaveBeenCalled();
    });

    it('should reject login for banned user', async () => {
      // Arrange
      const loginData = {
        email: 'banned.user@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user_123',
        email: loginData.email,
        password: 'hashed_password',
        firstName: 'Banned',
        lastName: 'User',
        role: 'USER',
        isBanned: true,
        bannedAt: new Date('2025-01-15'),
        bannedBy: 'admin_456',
        banReason: 'Violated community guidelines',
        failedLoginAttempts: 0,
        blockedUntil: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      // Act
      const context = createMockContext(loginData);
      const response = await AuthController.login(context);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(responseData.status).toBe('error');
      expect(responseData.message).toBe(
        'This account has been banned. Contact support for assistance.'
      );
      expect(comparePassword).not.toHaveBeenCalled();
      expect(prisma.session.create).not.toHaveBeenCalled();
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout and delete session', async () => {
      // Arrange
      const mockToken = 'jwt_token_123';

      vi.mocked(prisma.session.deleteMany).mockResolvedValue({
        count: 1,
      } as any);

      // Act
      await AuthService.removeSession(mockToken);

      // Assert
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          token: mockToken,
        },
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should generate reset token for existing user', async () => {
      // Arrange
      const email = 'john.doe@example.com';
      const mockUser = {
        id: 'user_123',
        email,
        firstName: 'John',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        resetToken: 'reset-token-123',
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      } as any);

      // Act
      await AuthService.requestPasswordReset(email);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            resetToken: expect.any(String),
            resetTokenExpiresAt: expect.any(Date),
          }),
        })
      );
    });

    it('should silently handle non-existent email in forgot password', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Act
      await AuthService.requestPasswordReset(email);

      // Assert - Should not reveal user doesn't exist
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should successfully reset password with valid token', async () => {
      // Arrange
      const resetToken = 'valid-reset-token';
      const newPassword = 'newpassword123';
      const mockHashedPassword = 'hashed_new_password';

      const mockUser = {
        id: 'user_123',
        email: 'john@example.com',
        resetToken,
        resetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // Valid token
        failedLoginAttempts: 3,
        blockedUntil: new Date(Date.now() - 1000), // Was locked
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);
      vi.mocked(hashPassword).mockResolvedValue(mockHashedPassword);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        password: mockHashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
        failedLoginAttempts: 0,
        blockedUntil: null,
      } as any);

      // Act
      await AuthService.resetPassword(resetToken, newPassword);

      // Assert
      expect(hashPassword).toHaveBeenCalledWith(newPassword);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: mockHashedPassword,
            resetToken: null,
            resetTokenExpiresAt: null,
            failedLoginAttempts: 0,
            blockedUntil: null,
          }),
        })
      );
    });

    it('should reject expired reset token', async () => {
      // Arrange
      const resetToken = 'expired-token';
      const newPassword = 'newpassword123';

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.resetPassword(resetToken, newPassword)
      ).rejects.toThrow('Invalid or expired reset token');
      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('should reject invalid reset token', async () => {
      // Arrange
      const resetToken = 'invalid-token';
      const newPassword = 'newpassword123';

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.resetPassword(resetToken, newPassword)
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('Security Features', () => {
    it('should hash passwords before storing', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'plaintext_password',
        agreeToTerms: true,
      };

      const mockHashedPassword = 'hashed_password_xyz';

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(hashPassword).mockResolvedValue(mockHashedPassword);
      vi.mocked(generateToken).mockReturnValue('token');
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user_123',
        password: mockHashedPassword,
        role: 'USER', // Add role
        termsAccepted: true,
        isOAuthUser: false,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      } as any);
      vi.mocked(prisma.session.create).mockResolvedValue({} as any);

      // Act
      await AuthService.register(userData);

      // Assert
      expect(hashPassword).toHaveBeenCalledWith('plaintext_password');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: mockHashedPassword,
          }),
        })
      );
    });

    it('should create session with expiration', async () => {
      // Arrange
      const loginData = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user_123',
        email: loginData.email,
        password: 'hashed',
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        termsAccepted: true,
        isOAuthUser: false,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(true);
      vi.mocked(generateToken).mockReturnValue('token');
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.session.create).mockResolvedValue({} as any);

      // Act
      await AuthService.login(loginData);

      // Assert
      expect(prisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            token: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        })
      );
    });

    it('should reset failed login attempts on successful login', async () => {
      // Arrange
      const loginData = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user_123',
        email: loginData.email,
        password: 'hashed',
        failedLoginAttempts: 3, // Had failed attempts
        accountLockedUntil: null,
        termsAccepted: true,
        isOAuthUser: false,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(true);
      vi.mocked(generateToken).mockReturnValue('token');
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 0,
      } as any);
      vi.mocked(prisma.session.create).mockResolvedValue({} as any);

      // Act
      await AuthService.login(loginData);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 0,
          }),
        })
      );
    });
  });
});
