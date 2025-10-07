import { generateRandomString } from './auth';
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  content: string;
}

// Initialize Resend only if API key is provided
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Use development mode (console logging) only if RESEND_API_KEY is not set or empty
const isDevelopment =
  !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.trim() === '';

/**
 * Send email using configured email service
 * Automatically switches between development (console) and production (Resend) modes
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, content } = options;

  if (isDevelopment) {
    // Development mode: Log to console
    // eslint-disable-next-line no-console
    console.log(`
📧 Email Service (Development Mode - No API Key)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: ${to}
Subject: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${content}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RESEND_API_KEY not set - emails are logged instead of sent
💡 Set RESEND_API_KEY in .env to enable real email sending
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Simulate email delivery delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return;
  }

  if (!resend) {
    throw new Error(
      'Email service not configured. Set RESEND_API_KEY environment variable.'
    );
  }

  // Production mode: Send actual email via Resend
  try {
    await resend.emails.send({
      from: `FitRecipes <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to,
      subject,
      html: content,
    });

    // eslint-disable-next-line no-console
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const subject = 'FitRecipes - Password Reset Request';
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello,</p>
    <p>You requested a password reset for your FitRecipes account.</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this reset, please ignore this email.</p>
    <p>Best regards,<br>FitRecipes Team</p>
  `;

  await sendEmail({ to: email, subject, content });
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string
): Promise<void> {
  // Use path parameter format: /verify-email/:token (not query parameter)
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

  const subject = 'FitRecipes - Email Verification';
  const content = `
    <h2>Welcome to FitRecipes!</h2>
    <p>Hello,</p>
    <p>Thank you for joining FitRecipes. Please verify your email address to complete your registration.</p>
    <p>Click the link below to verify your email:</p>
    <a href="${verifyUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
    <p>Best regards,<br>FitRecipes Team</p>
  `;

  await sendEmail({ to: email, subject, content });
}

/**
 * Generate secure reset token
 */
export function generateResetToken(): string {
  return generateRandomString(32);
}

/**
 * Generate email verification token
 */
export function generateVerificationToken(): string {
  return generateRandomString(32);
}
