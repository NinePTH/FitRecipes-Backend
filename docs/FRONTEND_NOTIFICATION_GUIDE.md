# Notification System - Frontend Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Backend API Endpoints](#backend-api-endpoints)
3. [Database Schema](#database-schema)
4. [Notification Types](#notification-types)
5. [Frontend Implementation](#frontend-implementation)
6. [Firebase Cloud Messaging Setup](#firebase-cloud-messaging-setup)
7. [Component Examples](#component-examples)
8. [Testing](#testing)

---

## Overview

The FitRecipes notification system provides multi-channel notifications:
- **In-App (Web)**: Stored in database, displayed in notification center
- **Push Notifications**: Browser push via Firebase Cloud Messaging (FCM)
- **Email Notifications**: Sent via backend email service

**Key Features:**
- Real-time notifications for recipe approval, comments, ratings
- User preferences for each notification type and channel
- Notification history with read/unread status
- Push notification support (browser-based)

---

## Backend API Endpoints

### Base URL
```
/api/v1/notifications
```

All endpoints require authentication via JWT token in `Authorization: Bearer {token}` header.

---

### 1. Get User Notifications

**Endpoint:** `GET /api/v1/notifications`

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `unread` (boolean, optional) - Filter unread only
- `priority` (enum: LOW|MEDIUM|HIGH, optional) - Filter by priority
- `type` (enum: SUCCESS|ERROR|WARNING|INFO, optional) - Filter by type

**Response:**
```typescript
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "id": "cm2w...",
        "type": "SUCCESS",
        "title": "Recipe Approved! 🎉",
        "description": "Your recipe 'Healthy Quinoa Bowl' has been approved and is now live.",
        "priority": "HIGH",
        "recipe": {
          "id": "recipe-id",
          "title": "Healthy Quinoa Bowl",
          "imageUrls": ["https://..."]
        },
        "actor": {
          "id": "admin-id",
          "firstName": "John",
          "lastName": "Admin"
        },
        "actionType": "recipe_approved",
        "actionUrl": "/recipes/recipe-id",
        "isRead": false,
        "readAt": null,
        "createdAt": "2025-11-09T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "unreadCount": 12
  }
}
```

**Frontend Usage:**
```typescript
// Fetch notifications
async function fetchNotifications(page = 1, unreadOnly = false) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(unreadOnly && { unread: 'true' })
  });

  const response = await fetch(`/api/v1/notifications?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  return response.json();
}
```

---

### 2. Get Unread Count

**Endpoint:** `GET /api/v1/notifications/unread-count`

**Response:**
```typescript
{
  "status": "success",
  "data": {
    "unreadCount": 12
  }
}
```

**Frontend Usage:**
```typescript
// Poll for unread count (or use with FCM)
async function getUnreadCount() {
  const response = await fetch('/api/v1/notifications/unread-count', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.data.unreadCount;
}
```

---

### 3. Mark Notification as Read

**Endpoint:** `PUT /api/v1/notifications/:id/read`

**Response:**
```typescript
{
  "status": "success",
  "data": {
    "id": "notification-id",
    "isRead": true,
    "readAt": "2025-11-09T10:35:00Z"
  }
}
```

**Frontend Usage:**
```typescript
async function markAsRead(notificationId: string) {
  await fetch(`/api/v1/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}
```

---

### 4. Mark All as Read

**Endpoint:** `PUT /api/v1/notifications/mark-all-read`

**Response:**
```typescript
{
  "status": "success",
  "data": {
    "updatedCount": 12
  },
  "message": "All notifications marked as read"
}
```

---

### 5. Delete Notification

**Endpoint:** `DELETE /api/v1/notifications/:id`

**Response:**
```typescript
{
  "status": "success",
  "message": "Notification deleted successfully"
}
```

---

### 6. Clear All Notifications

**Endpoint:** `DELETE /api/v1/notifications`

**Response:**
```typescript
{
  "status": "success",
  "data": {
    "deletedCount": 45
  },
  "message": "All notifications cleared"
}
```

---

### 7. Get Notification Preferences

**Endpoint:** `GET /api/v1/notifications/preferences`

**Response:**
```typescript
{
  "status": "success",
  "data": {
    "webNotifications": {
      "recipeApproved": true,
      "recipeRejected": true,
      "newComment": true,
      "highRating": false,
      "newSubmission": true  // Admin only
    },
    "pushNotifications": {
      "enabled": true,
      "recipeApproved": true,
      "recipeRejected": true,
      "newComment": false,
      "highRating": false,
      "newSubmission": true  // Admin only
    },
    "emailNotifications": {
      "enabled": true,
      "recipeApproved": true,
      "recipeRejected": true,
      "newComment": false,
      "digestFrequency": "weekly"  // never, daily, weekly
    }
  }
}
```

---

### 8. Update Notification Preferences

**Endpoint:** `PUT /api/v1/notifications/preferences`

**Request Body:**
```typescript
{
  "webNotifications": {
    "newComment": false
  },
  "pushNotifications": {
    "enabled": true,
    "newComment": false
  },
  "emailNotifications": {
    "digestFrequency": "daily"
  }
}
```

**Response:**
```typescript
{
  "status": "success",
  "message": "Preferences updated successfully"
}
```

---

### 9. Register FCM Token

**Endpoint:** `POST /api/v1/notifications/fcm/register`

**Request Body:**
```typescript
{
  "fcmToken": "firebase_cloud_messaging_token_here",
  "browser": "Chrome",
  "os": "Windows"
}
```

**Response:**
```typescript
{
  "status": "success",
  "data": {
    "tokenId": "token-uuid",
    "message": "FCM token registered successfully"
  }
}
```

---

### 10. Unregister FCM Token

**Endpoint:** `DELETE /api/v1/notifications/fcm/unregister`

**Request Body:**
```typescript
{
  "fcmToken": "firebase_cloud_messaging_token_here"
}
```

**Response:**
```typescript
{
  "status": "success",
  "message": "FCM token removed successfully"
}
```

---

## Database Schema

### Notification Model
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Related entities (optional)
  recipeId?: string;
  commentId?: string;
  ratingId?: string;
  actorUserId?: string;  // Who triggered the notification
  
  // Metadata
  actionType: string;  // e.g., "recipe_approved", "new_comment"
  actionUrl?: string;  // Deep link to relevant page
  
  // Status
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Notification Types

### For Recipe Authors (Chefs)

| Event | Type | Title | Description | Priority |
|-------|------|-------|-------------|----------|
| Recipe approved | `SUCCESS` | "Recipe Approved! 🎉" | "Your recipe '{title}' has been approved and is now live." | `HIGH` |
| Recipe rejected | `ERROR` | "Recipe Rejected" | "Your recipe '{title}' was rejected. Reason: {reason}" | `HIGH` |
| New comment | `INFO` | "New Comment" | "{user} commented on your recipe '{title}'" | `MEDIUM` |
| 5-star rating | `SUCCESS` | "5-Star Rating!" | "{user} gave your recipe '{title}' 5 stars!" | `LOW` |

### For Admins

| Event | Type | Title | Description | Priority |
|-------|------|-------|-------------|----------|
| New recipe submission | `INFO` | "New Recipe Submitted" | "{chef} submitted '{title}' for approval" | `HIGH` |

---

## Frontend Implementation

### 1. TypeScript Types

Create `src/types/notification.ts`:

```typescript
export type NotificationType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  priority: NotificationPriority;
  recipe?: {
    id: string;
    title: string;
    imageUrls: string[];
  } | null;
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  actionType: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  webNotifications: {
    recipeApproved: boolean;
    recipeRejected: boolean;
    newComment: boolean;
    highRating: boolean;
    newSubmission: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    recipeApproved: boolean;
    recipeRejected: boolean;
    newComment: boolean;
    highRating: boolean;
    newSubmission: boolean;
  };
  emailNotifications: {
    enabled: boolean;
    recipeApproved: boolean;
    recipeRejected: boolean;
    newComment: boolean;
    digestFrequency: 'never' | 'daily' | 'weekly';
  };
}

export interface PaginatedNotifications {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: number;
}
```

---

### 2. API Service

Create `src/services/notificationApi.ts`:

```typescript
import { apiClient } from './api';
import type { 
  Notification, 
  NotificationPreferences, 
  PaginatedNotifications 
} from '@/types/notification';

export const notificationApi = {
  // Get notifications
  async getNotifications(
    page = 1, 
    limit = 20, 
    filters?: {
      unread?: boolean;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH';
      type?: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
    }
  ): Promise<PaginatedNotifications> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.unread !== undefined) {
      params.append('unread', filters.unread.toString());
    }
    if (filters?.priority) {
      params.append('priority', filters.priority);
    }
    if (filters?.type) {
      params.append('type', filters.type);
    }

    const response = await apiClient.get(`/notifications?${params}`);
    return response.data.data;
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.data.unreadCount;
  },

  // Mark as read
  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.put(`/notifications/${notificationId}/read`);
  },

  // Mark all as read
  async markAllAsRead(): Promise<number> {
    const response = await apiClient.put('/notifications/mark-all-read');
    return response.data.data.updatedCount;
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  // Clear all
  async clearAll(): Promise<number> {
    const response = await apiClient.delete('/notifications');
    return response.data.data.deletedCount;
  },

  // Get preferences
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get('/notifications/preferences');
    return response.data.data;
  },

  // Update preferences
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    await apiClient.put('/notifications/preferences', preferences);
  },

  // Register FCM token
  async registerFcmToken(
    fcmToken: string, 
    browser?: string, 
    os?: string
  ): Promise<string> {
    const response = await apiClient.post('/notifications/fcm/register', {
      fcmToken,
      browser,
      os,
    });
    return response.data.data.tokenId;
  },

  // Unregister FCM token
  async unregisterFcmToken(fcmToken: string): Promise<void> {
    await apiClient.delete('/notifications/fcm/unregister', {
      data: { fcmToken }
    });
  },
};
```

---

### 3. React Hook - useNotifications

Create `src/hooks/useNotifications.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/notificationApi';
import { useToast } from './useToast';

export function useNotifications(
  page = 1, 
  unreadOnly = false
) {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch notifications
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['notifications', page, unreadOnly],
    queryFn: () => notificationApi.getNotifications(
      page, 
      20, 
      { unread: unreadOnly }
    ),
    staleTime: 30000, // 30 seconds
  });

  // Get unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 60000, // Poll every minute
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read', `${count} notifications updated`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: notificationApi.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
  });

  // Clear all mutation
  const clearAllMutation = useMutation({
    mutationFn: notificationApi.clearAll,
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications cleared', `${count} notifications removed`);
    },
  });

  return {
    notifications: data?.notifications || [],
    pagination: data?.pagination,
    unreadCount: unreadCount || 0,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    clearAll: clearAllMutation.mutate,
  };
}
```

---

### 4. React Hook - useNotificationPreferences

Create `src/hooks/useNotificationPreferences.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/notificationApi';
import { useToast } from './useToast';
import type { NotificationPreferences } from '@/types/notification';

export function useNotificationPreferences() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch preferences
  const { data, isLoading, error } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: notificationApi.getPreferences,
  });

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: (preferences: Partial<NotificationPreferences>) =>
      notificationApi.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferences updated', 'Your notification settings have been saved');
    },
    onError: (error: any) => {
      toast.error('Update failed', error.message);
    },
  });

  return {
    preferences: data,
    isLoading,
    error,
    updatePreferences: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
```

---

## Firebase Cloud Messaging Setup

### 1. Install Dependencies

```bash
npm install firebase
# or
yarn add firebase
```

---

### 2. Firebase Configuration

Create `src/config/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
```

---

### 3. Request Push Permission

Create `src/services/pushNotifications.ts`:

```typescript
import { getToken, messaging, onMessage } from '@/config/firebase';
import { notificationApi } from './notificationApi';

export async function requestPushPermission(): Promise<string | null> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    const fcmToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (!fcmToken) {
      console.error('Failed to get FCM token');
      return null;
    }

    // Register token with backend
    await notificationApi.registerFcmToken(
      fcmToken,
      getBrowserName(),
      getPlatform()
    );

    return fcmToken;
  } catch (error) {
    console.error('Error requesting push permission:', error);
    return null;
  }
}

export async function unregisterPush(): Promise<void> {
  try {
    const fcmToken = await getToken(messaging);
    if (fcmToken) {
      await notificationApi.unregisterFcmToken(fcmToken);
    }
  } catch (error) {
    console.error('Error unregistering push:', error);
  }
}

function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

function getPlatform(): string {
  return navigator.platform;
}
```

---

### 4. Listen for Foreground Messages

Create `src/hooks/useFcmListener.ts`:

```typescript
import { useEffect } from 'react';
import { onMessage, messaging } from '@/config/firebase';
import { useToast } from './useToast';
import { useQueryClient } from '@tanstack/react-query';

export function useFcmListener() {
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Received foreground FCM message:', payload);

      const { title, body } = payload.notification || {};
      const data = payload.data || {};

      // Show toast notification
      const type = (data.type || 'info') as 'success' | 'error' | 'warning' | 'info';
      toast[type](title || 'New Notification', body || '');

      // Invalidate notifications query to refresh list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    });

    return () => unsubscribe();
  }, [toast, queryClient]);
}
```

---

### 5. Service Worker

Create `public/firebase-messaging-sw.js`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title || 'FitRecipes';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'View'
      }
    ],
    vibrate: [200, 100, 200],
    requireInteraction: payload.data?.priority === 'HIGH',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const url = event.notification.data.actionUrl || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});
```

---

### 6. Initialize FCM in App

In `src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFcmListener } from '@/hooks/useFcmListener';
import { requestPushPermission } from '@/services/pushNotifications';

function App() {
  const { user } = useAuth();
  
  // Listen for FCM messages
  useFcmListener();

  useEffect(() => {
    // Request push permission after user logs in
    if (user && 'Notification' in window) {
      const hasAsked = localStorage.getItem('fcm_permission_asked');
      
      if (!hasAsked) {
        // Wait a bit before asking (better UX)
        setTimeout(async () => {
          try {
            await requestPushPermission();
            localStorage.setItem('fcm_permission_asked', 'true');
          } catch (error) {
            console.error('Failed to register FCM:', error);
            localStorage.setItem('fcm_permission_asked', 'true');
          }
        }, 3000);
      }
    }
  }, [user]);

  return (
    // Your app JSX
  );
}
```

---

## Component Examples

### 1. Notification Bell Icon

```typescript
// src/components/NotificationBell.tsx
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/services/notificationApi';
import { useState } from 'react';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 60000, // Poll every minute
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}
```

---

### 2. Notification Dropdown

```typescript
// src/components/NotificationDropdown.tsx
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: Props) {
  const { 
    notifications, 
    unreadCount,
    isLoading, 
    markAllAsRead,
    clearAll 
  } = useNotifications(1, false);

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </h3>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-sm text-blue-600 hover:underline"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => clearAll()}
              className="text-sm text-gray-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={onClose}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t p-2">
          <a
            href="/notifications"
            className="block text-center text-sm text-blue-600 hover:underline"
            onClick={onClose}
          >
            View all notifications
          </a>
        </div>
      )}
    </div>
  );
}
```

---

### 3. Notification Item

```typescript
// src/components/NotificationItem.tsx
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import type { Notification } from '@/types/notification';

