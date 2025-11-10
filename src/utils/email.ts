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

/**
 * Send recipe approved email
 */
export async function sendRecipeApprovedEmail(
  email: string,
  chefName: string,
  recipeTitle: string,
  recipeId: string
): Promise<void> {
  const recipeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/recipes/${recipeId}`;
  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/recipes/${recipeId}/share`;

  const subject = `🎉 Your Recipe "${recipeTitle}" Has Been Approved!`;
  const content = `
    <h2>Great News! 🎉</h2>
    <p>Hi ${chefName},</p>
    <p>Your recipe <strong>"${recipeTitle}"</strong> has been approved by our team and is now live on FitRecipes!</p>
    
    <h3>What's next?</h3>
    <ul>
      <li>Share your recipe with friends and family</li>
      <li>Respond to comments from the community</li>
      <li>See your recipe statistics and ratings</li>
    </ul>

    <div style="margin: 20px 0;">
      <a href="${recipeUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px; margin-right: 10px;">View Your Recipe</a>
      <a href="${shareUrl}" style="background-color: #2196F3; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">Share Recipe</a>
    </div>

    <p>Best regards,<br>The FitRecipes Team</p>
  `;

  await sendEmail({ to: email, subject, content });
}

/**
 * Send recipe rejected email
 */
export async function sendRecipeRejectedEmail(
  email: string,
  chefName: string,
  recipeTitle: string,
  rejectionReason: string,
  recipeId: string
): Promise<void> {
  const editUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-recipes`;
  const recipeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/recipes/${recipeId}`;
  const guidelinesUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/guidelines`;

  const subject = `Recipe "${recipeTitle}" - Revision Needed`;
  const content = `
    <h2>Recipe Revision Needed</h2>
    <p>Hi ${chefName},</p>
    <p>Your recipe <strong>"${recipeTitle}"</strong> needs some revisions before it can be published.</p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <strong>Reason:</strong><br>
      ${rejectionReason}
    </div>

    <p>You can edit your recipe and resubmit it for approval.</p>

    <div style="margin: 20px 0;">
      <a href="${recipeUrl}" style="background-color: #2196F3; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px; margin-right: 10px;">View Recipe</a>
      <a href="${editUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px; margin-right: 10px;">My Recipes</a>
      <a href="${guidelinesUrl}" style="background-color: #757575; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">View Guidelines</a>
    </div>

    <p>If you have questions, please contact us.</p>
    <p>Best regards,<br>The FitRecipes Team</p>
  `;

  await sendEmail({ to: email, subject, content });
}

/**
 * Send new comment email
 */
export async function sendNewCommentEmail(
  email: string,
  chefName: string,
  commenterName: string,
  recipeTitle: string,
  commentContent: string,
  recipeId: string,
  commentId: string
): Promise<void> {
  const commentUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/recipes/${recipeId}#comment-${commentId}`;
  const preferencesUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/notifications`;

  const subject = `💬 ${commenterName} commented on your recipe "${recipeTitle}"`;
  const content = `
    <h2>New Comment on Your Recipe</h2>
    <p>Hi ${chefName},</p>
    <p><strong>${commenterName}</strong> just commented on your recipe <strong>"${recipeTitle}"</strong>:</p>
    
    <div style="background-color: #f5f5f5; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; font-style: italic;">
      "${commentContent}"
    </div>

    <div style="margin: 20px 0;">
      <a href="${commentUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px; margin-right: 10px;">View Comment</a>
      <a href="${commentUrl}" style="background-color: #2196F3; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">Reply</a>
    </div>

    <p style="color: #757575; font-size: 12px;">
      You're receiving this because you have email notifications enabled for comments.<br>
      <a href="${preferencesUrl}">Update email preferences</a>
    </p>

    <p>Best regards,<br>The FitRecipes Team</p>
  `;

  await sendEmail({ to: email, subject, content });
}

/**
 * Send new recipe submission email (for admins)
 */
export async function sendNewSubmissionEmail(
  email: string,
  chefName: string,
  recipeTitle: string,
  mainIngredient: string,
  cuisineType: string,
  recipeId: string
): Promise<void> {
  const reviewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/recipes/pending`;
  const recipeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/recipes/${recipeId}`;

  const subject = `📝 New Recipe Pending Approval: "${recipeTitle}"`;
  const content = `
    <h2>New Recipe Submission</h2>
    <p>Hi Admin,</p>
    <p><strong>${chefName}</strong> has submitted a new recipe for approval:</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
      <strong>Recipe:</strong> ${recipeTitle}<br>
      <strong>Main Ingredient:</strong> ${mainIngredient}<br>
      <strong>Cuisine:</strong> ${cuisineType}<br>
      <strong>Submitted:</strong> ${new Date().toLocaleDateString()}
    </div>

    <div style="margin: 20px 0;">
      <a href="${recipeUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px; margin-right: 10px;">Review Recipe</a>
      <a href="${reviewUrl}" style="background-color: #757575; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">View Pending Queue</a>
    </div>

    <p>Best regards,<br>FitRecipes Notification System</p>
  `;

  await sendEmail({ to: email, subject, content });
}
