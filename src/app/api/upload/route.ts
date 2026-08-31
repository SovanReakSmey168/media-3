import { NextRequest, NextResponse } from 'next/server';
import { isValidSessionToken } from '@/lib/session';
import { processUpload } from '@/lib/upload-core';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  const authenticated = await isValidSessionToken(token);
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderId = formData.get('folderId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await processUpload(file, folderId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