interface Props {
  notification: Notification;
  onClose: () => void;
}

export function NotificationItem({ notification, onClose }: Props) {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'INFO':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div
      className={`p-4 border-b hover:bg-gray-50 cursor-pointer flex gap-3 ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification(notification.id);
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mt-1">
          {notification.description}
        </p>

        {notification.recipe && (
          <div className="flex items-center gap-2 mt-2">
            <img
              src={notification.recipe.imageUrls[0]}
              alt={notification.recipe.title}
              className="w-10 h-10 rounded object-cover"
            />
            <span className="text-xs text-gray-500">
              {notification.recipe.title}
            </span>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );
}
```

---

### 4. Notification Settings Page

```typescript
// src/pages/NotificationSettings.tsx
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Loader2 } from 'lucide-react';

export function NotificationSettings() {
  const { preferences, isLoading, updatePreferences, isUpdating } =
    useNotificationPreferences();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!preferences) {
    return <div>Failed to load preferences</div>;
  }

  const handleToggle = (
    section: keyof typeof preferences,
    key: string,
    value: boolean
  ) => {
    updatePreferences({
      [section]: {
        ...preferences[section],
        [key]: value,
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>

      {/* Web Notifications */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">In-App Notifications</h2>
        <div className="space-y-3">
          <ToggleItem
            label="Recipe Approved"
            description="When your recipe is approved by an admin"
            checked={preferences.webNotifications.recipeApproved}
            onChange={(checked) =>
              handleToggle('webNotifications', 'recipeApproved', checked)
            }
          />
          <ToggleItem
            label="Recipe Rejected"
            description="When your recipe is rejected"
            checked={preferences.webNotifications.recipeRejected}
            onChange={(checked) =>
              handleToggle('webNotifications', 'recipeRejected', checked)
            }
          />
          <ToggleItem
            label="New Comments"
            description="When someone comments on your recipe"
            checked={preferences.webNotifications.newComment}
            onChange={(checked) =>
              handleToggle('webNotifications', 'newComment', checked)
            }
          />
          <ToggleItem
            label="5-Star Ratings"
            description="When someone gives your recipe 5 stars"
            checked={preferences.webNotifications.highRating}
            onChange={(checked) =>
              handleToggle('webNotifications', 'highRating', checked)
            }
          />
        </div>
      </section>

      {/* Push Notifications */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Push Notifications</h2>
        <ToggleItem
          label="Enable Push Notifications"
          description="Receive browser push notifications"
          checked={preferences.pushNotifications.enabled}
          onChange={(checked) =>
            handleToggle('pushNotifications', 'enabled', checked)
          }
        />
        {preferences.pushNotifications.enabled && (
          <div className="ml-6 mt-3 space-y-3">
            <ToggleItem
              label="Recipe Approved"
              checked={preferences.pushNotifications.recipeApproved}
              onChange={(checked) =>
                handleToggle('pushNotifications', 'recipeApproved', checked)
              }
            />
            <ToggleItem
              label="Recipe Rejected"
              checked={preferences.pushNotifications.recipeRejected}
              onChange={(checked) =>
                handleToggle('pushNotifications', 'recipeRejected', checked)
              }
            />
            <ToggleItem
              label="New Comments"
              checked={preferences.pushNotifications.newComment}
              onChange={(checked) =>
                handleToggle('pushNotifications', 'newComment', checked)
              }
            />
          </div>
        )}
      </section>

      {/* Email Notifications */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Email Notifications</h2>
        <ToggleItem
          label="Enable Email Notifications"
          description="Receive notifications via email"
          checked={preferences.emailNotifications.enabled}
          onChange={(checked) =>
            handleToggle('emailNotifications', 'enabled', checked)
          }
        />
        {preferences.emailNotifications.enabled && (
          <div className="ml-6 mt-3 space-y-3">
            <ToggleItem
              label="Recipe Approved"
              checked={preferences.emailNotifications.recipeApproved}
              onChange={(checked) =>
                handleToggle('emailNotifications', 'recipeApproved', checked)
              }
            />
            <ToggleItem
              label="Recipe Rejected"
              checked={preferences.emailNotifications.recipeRejected}
              onChange={(checked) =>
                handleToggle('emailNotifications', 'recipeRejected', checked)
              }
            />
            
            {/* Digest Frequency */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Email Digest Frequency
              </label>
              <select
                value={preferences.emailNotifications.digestFrequency}
                onChange={(e) =>
                  updatePreferences({
                    emailNotifications: {
                      ...preferences.emailNotifications,
                      digestFrequency: e.target.value as 'never' | 'daily' | 'weekly',
                    },
                  })
                }
                className="border rounded px-3 py-2"
              >
                <option value="never">Never</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// Helper component
interface ToggleItemProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleItem({ label, description, checked, onChange }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <div>
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-sm text-gray-600">{description}</div>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}
```

---

## Testing

### 1. Test Notification Creation

```typescript
// Test backend creates notification when recipe is approved
describe('Recipe Approval Notifications', () => {
  it('should create notification when admin approves recipe', async () => {
    // 1. Chef submits recipe
    const recipe = await submitRecipe(chefToken, recipeData);
    
    // 2. Admin approves recipe
    await approveRecipe(adminToken, recipe.id);
    
    // 3. Check chef received notification
    const notifications = await getNotifications(chefToken);
    
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('SUCCESS');
    expect(notifications[0].title).toBe('Recipe Approved! 🎉');
  });
});
```

---

### 2. Test FCM Token Registration

```typescript
describe('FCM Token Registration', () => {
  it('should register FCM token successfully', async () => {
    const response = await notificationApi.registerFcmToken(
      'fake-fcm-token-123',
      'Chrome',
      'Windows'
    );
    
    expect(response).toBeDefined();
    expect(typeof response).toBe('string'); // tokenId
  });
});
```

---

### 3. Test Notification Preferences

```typescript
describe('Notification Preferences', () => {
  it('should update preferences', async () => {
    await notificationApi.updatePreferences({
      webNotifications: {
        newComment: false
      }
    });
    
    const prefs = await notificationApi.getPreferences();
    expect(prefs.webNotifications.newComment).toBe(false);
  });
});
```

---

## Environment Variables

Add to `.env.local`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=fitrecipes-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fitrecipes-xxx
VITE_FIREBASE_STORAGE_BUCKET=fitrecipes-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
VITE_FIREBASE_VAPID_KEY=BNcE...  # From Firebase Console > Cloud Messaging
```

---

## Summary

### Key Implementation Steps:

1. ✅ **Install Firebase SDK** (`npm install firebase`)
2. ✅ **Configure Firebase** (add credentials to `.env`)
3. ✅ **Create Service Worker** (`public/firebase-messaging-sw.js`)
4. ✅ **Implement API Service** (`notificationApi.ts`)
5. ✅ **Create React Hooks** (`useNotifications`, `useNotificationPreferences`)
6. ✅ **Build UI Components** (Bell icon, dropdown, settings page)
7. ✅ **Initialize FCM** (request permission in App.tsx)
8. ✅ **Listen for Messages** (`useFcmListener` hook)

### Features Implemented:

- ✅ In-app notification center with bell icon
- ✅ Browser push notifications via FCM
- ✅ Email notifications (backend sends automatically)
- ✅ User preferences for all channels
- ✅ Real-time notification updates
- ✅ Mark as read/unread functionality
- ✅ Delete and clear notifications
- ✅ Notification filtering and pagination

### Backend Triggers:

- ✅ Recipe approved/rejected (Chef notifications)
- ✅ New comment on recipe (Chef notifications)
- ✅ 5-star rating received (Chef notifications)
- ✅ New recipe submission (Admin notifications)

---

**For questions or support, contact the backend team or refer to:**
- Backend Spec: `docs/NOTIFICATION_SYSTEM_BACKEND_SPEC.md`
- Firebase Docs: https://firebase.google.com/docs/cloud-messaging
