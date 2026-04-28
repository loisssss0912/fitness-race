import { NextResponse } from 'next/server';
import { feishu } from '@/lib/feishu';
import { mockRecognizeFromUrl } from '@/lib/mockOcr';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = String(formData.get('user_id') ?? '');
    const nickname = String(formData.get('nickname') ?? '');

    if (!(file instanceof File)) {
      return NextResponse.json({ message: '没有收到图片文件。' }, { status: 400 });
    }
    if (!userId || !nickname) {
      return NextResponse.json({ message: '缺少用户身份。' }, { status: 400 });
    }

    if (feishu.isMock) {
      const draft = mockRecognizeFromUrl({ blobUrl: `mock://${file.name}-${file.size}`, user_id: userId, nickname });
      return NextResponse.json({ recordId: `mock_${Date.now()}`, status: 'ready', draft });
    }

    const result = await feishu.createOcrDraft({ user_id: userId, nickname, file });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '上传到飞书失败。' },
      { status: 500 }
    );
  }
}
