import { googleAuth } from '@hono/oauth-providers/google';

// Configure Google OAuth
export const googleOAuth = googleAuth({
  client_id: process.env.GOOGLE_CLIENT_ID!,
  client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  scope: ['openid', 'email', 'profile'],
});

export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

/**
 * Handle OAuth callback and get user info
 */
export async function handleOAuthCallback(code: string): Promise<GoogleUser> {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${baseUrl}/api/v1/auth/google/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenData.error}`);
    }

    // Get user info using access token
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
    );

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error(`User info fetch failed: ${userData.error}`);
    }

    return userData;
  } catch (error) {
    throw new Error(
      `OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate OAuth authorization URL
 */
export function generateGoogleAuthUrl(state?: string): string {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${baseUrl}/api/v1/auth/google/callback`,
    scope: 'openid email profile',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
  });

  if (state) {
    params.append('state', state);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
