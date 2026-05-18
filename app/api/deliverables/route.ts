import { NextRequest, NextResponse } from 'next/server';
import { getDeliverables, createDeliverable } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const campaignId = searchParams.get('campaignId');
  const creatorId = searchParams.get('creatorId');
  const status = searchParams.get('status') ?? undefined;

  return NextResponse.json(
    await getDeliverables({
      campaignId: campaignId ? Number(campaignId) : undefined,
      creatorId: creatorId ? Number(creatorId) : undefined,
      status,
    }),
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  if (!body.campaign_id || !body.creator_id) {
    return NextResponse.json({ error: 'campaign_id and creator_id required' }, { status: 400 });
  }
  const deliverable = await createDeliverable({
    campaign_id: Number(body.campaign_id),
    creator_id: Number(body.creator_id),
    deliverable_type: body.deliverable_type ?? 'dedicated_video',
    platform: body.platform ?? null,
    status: body.status ?? 'prospect',
    due_date: body.due_date ?? null,
    publish_date: body.publish_date ?? null,
    content_url: body.content_url ?? null,
    views: body.views ?? null,
    likes: body.likes ?? null,
    comments: body.comments ?? null,
    payment_amount: body.payment_amount ?? null,
    payment_status: body.payment_status ?? 'pending',
    notes: body.notes ?? null,
  });
  return NextResponse.json(deliverable, { status: 201 });
}
