import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Context } from 'hono';
import * as authController from '../../src/controllers/authController';
import * as AuthService from '../../src/services/authService';

// Mock the auth service
vi.mock('../../src/services/authService');

const mockAuthService = AuthService as any;

describe('AuthController', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock context with explicit types
    mockContext = {
      req: {
        json: vi.fn(),
      },
      json: vi.fn(),
    };
  });

  describe('register', () => {
    const validRegisterData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'Password@123',
      agreeToTerms: true,
    };

    const mockAuthResponse = {
      user: {
        id: 'user-1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
      },
      token: 'jwt-token-123',
    };

    it('should successfully register a user with valid data', async () => {
      // Arrange
      (mockContext.req!.json as Mock).mockResolvedValue(validRegisterData);
      mockAuthService.register.mockResolvedValue(mockAuthResponse);
      (mockContext.json as Mock).mockReturnValue('response');

      // Act
      await authController.register(mockContext as Context);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterData);
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'success',
          data: mockAuthResponse,
          message: 'Registration successful',
        },
        201
      );
    });

    it('should return 400 for validation errors', async () => {
      // Arrange
      const invalidData = { ...validRegisterData, email: 'invalid-email' };
      (mockContext.req!.json as Mock).mockResolvedValue(invalidData);
      (mockContext.json as Mock).mockReturnValue('error-response');

      // Act
      await authController.register(mockContext as Context);

      // Assert
      expect(mockAuthService.register).not.toHaveBeenCalled();
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'error',
          data: null,
          message: 'Invalid email format',
        },
        400
      );
    });

    it('should return 400 for short password', async () => {
      // Arrange
      const invalidData = { ...validRegisterData, password: '123' };
      (mockContext.req!.json as Mock).mockResolvedValue(invalidData);
      (mockContext.json as Mock).mockReturnValue('error-response');

      // Act
      await authController.register(mockContext as Context);

      // Assert
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'error',
          data: null,
          message: 'Password must be at least 8 characters',
        },
        400
      );
    });

    it('should return 400 for missing terms agreement', async () => {
      // Arrange
      const invalidData = { ...validRegisterData, agreeToTerms: false };
      (mockContext.req!.json as Mock).mockResolvedValue(invalidData);
      (mockContext.json as Mock).mockReturnValue('error-response');

      // Act
      await authController.register(mockContext as Context);

      // Assert
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'error',
          data: null,
          message: 'Must agree to Terms and Conditions',
        },
        400
      );
    });

    it('should return 400 when account already exists', async () => {
      // Arrange
      (mockContext.req!.json as Mock).mockResolvedValue(validRegisterData);
      mockAuthService.register.mockRejectedValue(
        new Error('Account already exists')
      );
      (mockContext.json as Mock).mockReturnValue('error-response');

      // Act
      await authController.register(mockContext as Context);

      // Assert
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'error',
          data: null,
          message: 'Account already exists',
        },
        400
      );
    });

    it('should return 500 for unexpected errors', async () => {
      // Arrange
      (mockContext.req!.json as Mock).mockResolvedValue(validRegisterData);
      mockAuthService.register.mockRejectedValue(new Error('Database error'));
      (mockContext.json as Mock).mockReturnValue('error-response');

      // Act
      await authController.register(mockContext as Context);

      // Assert
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'error',
          data: null,
          message: 'Internal server error',
        },
        500
      );
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'john.doe@example.com',
      password: 'password123',
    };

    const mockAuthResponse = {
      user: {
        id: 'user-1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
      },
      token: 'jwt-token-123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      (mockContext.req!.json as Mock).mockResolvedValue(validLoginData);
      mockAuthService.login.mockResolvedValue(mockAuthResponse);
      (mockContext.json as Mock).mockReturnValue('response');

      // Act
      await authController.login(mockContext as Context);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginData);
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'success',
          data: mockAuthResponse,
          message: 'Login successful',
        },
        200
      );
    });

    it('should return 400 for validation errors', async () => {
      // Arrange
      const invalidData = { email: 'invalid-email', password: 'pass' };
      (mockContext.req!.json as Mock).mockResolvedValue(invalidData);
      (mockContext.json as Mock).mockReturnValue('error-response');

      // Act
      await authController.login(mockContext as Context);

      // Assert
      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'error',
          data: null,
          message: 'Invalid email format',
        },
        400
      );
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      (mockContext.req!.json as Mock).mockResolvedValue(validLoginData);
      mockAuthService.login.mockRejectedValue(
        new Error('Invalid email or password')
      );
      (mockContext.json as Mock).mockReturnValue('error-response');

      // Act
      await authController.login(mockContext as Context);

      // Assert
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'error',
          data: null,
          message: 'Invalid email or password',
        },
        401
      );
    });

    it('should return 401 for blocked account', async () => {
      // Arrange
      (mockContext.req!.json as Mock).mockResolvedValue(validLoginData);
      mockAuthService.login.mockRejectedValue(
        new Error('Account temporarily locked')
      );
      (mockContext.json as Mock).mockReturnValue('error-response');

      // Act
      await authController.login(mockContext as Context);

      // Assert
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'error',
          data: null,
          message: 'Account temporarily locked',
        },
        401
      );
    });

    it('should return 400 for OAuth users trying password login', async () => {
      // Arrange
      (mockContext.req!.json as Mock).mockResolvedValue(validLoginData);
      mockAuthService.login.mockRejectedValue(
        new Error(
          'This account is linked to Google. Please use "Sign in with Google" instead of email/password.'
        )
      );
      (mockContext.json as Mock).mockReturnValue('error-response');

      // Act
      await authController.login(mockContext as Context);

      // Assert
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'error',
          data: null,
          message:
            'This account is linked to Google. Please use "Sign in with Google" instead of email/password.',
        },
        400
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      };

      mockContext.get = vi.fn().mockReturnValue(mockUser);
      (mockContext.json as Mock).mockReturnValue('response');

      // Act
      await authController.getCurrentUser(mockContext as Context);

      // Assert
      expect(mockContext.get).toHaveBeenCalledWith('user');
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'success',
          data: {
            user: {
              id: mockUser.id,
              email: mockUser.email,
              firstName: mockUser.firstName,
              lastName: mockUser.lastName,
              role: mockUser.role, // Keep original role case
            },
          },
          message: 'User retrieved successfully',
        },
        200
      );
    });

    it('should return 401 when user not found in context', async () => {
      // Arrange
      mockContext.get = vi.fn().mockReturnValue(null);
      (mockContext.json as Mock).mockReturnValue('error-response');

      // Act
      await authController.getCurrentUser(mockContext as Context);

      // Assert
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'error',
          data: null,
          message: 'User not found',
        },
        404
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      // Arrange
      const mockToken = 'valid-token';
      mockContext.get = vi.fn().mockReturnValue(mockToken);
      mockAuthService.removeSession = vi.fn().mockResolvedValue(undefined);
      (mockContext.json as Mock).mockReturnValue('response');

      // Act
      await authController.logout(mockContext as Context);

      // Assert
      expect(mockContext.get).toHaveBeenCalledWith('token');
      expect(mockAuthService.removeSession).toHaveBeenCalledWith(mockToken);
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          status: 'success',
          data: null,
          message: 'Logout successful',
        },
        200
      );
    });
  });
});
