import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { message: '缺少 BLOB_READ_WRITE_TOKEN，请先在 Vercel Storage 创建 Blob，并配置到 Vercel 环境变量。' },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ message: '没有收到图片文件。' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ message: '只能上传图片文件。' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^\w.-]+/g, '-').toLowerCase();
  const blob = await put(`screenshots/${Date.now()}-${safeName}`, file, {
    access: 'public',
    contentType: file.type
  });

  return NextResponse.json({ url: blob.url });
}
