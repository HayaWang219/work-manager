import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthorizedClient } from '@/lib/google-calendar';
import { upsertCalendarEvents, getCalendarEvents, clearOldCalendarEvents } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get('days') ?? 7);

  const now = new Date();
  const dateMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const dateMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 23, 59, 59).toISOString();

  const client = await getAuthorizedClient();
  if (!client) {
    const cached = getCalendarEvents(dateMin, dateMax);
    return NextResponse.json({ events: cached, cached: true });
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth: client });
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: dateMin,
      timeMax: dateMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50,
    });

    const events = (res.data.items ?? []).map(e => ({
      id: e.id!,
      title: e.summary ?? '(無標題)',
      start_time: e.start?.dateTime ?? e.start?.date ?? '',
      end_time: e.end?.dateTime ?? e.end?.date ?? undefined,
      all_day: e.start?.date ? 1 : 0,
      calendar_id: 'primary',
    }));

    clearOldCalendarEvents(dateMin);
    upsertCalendarEvents(events);

    return NextResponse.json({ events, cached: false });
  } catch {
    const cached = getCalendarEvents(dateMin, dateMax);
    return NextResponse.json({ events: cached, cached: true });
  }
}
