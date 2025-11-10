# Notification System - Backend Integration Specification

## 📋 Overview

This document specifies the backend requirements for implementing a real-time notification system with persistent storage, Firebase Cloud Messaging (FCM) for push notifications, and email notifications. The system differentiates between **transient toast notifications** (feedback only) and **persistent notifications** (saved to history).

**Technology Stack:**
- 🔔 **Real-Time Delivery:** Firebase Cloud Messaging (FCM) for web push notifications
- 📧 **Email Notifications:** Backend email service (already implemented)
- 🌐 **Platform:** Browser-only (no mobile app)

---

## 🎯 Notification Categories

### 1️⃣ **Transient Notifications (Toast Only - NOT Saved)**

These provide immediate user feedback but are NOT stored in notification history:

| Action | Type | Title | Description | Trigger |
|--------|------|-------|-------------|---------|
| User rates recipe | `success` | "Rating submitted!" | "You rated this recipe X stars." | After successful rating |
| User deletes rating | `success` | "Rating removed" | "Your rating has been deleted." | After deleting rating |
| User posts comment | `success` | "Comment posted!" | "Your comment has been added." | After posting comment |
| User edits comment | `success` | "Comment updated" | "Your comment has been edited." | After editing comment |
| User deletes comment | `success` | "Comment deleted" | "Your comment has been removed." | After deleting comment |
| User saves recipe | `success` | "Recipe saved!" | "Added to your saved recipes." | When user bookmarks recipe |
| User shares recipe | `info` | "Link copied!" | "Recipe link copied to clipboard." | When user copies share link |
| User tries to rate own recipe | `warning` | "Cannot rate own recipe" | "You cannot rate your own recipe." | When chef rates their recipe |
| Login required | `warning` | "Login required" | "Please login to [action]." | When unauthenticated user tries action |
| API errors | `error` | "Action failed" | Specific error message | When API call fails |

**Implementation:** Frontend-only, no backend involvement.

---

### 2️⃣ **Persistent Notifications (Saved to History + Real-Time)**

These are saved to database and delivered via WebSocket/Push:

#### **For Recipe Authors (Chefs)**

| Event | Type | Title | Description | Recipient | Priority |
|-------|------|-------|-------------|-----------|----------|
| Recipe approved | `success` | "Recipe Approved! 🎉" | "Your recipe '{title}' has been approved and is now live." | Recipe author | `high` |
| Recipe rejected | `error` | "Recipe Rejected" | "Your recipe '{title}' was rejected. Reason: {reason}" | Recipe author | `high` |
| Comment on my recipe | `info` | "New Comment" | "{user} commented on your recipe '{title}'" | Recipe author | `medium` |
| High rating received | `success` | "5-Star Rating!" | "{user} gave your recipe '{title}' 5 stars!" | Recipe author | `low` |

#### **For Admins**

| Event | Type | Title | Description | Recipient | Priority |
|-------|------|-------|-------------|-----------|----------|
| New recipe submission | `info` | "New Recipe Submitted" | "{chef} submitted '{title}' for approval" | All admins | `high` |
| Recipe needs review | `warning` | "Pending Review" | "Recipe '{title}' is awaiting approval for {X} days" | All admins | `medium` |

#### **For All Users (Optional)**

| Event | Type | Title | Description | Recipient | Priority |
|-------|------|-------|-------------|-----------|----------|
| Recipe updated | `info` | "Recipe Updated" | "'{title}' you saved has been updated by the chef" | Users who saved the recipe | `low` |
| New recipe from followed chef | `info` | "New Recipe Available" | "{chef} published a new recipe: '{title}'" | Chef's followers | `low` |

---

## 🗄️ Database Schema

**Note:** Backend team should design the database schema according to their architecture and best practices. Below are the **required data points** that must be stored:

### **Notifications Storage Requirements**

The system must store the following information for each notification:

**Core Fields:**
- Unique notification ID
- Recipient user ID
- Notification type (`success`, `error`, `warning`, `info`)
- Title and description text
- Priority level (`low`, `medium`, `high`)

**Related Entities (optional/nullable):**
- Related recipe ID
- Related comment ID
- Related rating ID
- Actor user ID (who triggered the notification)

**Metadata:**
- Action type identifier (e.g., `recipe_approved`, `new_comment`)
- Action URL (deep link to relevant page)

