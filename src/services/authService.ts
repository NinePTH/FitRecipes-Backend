import { prisma } from '@/utils/database';
import { hashPassword, comparePassword, generateToken } from '@/utils/auth';
import {
  sendPasswordResetEmail,
  generateResetToken,
  sendVerificationEmail,
  generateVerificationToken,
} from '@/utils/email';
import { AuthenticatedUser, UserRole } from '@/types';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    termsAccepted: boolean; // Whether user has accepted ToS
    isOAuthUser: boolean; // Whether user signed up via OAuth (Google, etc)
  };
  token: string;
}

/**
 * Create a new session for a user
 */
async function createSession(userId: string, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

/**
 * Validate if a session exists and is not expired
 */
export async function validateSession(token: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session) {
    return false;
  }

  if (session.expiresAt < new Date()) {
    // Remove expired session
    await prisma.session.delete({
      where: { id: session.id },
    });
    return false;
  }

  return true;
}

/**
 * Remove a session (logout)
 */
export async function removeSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  });
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const { firstName, lastName, email, password, agreeToTerms } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Account already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Generate email verification token
  const verificationToken = generateVerificationToken();
  const verificationTokenExpiry = new Date();
  verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hours

  // Create user
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      termsAccepted: agreeToTerms,
      role: 'USER',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: verificationTokenExpiry,
    },
  });

  // Send verification email (async, don't wait)
  sendVerificationEmail(user.email, verificationToken).catch(error => {
    // eslint-disable-next-line no-console
    console.error('Failed to send verification email:', error);
  });

  // Generate JWT token
  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as any,
    termsAccepted: user.termsAccepted,
    isOAuthUser: false,
  };

  const token = generateToken(authenticatedUser);

  // Create session
  await createSession(user.id, token);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.toLowerCase(),
      termsAccepted: user.termsAccepted,
      isOAuthUser: false, // Regular registration is not OAuth
    },
    token,
  };
}

/**
 * Login a user
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  const { email, password } = data;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if account is blocked
  if (user.blockedUntil && user.blockedUntil > new Date()) {
    throw new Error('Account temporarily locked');
  }

  // Check if user has a password (OAuth users might not)
  if (!user.password) {
    throw new Error(
      'This account is linked to Google. Please use "Sign in with Google" instead of email/password.'
    );
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    // Increment failed login attempts
    await handleFailedLogin(user.id);
    throw new Error('Invalid email or password');
  }

  // Reset failed login attempts on successful login
  if (user.failedLoginAttempts > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        blockedUntil: null,
      },
    });
  }

  // Generate JWT token
  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as any,
    termsAccepted: user.termsAccepted,
    isOAuthUser: !!user.oauthProvider,
  };

  const token = generateToken(authenticatedUser);

  // Create session
  await createSession(user.id, token);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.toLowerCase(),
      termsAccepted: user.termsAccepted,
      isOAuthUser: !!user.oauthProvider, // Check if user has OAuth provider
    },
    token,
  };
}

/**
 * Handle failed login attempts
 */
async function handleFailedLogin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return;

  const newFailedAttempts = user.failedLoginAttempts + 1;
  const updateData: any = {
    failedLoginAttempts: newFailedAttempts,
  };

  // Block account after 5 failed attempts for 15 minutes
  if (newFailedAttempts >= 5) {
    updateData.blockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return !!user;
}

/**
 * Get user by ID
 */
export async function getUserById(
  id: string
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as any,
    termsAccepted: user.termsAccepted,
    isOAuthUser: !!user.oauthProvider,
  };
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if email exists or not for security
    return;
  }

  // Generate reset token and expiration
  const resetToken = generateResetToken();
  const resetTokenExpiresAt = new Date();
  resetTokenExpiresAt.setTime(resetTokenExpiresAt.getTime() + 60 * 60 * 1000); // 1 hour

  // Save reset token to database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiresAt,
    },
  });

  // Send password reset email
  await sendPasswordResetEmail(email, resetToken);
}

/**
 * Reset password using token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiresAt: {
        gt: new Date(), // Token not expired
      },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiresAt: null,
      failedLoginAttempts: 0, // Reset failed attempts
      blockedUntil: null, // Unblock account
    },
  });
}

/**
 * Create or update OAuth user
 */
export async function createOrUpdateOAuthUser(googleUser: {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  verified_email: boolean;
}): Promise<AuthResponse> {
  // Check if user already exists with Google ID
  let user = await prisma.user.findFirst({
    where: { googleId: googleUser.id },
  });

  if (user) {
    // Update existing OAuth user
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        failedLoginAttempts: 0,
        blockedUntil: null,
      },
    });
  } else {
    // Check if user exists with the same email
    const existingUser = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (existingUser) {
      // Link existing email account with Google
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleId: googleUser.id,
          oauthProvider: 'GOOGLE',
          isEmailVerified: googleUser.verified_email,
          failedLoginAttempts: 0,
          blockedUntil: null,
        },
      });
    } else {
      // Create new OAuth user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          googleId: googleUser.id,
          oauthProvider: 'GOOGLE',
          isEmailVerified: googleUser.verified_email,
          role: 'USER',
        },
      });
    }
  }

  // Generate token and create session
  const token = generateToken({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as UserRole,
    termsAccepted: user.termsAccepted,
    isOAuthUser: true,
  });

  await createSession(user.id, token);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      termsAccepted: user.termsAccepted, // Include ToS status for OAuth users
      isOAuthUser: true, // This is always an OAuth user (Google)
    },
    token,
  };
}

/**
 * Verify user email with verification token
 */
export async function verifyEmail(token: string): Promise<{ message: string }> {
  // Find user with matching verification token
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationTokenExpiresAt: {
        gte: new Date(), // Token not expired
      },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  // Update user: mark as verified and clear token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
    },
  });

  return {
    message: 'Email verified successfully',
  };
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(
  email: string
): Promise<{ message: string }> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isEmailVerified) {
    throw new Error('Email already verified');
  }

  // Generate new verification token
  const verificationToken = generateVerificationToken();
  const verificationTokenExpiry = new Date();
  verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hours

  // Update user with new token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: verificationTokenExpiry,
    },
  });

  // Send verification email
  await sendVerificationEmail(user.email, verificationToken);

  return {
    message: 'Verification email sent',
  };
}

/**
 * Accept Terms of Service (for OAuth users)
 */
export async function acceptTerms(
  userId: string
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.termsAccepted) {
    throw new Error('Terms already accepted');
  }

  // Update user to accept terms
  await prisma.user.update({
    where: { id: userId },
    data: {
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  return {
    message: 'Terms of Service accepted successfully',
  };
}

/**
 * Decline Terms of Service (for OAuth users) - logout user
 */
export async function declineTerms(
  userId: string
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Remove all sessions for this user (logout)
  await prisma.session.deleteMany({
    where: { userId },
  });

  return {
    message: 'Terms of Service declined. You have been logged out.',
  };
}
