import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingDueDates } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get('days') ?? 7);
  return NextResponse.json(getUpcomingDueDates(days));
}
