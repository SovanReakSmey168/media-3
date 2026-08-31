'use client';

import { useState } from 'react';
import { PreviewModal } from '@/components/preview-modal';
import { EmbedDialog } from '@/components/embed-dialog';
import { MediaGrid } from '@/components/media-grid';
import { MediaFile } from '@/types';
import { deleteFile, renameFile } from '@/actions/files';
import { useRouter } from 'next/navigation';

export function MediaGridClient({
  files,
  view,
}: {
  files: MediaFile[];
  view: 'grid' | 'list';
}) {
  const router = useRouter();
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [shareFile, setShareFile] = useState<MediaFile | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    await deleteFile(id);
    router.refresh();
  };

  const handleRename = async (id: string, filename: string) => {
    await renameFile(id, filename);
    router.refresh();
  };

  return (
    <>
      <MediaGrid
        files={files}
        view={view}
        onFileClick={setPreviewFile}
        onDelete={handleDelete}
        onRename={handleRename}
        onShare={(file) => {
          setPreviewFile(null);
          setShareFile(file);
        }}
      />
      <PreviewModal
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
        onShare={() => {
          setPreviewFile(null);
          setShareFile(previewFile);
        }}
        onDownload={() => {
          if (previewFile) {
            const a = document.createElement('a');
            a.href = previewFile.public_url;
            a.download = previewFile.filename;
            a.click();
          }
        }}
      />
      <EmbedDialog
        open={!!shareFile}
        onOpenChange={(open) => !open && setShareFile(null)}
        publicUrl={shareFile?.public_url || ''}
        filename={shareFile?.filename || ''}
        mimeType={shareFile?.mime_type || ''}
        fileId={shareFile?.id || ''}
      />
    </>
  );
}
