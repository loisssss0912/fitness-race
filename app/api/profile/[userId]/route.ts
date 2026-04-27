import { NextResponse } from 'next/server';
import { feishu } from '@/lib/feishu';

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  const records = (await feishu.listRecords())
    .filter((record) => record.user_id === userId && record.confirmed && record.admin_status !== '剔除')
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    userId,
    profile: records[records.length - 1] ?? null,
    records
  });
}