**Status Tracking:**
- Read/unread status
- Read timestamp
- Soft delete flag (for "clear" functionality)

**Timestamps:**
- Created timestamp
- Updated timestamp

**Performance Requirements:**
- Must support efficient queries by user ID
- Must support filtering by read/unread status
- Must support pagination with good performance
- Must support sorting by creation date

---

### **Notification Preferences Storage Requirements**

The system must store user preferences for different notification channels:

**Web Notifications (In-App):**
- Recipe approved/rejected
- New comment on my recipe
- 5-star rating received (optional, default OFF)
- New recipe submission (for admins only)

**Push Notifications (Browser):**
- Global push enabled/disabled toggle
- Per-event push preferences (same events as web notifications)

**Email Notifications:**
- Global email enabled/disabled toggle
- Per-event email preferences (same events as web notifications)
- Email digest frequency (`never`, `daily`, `weekly`)

---

### **FCM Token Storage Requirements**

The system must store FCM tokens for browser push notifications:

**Required Fields:**
- Unique subscription ID
- User ID
- FCM token (from Firebase)
- Browser information (for debugging)
- Operating system information
- Active/inactive status
- Last used timestamp
- Created timestamp

**Note:** Backend should implement automatic cleanup of expired/invalid FCM tokens.

---

## 🔌 API Endpoints

### **Base URL:** `/api/v1/notifications`

### 1. **Get User Notifications**

```http
GET /api/v1/notifications
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (number, default: 1) - Pagination page
- `limit` (number, default: 20, max: 100) - Items per page
- `unread` (boolean, optional) - Filter unread only
- `priority` (enum: low|medium|high, optional) - Filter by priority
- `type` (enum: success|error|warning|info, optional) - Filter by type

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid-1",
        "type": "success",
        "title": "Recipe Approved! 🎉",
        "description": "Your recipe 'Healthy Quinoa Bowl' has been approved and is now live.",
        "priority": "high",
        "recipe": {
          "id": "recipe-uuid",
          "title": "Healthy Quinoa Bowl",
          "imageUrl": "https://..."
        },
        "actor": {
          "id": "admin-uuid",
          "firstName": "John",
          "lastName": "Admin"
        },
        "actionType": "recipe_approved",
        "actionUrl": "/recipes/recipe-uuid",
        "isRead": false,
        "readAt": null,
        "createdAt": "2025-11-02T10:30:00Z"
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

---

### 2. **Mark Notification as Read**

```http
PUT /api/v1/notifications/:id/read
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "isRead": true,
    "readAt": "2025-11-02T10:35:00Z"
  }
}
```

---

### 3. **Mark All as Read**

```http
PUT /api/v1/notifications/mark-all-read
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updatedCount": 12
  }
}
```

---

### 4. **Delete Notification**

```http
DELETE /api/v1/notifications/:id
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### 5. **Clear All Notifications**

```http
DELETE /api/v1/notifications
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 45
  }
}
```

---

### 6. **Get Unread Count**

```http
GET /api/v1/notifications/unread-count
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 12
  }
}
```

---

### 7. **Get Notification Preferences**

```http
GET /api/v1/notifications/preferences
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "webNotifications": {
      "recipeApproved": true,
      "recipeRejected": true,
      "newComment": true,
      "highRating": false,
      "newSubmission": true
    },
    "pushNotifications": {
      "enabled": true,
      "recipeApproved": true,
      "recipeRejected": true,
      "newComment": false,
      "highRating": false,
      "newSubmission": true
    },
    "emailNotifications": {
      "enabled": true,
      "recipeApproved": true,
      "recipeRejected": true,
      "newComment": false,
      "digestFrequency": "weekly"
    }
  }
}
```

---

### 8. **Update Notification Preferences**

```http
PUT /api/v1/notifications/preferences
Authorization: Bearer {token}
Content-Type: application/json

{
  "webNotifications": {
    "newComment": false
  },
  "pushNotifications": {
    "enabled": true,
    "newComment": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully"
}
```

---

### 9. **Register FCM Token**

```http
POST /api/v1/notifications/fcm/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "fcmToken": "firebase_cloud_messaging_token_here",
  "browser": "Chrome",
  "os": "Windows"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokenId": "token-uuid",
    "message": "FCM token registered successfully"
  }
}
```

---

### 10. **Unregister FCM Token**

