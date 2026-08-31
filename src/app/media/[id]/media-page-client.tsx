'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import { EmbedDialog } from '@/components/embed-dialog';
import { formatFileSize, getFileCategory } from '@/types';
import { MediaFile } from '@/types';

export function MediaPageClient({ file }: { file: MediaFile }) {
  const [shareOpen, setShareOpen] = useState(false);
  const category = getFileCategory(file.mime_type);
  const isLocal = !file.public_url.includes('cdn.jsdelivr.net') && !file.public_url.includes('raw.githubusercontent.com');
  const displayUrl = isLocal ? `/api/uploads/${file.id}` : file.public_url;

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{file.filename}</h1>
              <p className="text-muted-foreground mt-1">
                {formatFileSize(file.size)} • {file.mime_type}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShareOpen(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={() => window.open(displayUrl, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            {category === 'image' && (
              <Image
                src={displayUrl}
                alt={file.filename}
                width={800}
                height={600}
                className="max-h-[70vh] max-w-full object-contain rounded-lg"
              />
            )}
            {category === 'video' && (
              <video controls className="max-h-[70vh] max-w-full rounded-lg">
                <source src={displayUrl} />
              </video>
            )}
            {category === 'audio' && (
              <div className="w-full max-w-2xl">
                <audio controls className="w-full">
                  <source src={displayUrl} />
                </audio>
              </div>
            )}
            {(category === 'document' || category === 'other') && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                <Button onClick={() => window.open(displayUrl, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <EmbedDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        publicUrl={displayUrl}
        filename={file.filename}
        mimeType={file.mime_type}
        fileId={file.id}
      />
    </div>
  );
}
