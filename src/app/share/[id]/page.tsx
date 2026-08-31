import { getFileById } from '@/actions/files';
import { MediaFile } from '@/types';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShareCopyClient } from '@/components/share-copy-client';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  const file = await getFileById(id);

  if (!file) {
    return { title: 'File Not Found' };
  }

  const title = file.filename;
  const description = `View ${file.filename} on Media Manager`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: file.public_url,
          width: 1200,
          height: 630,
          alt: file.filename,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [file.public_url],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const file = await getFileById(id);

  if (!file) {
    notFound();
  }

  const category = file.mime_type.startsWith('image/') ? 'image' :
                   file.mime_type.startsWith('video/') ? 'video' :
                   file.mime_type.startsWith('audio/') ? 'audio' : 'other';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{file.filename}</h1>
          <p className="text-muted-foreground">
            {file.mime_type} • {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
          </p>
        </div>

        <div className="flex justify-center bg-muted rounded-lg overflow-hidden">
          {category === 'image' && (
            <img
              src={file.public_url}
              alt={file.filename}
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />
          )}
          {category === 'video' && (
            <video controls className="max-h-[70vh] max-w-full rounded-lg">
              <source src={file.public_url} />
            </video>
          )}
          {category === 'audio' && (
            <div className="w-full max-w-2xl p-8">
              <audio controls className="w-full">
                <source src={file.public_url} />
              </audio>
            </div>
          )}
          {(category === 'other') && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
              <a
                href={file.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Download File
              </a>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Share this link:</p>
          <ShareCopyClient sharePath={`/share/${id}`} />
        </div>
      </div>
    </div>
  );
}
