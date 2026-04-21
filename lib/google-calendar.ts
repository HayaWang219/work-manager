import { google } from 'googleapis';
import { getSystemState, setSystemState } from './db';

export function getOAuth2Client() {
  const clientId = getSystemState('google_client_id');
  const clientSecret = getSystemState('google_client_secret');

  if (!clientId || !clientSecret) return null;

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000/api/google/callback'
  );
}

export function getAuthUrl(client: InstanceType<typeof google.auth.OAuth2>): string {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    prompt: 'consent',
  });
}

export async function getAuthorizedClient() {
  const client = getOAuth2Client();
  if (!client) return null;

  const accessToken = getSystemState('google_access_token');
  const refreshToken = getSystemState('google_refresh_token');
  const expiry = getSystemState('google_token_expiry');

  if (!accessToken || !refreshToken) return null;

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiry ? Number(expiry) : undefined,
  });

  if (expiry && Date.now() > Number(expiry) - 60_000) {
    const { credentials } = await client.refreshAccessToken();
    setSystemState('google_access_token', credentials.access_token!);
    if (credentials.expiry_date) setSystemState('google_token_expiry', String(credentials.expiry_date));
    client.setCredentials(credentials);
  }

  return client;
}

export function isGoogleConnected(): boolean {
  return !!(getSystemState('google_access_token') && getSystemState('google_refresh_token'));
}
