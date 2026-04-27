import { NextResponse } from 'next/server';
import { participants } from '@/lib/users';

export async function GET() {
  return NextResponse.json({ participants });
}