```http
DELETE /api/v1/notifications/fcm/unregister
Authorization: Bearer {token}
Content-Type: application/json

{
  "fcmToken": "firebase_cloud_messaging_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token removed successfully"
}
```

---

## � Real-Time Notification Delivery

### **Firebase Cloud Messaging (FCM)**

The system uses Firebase Cloud Messaging for real-time push notifications to browsers.

### **Architecture Overview**

```
┌─────────────┐         ┌─────────────────┐         ┌──────────────┐
│   Backend   │────────▶│  Firebase FCM   │────────▶│   Browser    │
│   Server    │         │     Service     │         │  (Frontend)  │
└─────────────┘         └─────────────────┘         └──────────────┘
     │                                                       │
     │ 1. Create notification                               │
     │ 2. Save to database                                  │
     │ 3. Send FCM message                                  │
     │                                                       │
     │                                          4. Receive FCM message
     │                                          5. Show browser notification
     │                                          6. Update UI (if app is open)
```

### **Backend Implementation Requirements**

**When a notification event occurs:**

1. **Create notification record** in database
2. **Check user preferences** (web/push/email)
3. **Send via enabled channels:**
   - If web notifications enabled: Store in database ✅
   - If push notifications enabled: Send via FCM 🔔
   - If email notifications enabled: Send email 📧

**FCM Message Format:**

The backend should send FCM messages with this structure:

```json
{
  "token": "user_fcm_token_from_database",
  "notification": {
    "title": "Recipe Approved! 🎉",
    "body": "Your recipe 'Healthy Quinoa Bowl' has been approved and is now live."
  },
  "data": {
    "notificationId": "uuid-1",
    "type": "recipe_approved",
    "recipeId": "recipe-uuid",
    "actionUrl": "/recipes/recipe-uuid",
    "priority": "high",
    "timestamp": "2025-11-02T10:30:00Z"
  },
  "webpush": {
    "headers": {
      "Urgency": "high"
    },
    "notification": {
      "icon": "/icon-192x192.png",
      "badge": "/badge-72x72.png",
      "vibrate": [200, 100, 200],
      "requireInteraction": true,
      "actions": [
        {
          "action": "view",
          "title": "View Recipe"
        }
      ]
    }
  }
}
```

**Backend Libraries:**
- Node.js: `firebase-admin` SDK
- Other languages: Firebase Admin SDK for respective language

---

## 📧 Email Notification Implementation

### **Email Templates Required**

The backend should send HTML email notifications for important events:

#### **1. Recipe Approved Email**

**Subject:** `🎉 Your Recipe "${recipeTitle}" Has Been Approved!`

**Content:**
```html
Hi ${chefName},

Great news! Your recipe "${recipeTitle}" has been approved by our team 
and is now live on FitRecipes.

What's next?
- Share your recipe with friends and family
- Respond to comments from the community
- See your recipe statistics

[View Your Recipe] [Share Recipe]

Best regards,
The FitRecipes Team
```

---

#### **2. Recipe Rejected Email**

**Subject:** `Recipe "${recipeTitle}" - Revision Needed`

**Content:**
```html
Hi ${chefName},

Your recipe "${recipeTitle}" needs some revisions before it can be published.

Reason: ${rejectionReason}

You can edit your recipe and resubmit it for approval.

[Edit Recipe] [View Guidelines]

If you have questions, please contact us.

Best regards,
The FitRecipes Team
```

---

#### **3. New Comment Email**

**Subject:** `💬 ${commenterName} commented on your recipe "${recipeTitle}"`

**Content:**
```html
Hi ${chefName},

${commenterName} just commented on your recipe "${recipeTitle}":

"${commentContent}"

[View Comment] [Reply]

You can manage your email preferences in settings.

Best regards,
The FitRecipes Team
```

---

#### **4. New Recipe Submission Email (for Admins)**

**Subject:** `📝 New Recipe Pending Approval: "${recipeTitle}"`

**Content:**
```html
Hi Admin,

${chefName} has submitted a new recipe for approval:

Recipe: ${recipeTitle}
Main Ingredient: ${mainIngredient}
Cuisine: ${cuisineType}
Submitted: ${submissionDate}

[Review Recipe] [View Pending Queue]

Best regards,
FitRecipes Notification System
```

---

#### **5. Weekly Digest Email**

**Subject:** `📊 Your FitRecipes Weekly Summary`

