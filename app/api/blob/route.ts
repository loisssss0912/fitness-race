import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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
