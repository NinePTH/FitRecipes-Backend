import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth';
import * as NotificationController from '@/controllers/notificationController';

const notifications = new Hono();

// All notification routes require authentication
notifications.use('/*', authMiddleware);

// Get user notifications
notifications.get('/', NotificationController.getNotifications);

// Get unread count
notifications.get('/unread-count', NotificationController.getUnreadCount);

// Mark notification as read
notifications.put('/:id/read', NotificationController.markAsRead);

// Mark all as read
notifications.put('/mark-all-read', NotificationController.markAllAsRead);

// Delete notification
notifications.delete('/:id', NotificationController.deleteNotification);

// Clear all notifications
notifications.delete('/', NotificationController.clearAllNotifications);

// Get notification preferences
notifications.get('/preferences', NotificationController.getPreferences);

// Update notification preferences
notifications.put('/preferences', NotificationController.updatePreferences);

// Register FCM token
notifications.post('/fcm/register', NotificationController.registerFcmToken);

// Unregister FCM token
notifications.delete(
  '/fcm/unregister',
  NotificationController.unregisterFcmToken
);

export default notifications;
