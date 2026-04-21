import { NextResponse } from 'next/server';
import { getTasks } from '@/lib/db';

export async function GET() {
  const tasks = getTasks({ report_flag: 1, status: 'todo' });
  return NextResponse.json(tasks);
}
