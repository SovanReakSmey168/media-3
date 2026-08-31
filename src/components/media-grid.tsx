'use client';

import { useState } from 'react';
import { MediaFile } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileImage, FileVideo, FileAudio, MoreVertical, Trash2, Pencil, Copy, Link } from 'lucide-react';
import { formatFileSize, getFileCategory } from '@/types';

interface MediaGridProps {
  files: MediaFile[];
  view: 'grid' | 'list';
  onFileClick: (file: MediaFile) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, filename: string) => void;
  onShare: (file: MediaFile) => void;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const category = getFileCategory(mimeType);
  const iconMap = {
    image: <FileImage className="h-8 w-8 text-blue-500" />,
    video: <FileVideo className="h-8 w-8 text-purple-500" />,
    audio: <FileAudio className="h-8 w-8 text-green-500" />,
    document: <FileImage className="h-8 w-8 text-orange-500" />,
    other: <FileImage className="h-8 w-8 text-gray-500" />,
  };
  return iconMap[category] || iconMap.other;
}

function getFileUrl(file: MediaFile): string {
  const isGitHubUrl = file.public_url.includes('cdn.jsdelivr.net') || file.public_url.includes('raw.githubusercontent.com');
  if (isGitHubUrl) return file.public_url;
  return `/api/uploads/${file.id}`;
}

export function MediaGrid({
  files,
  view,
  onFileClick,
  onDelete,
  onRename,
  onShare,
}: MediaGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleRename = (file: MediaFile) => {
    if (editName.trim() && editName !== file.filename) {
      onRename(file.id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileImage className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground mb-1">No files yet</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Upload files to get started. Drag and drop or click the Upload button.
        </p>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="space-y-1">
        {files.map(file => (
          <Card
            key={file.id}
            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer hover:bg-muted/50 active:bg-muted/80 transition-colors"
            onClick={() => onFileClick(file)}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <FileIcon mimeType={file.mime_type} />
            </div>
            <div className="flex-1 min-w-0">
              {editingId === file.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRename(file)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(file)}
                  className="text-sm font-medium w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm font-medium truncate">{file.filename}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} • {file.mime_type}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(file);
                  }}
                >
                  <Link className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(file.id);
                    setEditName(file.filename);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(file.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {files.map(file => (
        <Card
          key={file.id}
          className="overflow-hidden cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all duration-200 group"
          onClick={() => onFileClick(file)}
        >
          <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
             {getFileCategory(file.mime_type) === 'image' ? (
               <img
                 src={getFileUrl(file)}
                 alt={file.filename}
                 className="w-full h-full object-cover"
                 loading="lazy"
               />
             ) : (
               <FileIcon mimeType={file.mime_type} />
             )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
               <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="secondary" size="icon" className="h-8 w-8 md:h-9 md:w-9 bg-white/20 hover:bg-white/30 text-white border-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(file); }}>
                      <Link className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingId(file.id); setEditName(file.filename); }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} className="text-red-500">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
          <div className="p-3">
            {editingId === file.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleRename(file)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(file)}
                className="text-sm font-medium w-full"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm font-medium truncate">{file.filename}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatFileSize(file.size)}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}