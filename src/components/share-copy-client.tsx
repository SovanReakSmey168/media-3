'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ShareCopyClientProps {
  sharePath: string;
}

export function ShareCopyClient({ sharePath }: ShareCopyClientProps) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const sharePageUrl = `${origin}${sharePath}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sharePageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback could be added here
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <input readOnly value={sharePageUrl} className="flex-1 text-xs bg-muted p-2 rounded border" />
      <Button variant="outline" size="icon" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}
