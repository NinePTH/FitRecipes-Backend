import { Hono } from 'hono';
import * as authController from '@/controllers/authController';
import { authMiddleware } from '@/middlewares/auth';

const auth = new Hono();

// Public authentication routes
auth.post('/register', authController.register);
auth.post('/login', authController.login);

// Password reset routes
auth.post('/forgot-password', authController.forgotPassword);
auth.post('/reset-password', authController.resetPassword);

// Email verification routes
auth.get('/verify-email/:token', authController.verifyEmail);
auth.post('/resend-verification', authController.resendVerificationEmail);

// Google OAuth routes
auth.get('/google', authController.googleAuth);
auth.get('/google/callback', authController.googleCallback);
auth.post('/google/mobile', authController.googleMobile);

// Protected routes - require authentication
auth.use('/logout', authMiddleware);
auth.post('/logout', authController.logout);

auth.use('/me', authMiddleware);
auth.get('/me', authController.getCurrentUser);

export default auth;
