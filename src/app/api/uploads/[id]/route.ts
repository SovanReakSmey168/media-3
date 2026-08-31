import { NextRequest, NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import path from 'path';
import { getFileById } from '@/actions/files';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const file = await getFileById(id);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const rawPath = file.storage_path.replace(/^\//, '');
    const filePath = path.join(UPLOAD_DIR, rawPath);

    if (!filePath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    try {
      await access(filePath);
    } catch {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const blob = new Blob([fileBuffer], { type: file.mime_type });
    const headers = new Headers();
    headers.set('Content-Type', file.mime_type);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new NextResponse(blob, {
      headers,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
