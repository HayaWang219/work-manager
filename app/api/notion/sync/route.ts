import { NextResponse } from 'next/server';
import { syncNotion, isNotionConnected } from '@/lib/notion';
import { getSystemState } from '@/lib/db';

export async function GET() {
  return NextResponse.json({
    connected: isNotionConnected(),
    lastSync: getSystemState('notion_last_sync'),
  });
}

export async function POST() {
  if (!isNotionConnected()) {
    return NextResponse.json({ error: 'Notion not configured' }, { status: 400 });
  }
  try {
    const result = await syncNotion();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
