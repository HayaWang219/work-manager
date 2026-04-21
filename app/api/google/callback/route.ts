import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google-calendar';
import { setSystemState } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/setup?error=no_code', req.url));
  }

  const client = getOAuth2Client();
  if (!client) {
    return NextResponse.redirect(new URL('/setup?error=no_credentials', req.url));
  }

  try {
    const { tokens } = await client.getToken(code);
    setSystemState('google_access_token', tokens.access_token!);
    if (tokens.refresh_token) setSystemState('google_refresh_token', tokens.refresh_token);
    if (tokens.expiry_date) setSystemState('google_token_expiry', String(tokens.expiry_date));
    return NextResponse.redirect(new URL('/?google=connected', req.url));
  } catch {
    return NextResponse.redirect(new URL('/setup?error=token_exchange_failed', req.url));
  }
}
