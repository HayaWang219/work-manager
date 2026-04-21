import { NextResponse } from 'next/server';
import { getTasks } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET() {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const tasks = await getTasks({ report_flag: true, status: 'todo' });
  return NextResponse.json(tasks);
}