**Content:**
```html
Hi ${userName},

Here's what happened with your recipes this week:

📊 Recipe Stats:
- ${totalViews} total views
- ${newComments} new comments
- ${newRatings} new ratings

🔔 Unread Notifications: ${unreadCount}

Top Performing Recipe: ${topRecipe}

[View All Notifications] [Visit Dashboard]

You're receiving this because you opted in to weekly digests.
[Update Email Preferences]

Best regards,
The FitRecipes Team
```

---

### **Email Sending Logic**

**When to send emails:**

1. **Immediate emails** (send right away):
   - Recipe approved
   - Recipe rejected
   - New comment (if user has email notifications enabled)
   - New recipe submission (for admins)

2. **Digest emails** (scheduled):
   - Daily digest: Send at 8:00 AM user's timezone
   - Weekly digest: Send every Monday at 8:00 AM

**Email Preferences:**
- Check `notification_preferences.email_enabled` before sending
- Check individual event preferences (e.g., `email_new_comment`)
- Respect `email_digest_frequency` setting
- Include unsubscribe link in all emails

---

## 🔄 Notification Delivery Flow

### **Complete Flow for Each Event**

```
┌──────────────────────────────────────────────────────────────┐
│                    Event Occurs                              │
│  (Recipe approved, new comment, recipe submitted, etc.)      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              1. Create Notification Record                   │
│  - Save to database with all details                         │
│  - Generate unique notification ID                           │
│  - Set timestamps, priority, action URL                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│           2. Check User Notification Preferences             │
│  - Query notification_preferences table                      │
│  - Check: web_enabled, push_enabled, email_enabled          │
│  - Check event-specific preferences                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│   WEB      │  │   PUSH     │  │   EMAIL    │
│ (Database) │  │   (FCM)    │  │ (Service)  │
└────────────┘  └────────────┘  └────────────┘
      │               │               │
      │               │               │
      ▼               ▼               ▼
┌──────────────────────────────────────────────┐
│  Notification delivered via enabled channels │
└──────────────────────────────────────────────┘
```

### **Priority Handling**

**High Priority:**
- Recipe approved/rejected
- New recipe submission (admins)
- Send immediately via all enabled channels

**Medium Priority:**
- New comment notifications
- Send via enabled channels, can be batched for email

**Low Priority:**
- 5-star rating notifications
- Recipe updated notifications
- Include in email digests, send push only if enabled

---

## 🎬 Notification Trigger Events & Backend Logic

### **Backend Implementation Guide**

The backend should trigger notifications in these scenarios. **Implementation details (code structure, service architecture) are up to the backend team.**

#### **1. Recipe Approval (Admin → Chef)**

**When:** Admin approves a recipe

**Action:** 
- Create notification record in database
- Check user preferences
- Send via enabled channels (web ✅ / push 🔔 / email 📧)

**Notification Data:**
```json
{
  "userId": "<recipe_author_id>",
  "type": "success",
  "title": "Recipe Approved! 🎉",
  "description": "Your recipe '{recipe_title}' has been approved and is now live.",
  "priority": "high",
  "recipeId": "<recipe_id>",
  "actorUserId": "<admin_id>",
  "actionType": "recipe_approved",
  "actionUrl": "/recipes/{recipe_id}"
}
```

**Email:** Send "Recipe Approved" email (see email templates section)

---

#### **2. Recipe Rejection (Admin → Chef)**

**When:** Admin rejects a recipe

**Action:**
- Create notification record
- Check user preferences
- Send via enabled channels

**Notification Data:**
```json
{
  "userId": "<recipe_author_id>",
  "type": "error",
  "title": "Recipe Rejected",
  "description": "Your recipe '{recipe_title}' was rejected. Reason: {reason}",
  "priority": "high",
  "recipeId": "<recipe_id>",
  "actorUserId": "<admin_id>",
  "actionType": "recipe_rejected",
  "actionUrl": "/my-recipes"
}
```

**Email:** Send "Recipe Rejected" email with reason

---

#### **3. New Comment (Commenter → Recipe Author)**

**When:** User comments on a recipe

**Conditions:**
- Don't notify if user comments on their own recipe
- Check if author has this notification type enabled

**Action:**
- Create notification record
- Check user preferences
- Send via enabled channels

