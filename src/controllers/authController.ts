import { Context } from 'hono';
import * as AuthService from '@/services/authService';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/utils/validation';
import { createApiResponse } from '@/utils/helpers';
import { ZodError } from 'zod';
import { generateGoogleAuthUrl, handleOAuthCallback } from '@/utils/oauth';

/**
 * Register a new user
 */
export async function register(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Register user
    const result = await AuthService.register(validatedData);

    return c.json(
      createApiResponse('success', result, 'Registration successful'),
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      let message = firstError.message;

      // Custom error messages for frontend test cases
      if (
        firstError.path.includes('password') &&
        firstError.code === 'too_small'
      ) {
        message = 'Password must be at least 6 characters';
      } else if (firstError.path.includes('agreeToTerms')) {
        message = 'Must agree to Terms and Conditions';
      }

      return c.json(createApiResponse('error', null, message), 400);
    }

    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message === 'Account already exists') {
        return c.json(
          createApiResponse('error', null, 'Account already exists'),
          400
        );
      }
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Login a user
 */
export async function login(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Login user
    const result = await AuthService.login(validatedData);

    return c.json(
      createApiResponse('success', result, 'Login successful'),
      200
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return c.json(createApiResponse('error', null, firstError.message), 400);
    }

    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message === 'Invalid email or password') {
        return c.json(
          createApiResponse('error', null, 'Invalid email or password'),
          401
        );
      }

      if (error.message === 'Account temporarily locked') {
        return c.json(
          createApiResponse('error', null, 'Account temporarily locked'),
          401
        );
      }

      if (
        error.message.includes('OAuth login') ||
        error.message.includes('linked to Google') ||
        error.message.includes('Sign in with Google')
      ) {
        return c.json(createApiResponse('error', null, error.message), 400);
      }
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Logout a user
 */
export async function logout(c: Context): Promise<Response> {
  try {
    // Get token from context (set by auth middleware)
    const token = c.get('token') as unknown as string;

    if (token) {
      // Remove session from database
      await AuthService.removeSession(token);
    }

    return c.json(createApiResponse('success', null, 'Logout successful'), 200);
  } catch {
    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(c: Context): Promise<Response> {
  try {
    // This would be called on protected routes with auth middleware
    const user = c.get('user'); // Set by auth middleware

    if (!user) {
      return c.json(createApiResponse('error', null, 'User not found'), 404);
    }

    return c.json(
      createApiResponse('success', { user }, 'User retrieved successfully'),
      200
    );
  } catch {
    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Forgot password
 */
export async function forgotPassword(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const validatedData = forgotPasswordSchema.parse(body);

    await AuthService.requestPasswordReset(validatedData.email);

    return c.json(
      createApiResponse(
        'success',
        null,
        'If an account with that email exists, a password reset link has been sent'
      ),
      200
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json(
        createApiResponse(
          'error',
          null,
          'Invalid input',
          error.errors.map(e => e.message)
        ),
        400
      );
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Reset password
 */
export async function resetPassword(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const validatedData = resetPasswordSchema.parse(body);

    await AuthService.resetPassword(
      validatedData.token,
      validatedData.newPassword
    );

    return c.json(
      createApiResponse('success', null, 'Password reset successfully'),
      200
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json(
        createApiResponse(
          'error',
          null,
          'Invalid input',
          error.errors.map(e => e.message)
        ),
        400
      );
    }

    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Internal server error'),
      500
    );
  }
}

/**
 * Verify email (placeholder)
 */
/**
 * Verify user email with token
 * Supports both path parameter (/verify-email/:token) and query parameter (/verify-email?token=xxx)
 */
export async function verifyEmail(c: Context): Promise<Response> {
  try {
    // Try to get token from path parameter first, then from query parameter
    const pathToken = c.req.param('token');
    const queryToken = c.req.query('token');
    const token = pathToken || queryToken;

    if (!token) {
      return c.json(
        createApiResponse('error', null, 'Verification token required'),
        400
      );
    }

    const result = await AuthService.verifyEmail(token);

    return c.json(createApiResponse('success', result, result.message), 200);
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Email verification failed'),
      500
    );
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json(createApiResponse('error', null, 'Email is required'), 400);
    }

    const result = await AuthService.resendVerificationEmail(email);

    return c.json(createApiResponse('success', result, result.message), 200);
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Failed to resend verification email'),
      500
    );
  }
}

/**
 * Google OAuth initiation
 */
export async function googleAuth(c: Context): Promise<Response> {
  try {
    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = generateGoogleAuthUrl(state);

    return c.json(
      createApiResponse(
        'success',
        { authUrl, state },
        'Google auth URL generated'
      ),
      200
    );
  } catch {
    return c.json(
      createApiResponse('error', null, 'Failed to generate auth URL'),
      500
    );
  }
}

/**
 * Google OAuth callback
 */
export async function googleCallback(c: Context): Promise<Response> {
  try {
    const { code } = c.req.query();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!code) {
      // Redirect to frontend with error
      return c.redirect(`${frontendUrl}/auth?error=missing_code`);
    }

    // Get user info from Google
    const googleUser = await handleOAuthCallback(code);

    // Create or update OAuth user
    try {
      const result = await AuthService.createOrUpdateOAuthUser(googleUser);

      // Redirect to frontend with token and user data
      const params = new URLSearchParams({
        token: result.token,
        userId: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName || '',
        role: result.user.role,
      });

      return c.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (oauthError) {
      if (
        oauthError instanceof Error &&
        oauthError.message.includes('not yet implemented')
      ) {
        return c.redirect(
          `${frontendUrl}/auth?error=oauth_not_implemented&message=${encodeURIComponent('OAuth user creation not yet implemented')}`
        );
      }
      throw oauthError;
    }
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const errorMessage =
      error instanceof Error ? error.message : 'OAuth authentication failed';

    return c.redirect(
      `${frontendUrl}/auth?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`
    );
  }
}

/**
 * Google OAuth for mobile apps
 */
export async function googleMobile(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { idToken } = body;

    if (!idToken) {
      return c.json(
        createApiResponse('error', null, 'Google ID token required'),
        400
      );
    }

    // TODO: Verify Google ID token
    // const googleUser = await verifyGoogleIdToken(idToken);
    // const result = await AuthService.createOrUpdateOAuthUser(googleUser);

    return c.json(
      createApiResponse(
        'error',
        null,
        'Mobile OAuth not fully implemented yet. Use web OAuth flow.'
      ),
      501
    );
  } catch (error) {
    if (error instanceof Error) {
      return c.json(createApiResponse('error', null, error.message), 400);
    }

    return c.json(
      createApiResponse('error', null, 'Mobile OAuth authentication failed'),
      500
    );
  }
}
