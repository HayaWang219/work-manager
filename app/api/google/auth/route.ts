import { NextResponse } from 'next/server';
import { getOAuth2Client, getAuthUrl } from '@/lib/google-calendar';

export async function GET() {
  const client = getOAuth2Client();
  if (!client) {
    return NextResponse.redirect(new URL('/setup', 'http://localhost:3000'));
  }
  const url = getAuthUrl(client);
  return NextResponse.redirect(url);
}
