import { NextRequest, NextResponse } from 'next/server';
import { setSystemState, getSystemState } from '@/lib/db';
import { isGoogleConnected } from '@/lib/google-calendar';
import { isNotionConnected, getNotionClient, getNotionDatabaseId } from '@/lib/notion';

export async function GET() {
  return NextResponse.json({
    googleClientId: getSystemState('google_client_id') ?? '',
    googleConnected: isGoogleConnected(),
    notionToken: getSystemState('notion_token') ? '••••••••' : '',
    notionDatabaseId: getSystemState('notion_database_id') ?? '',
    notionConnected: isNotionConnected(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.google_client_id !== undefined) setSystemState('google_client_id', body.google_client_id);
  if (body.google_client_secret !== undefined) setSystemState('google_client_secret', body.google_client_secret);
  if (body.notion_token !== undefined) setSystemState('notion_token', body.notion_token);
  if (body.notion_database_id !== undefined) setSystemState('notion_database_id', body.notion_database_id);

  if (body.test_notion) {
    const client = getNotionClient();
    const dbId = getNotionDatabaseId();
    if (!client || !dbId) return NextResponse.json({ ok: false, error: 'Missing credentials' });
    try {
      await client.databases.retrieve({ database_id: dbId });
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e) });
    }
  }

  return NextResponse.json({ ok: true });
}
