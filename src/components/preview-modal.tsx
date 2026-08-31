'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatFileSize, getFileCategory } from '@/types';
import { MediaFile } from '@/types';
import { Share2, Download, Copy, Check, X } from 'lucide-react';
import { EmbedDialog } from '@/components/embed-dialog';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: MediaFile | null;
  onShare?: () => void;
  onDownload?: () => void;
}

export function PreviewModal({ open, onOpenChange, file, onShare, onDownload }: PreviewModalProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const category = getFileCategory(file.mime_type);
  const isLocal = !file.public_url.includes('cdn.jsdelivr.net') && !file.public_url.includes('raw.githubusercontent.com');
  const displayUrl = isLocal ? `/api/uploads/${file.id}` : file.public_url;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{file.filename}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatFileSize(file.size)} • {file.mime_type}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopyUrl}>
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? 'Copied' : 'Copy URL'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { onOpenChange(false); onShare?.(); }}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button variant="ghost" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            <div className="flex justify-center bg-muted rounded-lg overflow-hidden">
              {category === 'image' && (
                <img
                  src={displayUrl}
                  alt={file.filename}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg"
                />
              )}
              {category === 'video' && (
                <video controls className="max-h-[60vh] max-w-full">
                  <source src={displayUrl} />
                </video>
              )}
              {category === 'audio' && (
                <div className="w-full max-w-2xl p-8">
                  <audio controls className="w-full">
                    <source src={displayUrl} />
                  </audio>
                </div>
              )}
              {(category === 'document' || category === 'other') && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Preview not available</p>
                  <Button onClick={onDownload}>Download File</Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EmbedDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        publicUrl={displayUrl}
        filename={file.filename}
        mimeType={file.mime_type}
        fileId={file.id}
      />
    </>
  );
}