import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingDueDates } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get('days') ?? 7);
  return NextResponse.json(await getUpcomingDueDates(days));
}
