import { NextResponse } from 'next/server';
import { feishu } from '@/lib/feishu';

export async function GET() {
  return NextResponse.json(await feishu.listRecords());
}