**Notification Data:**
```json
{
  "userId": "<recipe_author_id>",
  "type": "info",
  "title": "New Comment",
  "description": "{commenter_name} commented on your recipe '{recipe_title}'",
  "priority": "medium",
  "recipeId": "<recipe_id>",
  "commentId": "<comment_id>",
  "actorUserId": "<commenter_id>",
  "actionType": "new_comment",
  "actionUrl": "/recipes/{recipe_id}#comment-{comment_id}"
}
```

**Email:** Send "New Comment" email (if enabled in preferences)

---

#### **4. High Rating (Rater → Recipe Author)**

**When:** User gives 5-star rating to a recipe

**Conditions:**
- Only for 5-star ratings
- Don't notify if user rates their own recipe
- Usually disabled by default in preferences

**Action:**
- Create notification record
- Check user preferences (likely disabled)
- Send via enabled channels only if user opted in

**Notification Data:**
```json
{
  "userId": "<recipe_author_id>",
  "type": "success",
  "title": "5-Star Rating! ⭐",
  "description": "{rater_name} gave your recipe '{recipe_title}' 5 stars!",
  "priority": "low",
  "recipeId": "<recipe_id>",
  "ratingId": "<rating_id>",
  "actorUserId": "<rater_id>",
  "actionType": "high_rating",
  "actionUrl": "/recipes/{recipe_id}"
}
```

**Email:** Usually not sent (disabled by default), include in weekly digest

---

#### **5. New Recipe Submission (Chef → All Admins)**

**When:** Chef submits a recipe for approval

**Action:**
- Get all admin users
- Create notification record for each admin
- Check each admin's preferences
- Send via enabled channels

**Notification Data:**
```json
{
  "userId": "<admin_id>",
  "type": "info",
  "title": "New Recipe Submitted",
  "description": "{chef_name} submitted '{recipe_title}' for approval",
  "priority": "high",
  "recipeId": "<recipe_id>",
  "actorUserId": "<chef_id>",
  "actionType": "new_submission",
  "actionUrl": "/admin/recipes/pending"
}
```

**Email:** Send "New Recipe Submission" email to admins

---

## 📱 Frontend Integration

### **Firebase Cloud Messaging Setup**

#### **1. Firebase Configuration**

Add Firebase to your project (`src/firebase-config.ts`):

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

export { messaging };
```

---

#### **2. Request Notification Permission**

```typescript
// src/services/notifications.ts
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/firebase-config';
import { apiClient } from './api';
import { useToast } from '@/hooks/useToast';

export async function requestNotificationPermission() {
  try {
    // Request browser notification permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Get FCM token
    const fcmToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (!fcmToken) {
      throw new Error('Failed to get FCM token');
    }

    // Register token with backend
    await apiClient.post('/notifications/fcm/register', {
      fcmToken,
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
              navigator.userAgent.includes('Firefox') ? 'Firefox' : 
              navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
      os: navigator.platform,
    });

    return fcmToken;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
}

export async function unregisterNotifications() {
  try {
    const fcmToken = await getToken(messaging);
    
    if (fcmToken) {
      await apiClient.delete('/notifications/fcm/unregister', {
        data: { fcmToken }
      });
    }
  } catch (error) {
    console.error('Error unregistering notifications:', error);
    throw error;
  }
}
```

---

#### **3. Handle Foreground Messages (React Hook)**

```typescript
// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import { onMessage } from 'firebase/messaging';
import { messaging } from '@/firebase-config';
import { useToast } from './useToast';

export function useNotifications() {
  const toast = useToast();

  useEffect(() => {
    // Handle messages when app is in foreground
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);

      // Extract notification data
      const { title, body } = payload.notification || {};
      const data = payload.data || {};

      // Show toast notification
      const notificationType = data.type || 'info';
      toast[notificationType](
        title || 'New Notification',
        body || ''
      );

      // Add to notification history
      if (data.notificationId) {
        toast.addNotificationToHistory({
          id: data.notificationId,
          type: notificationType as 'success' | 'error' | 'warning' | 'info',
          title: title || 'New Notification',
          description: body,
          timestamp: new Date(),
          isRead: false,
          actionUrl: data.actionUrl,
          recipeId: data.recipeId,
        });
      }
    });

    return () => unsubscribe();
  }, [toast]);
}
```

---

#### **4. Service Worker for Background Messages**

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
    requireInteraction: true,
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

#### **5. Integration in App Component**

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { requestNotificationPermission } from '@/services/notifications';

function App() {
  const { user } = useAuth();
  
  // Initialize FCM message listener
  useNotifications();

  useEffect(() => {
    // Request notification permission when user logs in
    if (user && 'Notification' in window) {
      const hasAskedPermission = localStorage.getItem('fcm_permission_asked');
      
      if (!hasAskedPermission) {
        // Wait a bit before asking (better UX)
        setTimeout(async () => {
          try {
            await requestNotificationPermission();
            localStorage.setItem('fcm_permission_asked', 'true');
            console.log('FCM token registered successfully');
          } catch (error) {
            console.error('Failed to register FCM token:', error);
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

### **6. Environment Variables**

Add to `.env.local`:

```env
# Firebase Configuration (get from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

