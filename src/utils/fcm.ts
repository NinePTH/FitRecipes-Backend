/**
 * Firebase Cloud Messaging (FCM) utility for sending push notifications
 *
 * Note: This is a placeholder implementation. In production:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Set up Firebase project and get service account credentials
 * 3. Uncomment the actual implementation below
 */

interface FcmMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send FCM push notification
 *
 * @param token - User's FCM token
 * @param message - Notification message
 */
export async function sendFcmNotification(
  token: string,
  message: FcmMessage
): Promise<void> {
  try {
    // Dynamic import with CommonJS/ESM interop handling. Some bundlers/runtime
    // return the module under the `default` property when using dynamic import.
    const adminModule = await import('firebase-admin');
    const admin: any = adminModule && (adminModule.default ?? adminModule);

    if (!admin) {
      throw new Error('Imported firebase-admin is undefined');
    }

    // Initialize Firebase Admin SDK (only once)
    if (!Array.isArray(admin.apps) || admin.apps.length === 0) {
      // Handle private key - it might be stored with escaped newlines or actual newlines
      let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

      // Debug: Log key format (only first/last 50 chars for security)
      // eslint-disable-next-line no-console
      console.log('🔍 Firebase Private Key Check:', {
        hasKey: !!privateKey,
        length: privateKey.length,
        hasActualNewlines: privateKey.includes('\n'),
        hasEscapedNewlines: privateKey.includes('\\n'),
        startsCorrectly: privateKey.startsWith('-----BEGIN'),
        preview: privateKey
          ? `${privateKey.substring(0, 50)}...${privateKey.substring(privateKey.length - 50)}`
          : 'missing',
      });

      // If the key doesn't contain actual newlines, try to unescape them
      if (privateKey && !privateKey.includes('\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
        // eslint-disable-next-line no-console
        console.log('✅ Converted escaped newlines to actual newlines');
      }

      // Validate that we have the key in correct format
      if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        throw new Error(
          'FIREBASE_PRIVATE_KEY is not in correct format. ' +
            'It should start with -----BEGIN PRIVATE KEY-----'
        );
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }

    // Send FCM message
    const response = await admin.messaging().send({
      token,
      notification: {
        title: message.title,
        body: message.body,
      },
      data: message.data || {},
      webpush: {
        headers: {
          Urgency: message.data?.priority === 'HIGH' ? 'high' : 'normal',
        },
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          requireInteraction: message.data?.priority === 'HIGH',
        },
      },
    });

    // eslint-disable-next-line no-console
    console.log(
      `✅ FCM notification sent successfully. Message ID: ${response}`
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to send FCM notification:', error);
    throw error;
  }
}

/**
 * Send FCM notification to multiple tokens (batch)
 */
export async function sendFcmNotificationBatch(
  tokens: string[],
  message: FcmMessage
): Promise<{ success: number; failure: number }> {
  const results = await Promise.allSettled(
    tokens.map(token => sendFcmNotification(token, message))
  );

  const success = results.filter(r => r.status === 'fulfilled').length;
  const failure = results.filter(r => r.status === 'rejected').length;

  return { success, failure };
}
