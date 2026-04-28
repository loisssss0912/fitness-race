import { NextResponse } from 'next/server';
import { feishu } from '@/lib/feishu';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    if (!recordId) return NextResponse.json({ message: '缺少 recordId。' }, { status: 400 });

    const result = await feishu.getOcrDraft(recordId);
    if (!result) return NextResponse.json({ recordId, status: 'pending', message: '等待识别结果。' });
    return NextResponse.json({ recordId, ...result });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '读取飞书 OCR 状态失败。' },
      { status: 500 }
    );
  }
}
