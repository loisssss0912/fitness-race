import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { message: '缺少 BLOB_READ_WRITE_TOKEN，请先在 Vercel Storage 创建 Blob，并把 token 配到 .env.local 或 Vercel 环境变量。' },
      { status: 400 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
        tokenPayload: JSON.stringify({ scope: 'workout-screenshot' })
      }),
      onUploadCompleted: async () => {
        // OCR and Feishu writes happen only after user confirmation.
      }
    });

    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Blob upload failed' }, { status: 400 });
  }
}