---

### **7. Update ToastContext for History**

Add method to receive notifications from FCM:

```typescript
// src/contexts/ToastContext.ts
export interface ToastContextType {
  // ... existing methods
  addNotificationToHistory: (notification: Toast) => void;
  updateUnreadCount: (count: number) => void;
}

// In ToastProvider:
const addNotificationToHistory = useCallback((notification: Toast) => {
  setNotifications(prev => [notification, ...prev]);
}, []);

const updateUnreadCount = useCallback((count: number) => {
  // Update unread count from backend
  setNotifications(prev => {
    const unreadDiff = count - prev.filter(n => !n.isRead).length;
    if (unreadDiff > 0) {
      // Backend has more unread, fetch new notifications
      // This is handled by the notification sync
    }
    return prev;
  });
}, []);
```

---

## 🔒 Security & Authorization

### **Notification Access Rules**

1. **Users can only access their own notifications**
   - Enforce user ID match in all endpoints
   - Use JWT token to identify user

2. **Admins get admin-specific notifications**
   - Check user role for admin-only events
   - Broadcast to all admins for recipe submissions

3. **FCM Token Security**
   - Validate JWT token before registering FCM token
   - Associate FCM tokens with specific user accounts
   - Implement token refresh/rotation mechanism
   - Automatically cleanup invalid/expired tokens

4. **Rate Limiting**
   - Limit notification creation per user
   - Prevent notification spam
   - Implement debouncing for similar events
   - Throttle FCM messages per user

---

## 📊 Performance Considerations

### **Database Optimization**

1. **Indexes:** Create indexes on frequently queried columns (user_id, is_read, created_at)
2. **Pagination:** Always use pagination for listing notifications
3. **Soft Delete:** Use soft delete flag instead of hard delete
4. **Archiving:** Archive old read notifications after 90 days
5. **Query Optimization:** Use database-specific optimization features

### **FCM Optimization**

1. **Batch Processing:** Send FCM messages in batches when possible
2. **Priority Queue:** Process high-priority notifications first
3. **Retry Logic:** Implement exponential backoff for failed sends
4. **Token Cleanup:** Periodically remove expired/invalid FCM tokens
5. **Message Throttling:** Respect FCM rate limits and quotas

### **Email Optimization**

1. **Queue System:** Use message queue for email sending (Redis, RabbitMQ, etc.)
2. **Batch Processing:** Group similar emails for batch sending
3. **Template Caching:** Cache email templates for performance
4. **Rate Limiting:** Respect email service provider limits
5. **Digest Grouping:** Efficiently batch digest emails

---

## 🧪 Testing Requirements

### **Unit Tests**
- Notification creation logic
- Permission checking
- FCM message formatting
- Email template rendering
- User preference validation

### **Integration Tests**
- End-to-end notification flow (create → send → deliver)
- FCM token registration/unregistration
- Email delivery
- Database queries and performance
- API endpoint responses

### **Load Tests**
- Notification creation throughput
- FCM message delivery rate
- Email sending performance
- Database query performance under load
- API endpoint response times

---

## 📝 Implementation Priority

### **Phase 1: Core Backend (Week 1-2)**
1. ✅ Database schema design and migration
2. ✅ REST API endpoints (GET, PUT, DELETE)
3. ✅ Notification creation service
4. ✅ Basic authentication & authorization
5. ✅ User preferences management

### **Phase 2: Firebase Integration (Week 3-4)**
1. ✅ Firebase project setup
2. ✅ FCM token registration endpoint
3. ✅ FCM message sending service
4. ✅ Frontend Firebase integration
5. ✅ Service worker implementation
6. ✅ Testing and debugging

