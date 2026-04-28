import { NextResponse } from 'next/server';
import { feishu } from '@/lib/feishu';
import { participants as fallbackParticipants } from '@/lib/users';

export async function GET() {
  try {
    const participants = await feishu.listParticipants();
    return NextResponse.json({ participants });
  } catch (error) {
    console.error('List participants failed', error);
    return NextResponse.json({ participants: fallbackParticipants });
  }
}
