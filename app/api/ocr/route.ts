import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mockRecognizeFromUrl } from '@/lib/mockOcr';

const schema = z.object({
  blobUrl: z.string().url(),
  user_id: z.string().min(1),
  nickname: z.string().min(1)
});

export async function POST(request: Request) {
  const input = schema.parse(await request.json());
  return NextResponse.json(mockRecognizeFromUrl(input));
}
