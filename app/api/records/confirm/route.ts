import { NextResponse } from 'next/server';
import { z } from 'zod';
import { todayInShanghai, makeRecordKey } from '@/lib/dates';
import { feishu } from '@/lib/feishu';
import { calculateScore } from '@/lib/scoring';
import { getRiskFlags } from '@/lib/validation';
import type { WorkoutRecord } from '@/types/workout';

const schema = z.object({
  user_id: z.string().min(1),
  nickname: z.string().min(1),
  date: z.string().min(8),
  device_source: z.string().min(1),
  steps: z.coerce.number().nonnegative(),
  calories: z.coerce.number().nonnegative(),
  duration_min: z.coerce.number().nonnegative(),
  distance_km: z.coerce.number().nonnegative(),
  weight: z.coerce.number().positive().optional().nullable(),
  screenshot_url: z.string().optional().default(''),
  raw_ocr_text: z.string().optional().default(''),
  draft_record_id: z.string().optional()
});

export async function POST(request: Request) {
  const input = schema.parse(await request.json());
  const recordKey = makeRecordKey(input.user_id, input.date);
  const existing = await feishu.findByRecordKey(recordKey);

  if (existing && existing.id !== input.draft_record_id) {
    return NextResponse.json({ message: '今天已经提交过，不能重复提交。', existing }, { status: 409 });
  }

  const previousRecord = await feishu.latestValidRecord(input.user_id, input.date);
  const record: WorkoutRecord = {
    ...input,
    record_key: recordKey,
    weight: input.weight ?? null,
    score: calculateScore({ ...input, confirmed: true }),
    confirmed: true,
    is_makeup: input.date < todayInShanghai(),
    risk_flags: getRiskFlags({ ...input, previousRecord }),
    admin_status: '正常',
    created_at: new Date().toISOString()
  };

  const saved = input.draft_record_id
    ? await feishu.updateRecord(input.draft_record_id, record)
    : await feishu.createRecord(record);
  return NextResponse.json(saved, { status: 201 });
}
