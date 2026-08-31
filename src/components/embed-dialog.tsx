'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, X } from 'lucide-react';
import { generateEmbedCode, generateMarkdown, generateBBCode } from '@/types';

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicUrl: string;
  filename: string;
  mimeType: string;
  fileId: string;
}

export function EmbedDialog({ open, onOpenChange, publicUrl, filename, mimeType, fileId }: EmbedDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const type = publicUrl ? (mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : mimeType.startsWith('audio/') ? 'audio' : 'other') : 'other';
  const sharePageUrl = origin && fileId ? `${origin}/share/${fileId}` : '';

  const embedHtml = generateEmbedCode(type, publicUrl, filename, mimeType);
  const markdown = generateMarkdown(publicUrl, filename, type);
  const bbcode = generateBBCode(publicUrl, filename);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setCopyError('');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopyError('Copy failed. Select the text and copy it manually.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Embed & Share</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="space-y-4 pr-8">
          {copyError && <p className="text-sm text-red-600">{copyError}</p>}

          <div>
            <label className="text-sm font-medium mb-2 block">Copy File Address</label>
            <div className="flex gap-2">
              <input readOnly value={publicUrl} className="flex-1 text-xs bg-muted p-2 rounded border" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(publicUrl, 'address')}>
                {copied === 'address' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Share Page (best for Telegram and social previews)</label>
            <div className="flex gap-2">
              <input readOnly value={sharePageUrl} className="flex-1 text-xs bg-muted p-2 rounded border" />
              <Button variant="outline" size="icon" disabled={!sharePageUrl} onClick={() => copyToClipboard(sharePageUrl, 'share')}>
                {copied === 'share' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Direct URL</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={publicUrl}
                className="flex-1 text-xs bg-muted p-2 rounded border"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(publicUrl, 'url')}
              >
                {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">HTML Embed</label>
            <div className="flex gap-2">
              <textarea
                readOnly
                value={embedHtml}
                className="flex-1 text-xs bg-muted p-2 rounded border font-mono h-20"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(embedHtml, 'html')}
              >
                {copied === 'html' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Markdown</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={markdown}
                className="flex-1 text-xs bg-muted p-2 rounded border font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(markdown, 'md')}
              >
                {copied === 'md' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">BBCode</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={bbcode}
                className="flex-1 text-xs bg-muted p-2 rounded border font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(bbcode, 'bb')}
              >
                {copied === 'bb' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
