'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { MAX_FILE_SIZE } from '@/types';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, folderId?: string | null) => Promise<void>;
  folderId?: string | null;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function UploadDialog({ open, onOpenChange, onUpload, folderId }: UploadDialogProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setIsDragOver(false);
    }
  }, [open]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles: UploadingFile[] = Array.from(e.dataTransfer.files).map(file => ({
        file,
        progress: 0,
        status: 'pending' as const,
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: UploadingFile[] = Array.from(e.target.files).map(file => ({
        file,
        progress: 0,
        status: 'pending' as const,
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'uploading' as const } : f));

    const pendingFiles = files.filter(f => f.status === 'pending');
    for (let i = 0; i < pendingFiles.length; i++) {
      const uploadingFile = pendingFiles[i];
      const index = files.indexOf(uploadingFile);
      try {
        await onUpload(uploadingFile.file, folderId);
        setFiles(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = { ...updated[index], progress: 100, status: 'success' };
          }
          return updated;
        });
      } catch (error) {
        setFiles(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              status: 'error',
              error: error instanceof Error ? error.message : 'Upload failed',
            };
          }
          return updated;
        });
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFiles([]);
      setIsDragOver(false);
    }
    onOpenChange(newOpen);
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const hasAnyFile = files.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload any file type to your media library. Images, video, and audio can be previewed; other files are shared as downloads.
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
            isDragOver && 'border-primary bg-primary/5'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isDragOver
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Max file size: 500MB
          </p>
        </div>
        {hasAnyFile && (
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{file.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="mt-1" />
                  )}
                  {file.status === 'error' && (
                    <p className="mt-1 text-xs text-red-500">{file.error}</p>
                  )}
                  {file.status === 'success' && (
                    <p className="mt-1 text-xs text-green-600">Uploaded</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {file.status === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {file.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {hasAnyFile && pendingCount > 0 && (
          <Button className="w-full" onClick={handleUploadAll}>
            Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