### **Phase 3: Email Notifications (Week 5-6)**
1. ✅ Email template creation
2. ✅ Email sending service integration
3. ✅ Digest email scheduler (daily/weekly)
4. ✅ Email preference handling
5. ✅ Testing email deliverability

### **Phase 4: Polish & Optimization (Week 7-8)**
1. ✅ Notification preferences UI (frontend)
2. ✅ Performance optimization
3. ✅ Error handling & retry logic
4. ✅ Comprehensive testing
5. ✅ Documentation & deployment

---

## 🚀 Deployment Checklist

### **Backend Requirements**
- [ ] Database migrations applied
- [ ] Firebase Admin SDK configured
- [ ] Firebase project created and configured
- [ ] FCM server key added to backend environment
- [ ] Email service configured (already done)
- [ ] Environment variables set (FCM credentials, email settings)
- [ ] Message queue system set up (for emails)
- [ ] Cron jobs scheduled (digest emails)
- [ ] Error monitoring enabled

### **Frontend Requirements**
- [ ] Firebase SDK installed (`npm install firebase`)
- [ ] Firebase configuration added to `.env.local`
- [ ] Service worker registered (`firebase-messaging-sw.js`)
- [ ] FCM integration implemented
- [ ] Notification permission flow added
- [ ] Toast notification system connected to FCM
- [ ] Environment variables set (Firebase config, VAPID key)

### **Firebase Console Setup**
- [ ] Create Firebase project
- [ ] Enable Cloud Messaging
- [ ] Generate VAPID key pair
- [ ] Add web app to Firebase project
- [ ] Configure authorized domains
- [ ] Set up Firebase Admin SDK service account

### **Monitoring & Logging**
- [ ] FCM delivery metrics tracking
- [ ] Email delivery success/failure rates
- [ ] Notification creation monitoring
- [ ] Error tracking and alerting
- [ ] Database performance monitoring
- [ ] API endpoint metrics

---

## 📦 Installation & Setup

### **Backend Dependencies**

**Node.js/TypeScript:**
```bash
npm install firebase-admin
# OR
yarn add firebase-admin
```

**Python:**
```bash
pip install firebase-admin
```

### **Frontend Dependencies**

```bash
npm install firebase
# OR
yarn add firebase
```

### **Firebase Project Setup**

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Follow the setup wizard

2. **Enable Cloud Messaging:**
   - Go to Project Settings → Cloud Messaging
   - Generate VAPID key pair (for web push)
   - Note the Server Key (for backend)

3. **Add Web App:**
   - Go to Project Settings → General
   - Click "Add app" → Web
   - Register app and copy configuration

4. **Service Account (Backend):**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download JSON file (keep secure!)
   - Add to backend environment

### **Backend Environment Variables**

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# OR use service account JSON path
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

### **Frontend Environment Variables**

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
VITE_FIREBASE_VAPID_KEY=BNcE...  # From Cloud Messaging settings
```

---

## 📚 Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Web Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Firebase Console](https://console.firebase.google.com/)

---

## 🎯 Backend Implementation Notes

**The backend team should:**

1. **Design database schema** according to their architecture (the document provides required data points, not prescriptive schema)

2. **Implement notification service** with:
   - Notification creation function
   - User preference checking
   - Multi-channel delivery (web/push/email)
   - Error handling and retries

3. **Integrate Firebase Admin SDK** for sending FCM messages

4. **Use existing email service** to send notification emails

5. **Create cron jobs** for scheduled tasks:
   - Daily digest emails (8:00 AM)
   - Weekly digest emails (Monday 8:00 AM)
   - Cleanup old notifications (daily)
   - Remove invalid FCM tokens (weekly)

6. **Implement proper error handling**:
   - FCM token invalid → remove from database
   - Email sending failed → retry with backoff
   - Database errors → log and alert

7. **Add monitoring and metrics**:
   - Notification creation rate
   - FCM delivery success rate
   - Email delivery success rate
   - API endpoint performance

---

**Document Version:** 2.0  
**Last Updated:** November 2, 2025  
**Status:** Ready for Implementation  
**Changes from v1.0:** Replaced WebSocket with Firebase FCM, added email notification details, removed mobile app support, simplified backend implementation guidance
