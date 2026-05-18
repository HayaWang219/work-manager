import { NextRequest, NextResponse } from 'next/server';
import { getCreators, createCreator } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') ?? undefined;
  const tier = searchParams.get('tier') ?? undefined;
  return NextResponse.json(await getCreators({ status, tier }));
}

export async function POST(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  if (!body.handle?.trim()) {
    return NextResponse.json({ error: 'handle required' }, { status: 400 });
  }
  const creator = await createCreator({
    handle: body.handle.trim(),
    real_name: body.real_name ?? null,
    email: body.email ?? null,
    platforms: body.platforms ?? [],
    primary_platform: body.primary_platform ?? null,
    tier: body.tier ?? 'mid',
    niche: body.niche ?? [],
    status: body.status ?? 'prospect',
    subscribers: body.subscribers ?? null,
    avg_views: body.avg_views ?? null,
    engagement_rate: body.engagement_rate ?? null,
    country: body.country ?? null,
    language: body.language ?? 'English',
    agency: body.agency ?? null,
    agency_contact: body.agency_contact ?? null,
    rate_card: body.rate_card ?? null,
    affinity_tags: body.affinity_tags ?? [],
    profile_url: body.profile_url ?? null,
    notes: body.notes ?? null,
  });
  return NextResponse.json(creator, { status: 201 });
}
