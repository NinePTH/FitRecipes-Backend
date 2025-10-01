import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import * as authService from '../../src/services/authService';
import { prisma } from '../../src/utils/database';
import {
  hashPassword,
  comparePassword,
  generateToken,
} from '../../src/utils/auth';

// Mock the database and utilities
vi.mock('../../src/utils/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
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
      password: 'password123',
      agreeToTerms: true,
    };

    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully register a new user', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      mockHashPassword.mockResolvedValue('hashedPassword123');
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockGenerateToken.mockReturnValue('jwt-token-123');

      // Act
      const result = await authService.register(validRegisterData);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validRegisterData.email },
      });
      expect(mockHashPassword).toHaveBeenCalledWith(validRegisterData.password);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          firstName: validRegisterData.firstName,
          lastName: validRegisterData.lastName,
          email: validRegisterData.email,
          password: 'hashedPassword123',
          termsAccepted: validRegisterData.agreeToTerms,
          role: 'USER',
        },
      });
      expect(mockGenerateToken).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role.toLowerCase(),
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
  });

  describe('login', () => {
    const validLoginData = {
      email: 'john.doe@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword123',
      role: 'USER',
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
