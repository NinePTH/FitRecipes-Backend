import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import * as authService from '../../src/services/authService';
import { prisma } from '../../src/utils/database';
import {
  hashPassword,
  comparePassword,
  generateToken,
} from '../../src/utils/auth';
import {
  registerSchema,
  resetPasswordSchema,
} from '../../src/utils/validation';

// Mock the database and utilities
vi.mock('../../src/utils/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../../src/utils/auth', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
  generateToken: vi.fn(),
  generateRandomString: vi.fn(),
}));

vi.mock('../../src/utils/email', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  generateVerificationToken: vi.fn(
    () => 'mock-verification-token-12345678901234567890'
  ),
}));

const mockPrisma = prisma as any;
const mockHashPassword = hashPassword as Mock;
const mockComparePassword = comparePassword as Mock;
const mockGenerateToken = generateToken as Mock;

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset all mock implementations
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.findFirst.mockReset();
    mockPrisma.user.create.mockReset();
    mockPrisma.user.update.mockReset();
    mockPrisma.session.create.mockReset();
    mockPrisma.session.findUnique.mockReset();
    mockPrisma.session.delete.mockReset();
    mockPrisma.session.deleteMany.mockReset();

    mockHashPassword.mockReset();
    mockComparePassword.mockReset();
    mockGenerateToken.mockReset();
  });

  describe('register', () => {
    const validRegisterData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'SecureP@ss123',
      agreeToTerms: true,
    };

    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'USER',
      termsAccepted: true,
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully register a new user', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashedSecureP@ss123');
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockGenerateToken.mockReturnValue('jwt-token-123');

      // Act
      const result = await authService.register(validRegisterData);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validRegisterData.email },
      });
      expect(mockHashPassword).toHaveBeenCalledWith(validRegisterData.password);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: validRegisterData.firstName,
            lastName: validRegisterData.lastName,
            email: validRegisterData.email,
            password: 'hashedSecureP@ss123',
            termsAccepted: validRegisterData.agreeToTerms,
            role: 'USER',
            isEmailVerified: false,
          }),
        })
      );
      expect(mockGenerateToken).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
        })
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role.toLowerCase(),
          termsAccepted: mockUser.termsAccepted,
          isOAuthUser: false,
        },
        token: 'jwt-token-123',
      });
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.register(validRegisterData)).rejects.toThrow(
        'Account already exists'
      );
      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    describe('Password Validation Tests', () => {
      it('should reject password without lowercase letter', () => {
        const invalidData = {
          ...validRegisterData,
          password: 'SECURE@PASS123', // No lowercase
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('lowercase');
        }
      });

      it('should reject password without uppercase letter', () => {
        const invalidData = {
          ...validRegisterData,
          password: 'secure@pass123', // No uppercase
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('uppercase');
        }
      });

      it('should reject password without number', () => {
        const invalidData = {
          ...validRegisterData,
          password: 'SecureP@ssword', // No number
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('number');
        }
      });

      it('should reject password without special character', () => {
        const invalidData = {
          ...validRegisterData,
          password: 'SecurePass123', // No special char
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('special character');
        }
      });

      it('should reject password shorter than 8 characters', () => {
        const invalidData = {
          ...validRegisterData,
          password: 'Sec@1', // Only 5 chars
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('8 characters');
        }
      });

      it('should accept valid password with all requirements', () => {
        const validPasswords = [
          'SecureP@ss123',
          'MyP@ssw0rd',
          'Test123!Abc',
          'Admin#2024Pass',
          'Str0ng$Password',
        ];

        validPasswords.forEach(password => {
          const data = { ...validRegisterData, password };
          const result = registerSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should reject multiple validation errors at once', () => {
        const invalidData = {
          ...validRegisterData,
          password: 'weak', // Too short, no uppercase, no number, no special char
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(1);
        }
      });
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'john.doe@example.com',
      password: 'SecureP@ss123',
    };

    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedSecureP@ss123',
      role: 'USER',
      termsAccepted: true,
      failedLoginAttempts: 0,
      lastFailedLogin: null,
      isBlocked: false,
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateToken.mockReturnValue('jwt-token-123');

      // Act
      const result = await authService.login(validLoginData);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validLoginData.email },
      });
      expect(mockComparePassword).toHaveBeenCalledWith(
        validLoginData.password,
        mockUser.password
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role.toLowerCase(),
          termsAccepted: mockUser.termsAccepted,
          isOAuthUser: false,
        },
        token: 'jwt-token-123',
      });
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(validLoginData)).rejects.toThrow(
        'Invalid email or password'
      );
      expect(mockComparePassword).not.toHaveBeenCalled();
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(validLoginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error for blocked account', async () => {
      // Arrange
      const blockedUser = {
        ...mockUser,
        blockedUntil: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in future
      };
      mockPrisma.user.findUnique.mockResolvedValue(blockedUser);

      // Act & Assert
      await expect(authService.login(validLoginData)).rejects.toThrow(
        'Account temporarily locked'
      );
      expect(mockComparePassword).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const validResetToken = 'valid-reset-token-12345678901234567890';
    const newPassword = 'NewSecure@Pass456';

    const mockUser = {
      id: 'user-1',
      email: 'john@example.com',
      resetToken: validResetToken,
      resetTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour future
      failedLoginAttempts: 3,
    };

    it('should successfully reset password with valid token', async () => {
      // Arrange
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockHashPassword.mockResolvedValue('hashedNewSecure@Pass456');
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        password: 'hashedNewSecure@Pass456',
      });

      // Act
      await authService.resetPassword(validResetToken, newPassword);

      // Assert
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          resetToken: validResetToken,
          resetTokenExpiresAt: { gt: expect.any(Date) },
        },
      });
      expect(mockHashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          password: 'hashedNewSecure@Pass456',
          resetToken: null,
          resetTokenExpiresAt: null,
          failedLoginAttempts: 0,
          blockedUntil: null,
        },
      });
    });

    it('should throw error for invalid or expired token', async () => {
      // Arrange
      mockPrisma.user.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.resetPassword('invalid-token', newPassword)
      ).rejects.toThrow('Invalid or expired reset token');
      expect(mockHashPassword).not.toHaveBeenCalled();
    });

    describe('Reset Password Validation Tests', () => {
      it('should reject new password without lowercase letter', () => {
        const result = resetPasswordSchema.safeParse({
          token: validResetToken,
          newPassword: 'NEWSECURE@PASS456', // No lowercase
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const errorMessages = result.error.issues.map(issue => issue.message);
          expect(errorMessages.some(msg => msg.includes('lowercase'))).toBe(
            true
          );
        }
      });

      it('should reject new password without uppercase letter', () => {
        const result = resetPasswordSchema.safeParse({
          token: validResetToken,
          newPassword: 'newsecure@pass456', // No uppercase
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const errorMessages = result.error.issues.map(issue => issue.message);
          expect(errorMessages.some(msg => msg.includes('uppercase'))).toBe(
            true
          );
        }
      });

      it('should reject new password without number', () => {
        const result = resetPasswordSchema.safeParse({
          token: validResetToken,
          newPassword: 'NewSecure@Pass', // No number
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const errorMessages = result.error.issues.map(issue => issue.message);
          expect(errorMessages.some(msg => msg.includes('number'))).toBe(true);
        }
      });

      it('should reject new password without special character', () => {
        const result = resetPasswordSchema.safeParse({
          token: validResetToken,
          newPassword: 'NewSecurePass456', // No special char
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const errorMessages = result.error.issues.map(issue => issue.message);
          expect(
            errorMessages.some(msg => msg.includes('special character'))
          ).toBe(true);
        }
      });

      it('should reject new password shorter than 8 characters', () => {
        const result = resetPasswordSchema.safeParse({
          token: validResetToken,
          newPassword: 'New@1', // Only 5 chars
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('8 characters');
        }
      });

      it('should accept valid new password with all requirements', () => {
        const validPasswords = [
          'NewSecure@Pass456',
          'Reset123!Password',
          'MyN3w$Pass',
          'Admin#2024Reset',
        ];

        validPasswords.forEach(newPassword => {
          const result = resetPasswordSchema.safeParse({
            token: validResetToken,
            newPassword,
          });
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      // Act
      const result = await authService.emailExists('test@example.com');

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return false if email does not exist', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await authService.emailExists('test@example.com');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'USER',
        termsAccepted: true,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await authService.getUserById('user-1');

      // Assert
      expect(result).toEqual({
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        role: mockUser.role,
        termsAccepted: mockUser.termsAccepted,
        isOAuthUser: false,
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await authService.getUserById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });
});
