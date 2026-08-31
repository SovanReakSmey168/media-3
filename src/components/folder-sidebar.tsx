'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Folder, Plus, Trash2, LogOut, ImageIcon, Video, Music, FileText, HardDrive, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createFolder, deleteFolder } from '@/actions/folders';
import { logout } from '@/actions/auth';
import { Folder as FolderType } from '@/types';
import { formatFileSize } from '@/types';

interface StorageStats {
  total: number;
  totalSize: number;
  images: { count: number; size: number };
  videos: { count: number; size: number };
  audio: { count: number; size: number };
  documents: { count: number; size: number };
  other: { count: number; size: number };
}

interface FolderSidebarProps {
  folders: FolderType[];
  stats: StorageStats;
  currentFolder?: string | null;
}

export function FolderSidebar({ folders, stats, currentFolder }: FolderSidebarProps) {
  const router = useRouter();
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [error, setError] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsMobileOpen(true);
    window.addEventListener('open-mobile-sidebar', handleOpen);
    return () => window.removeEventListener('open-mobile-sidebar', handleOpen);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || isCreatingFolder) return;
    setIsCreatingFolder(true);
    setError('');
    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this folder? Files will become unorganized.')) return;
    await deleteFolder(id);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base md:text-lg">Folders</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCreating(!isCreating)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-3 space-y-2">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name..."
            className="text-sm"
          />
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <div className="flex gap-1">
            <Button type="submit" size="sm" className="flex-1 h-7 text-xs" disabled={isCreatingFolder}>
              {isCreatingFolder ? 'Creating...' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setIsCreating(false);
                setNewFolderName('');
                setError('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-1 flex-1 overflow-y-auto scrollbar-hide">
        <Link
          href="/dashboard"
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            !currentFolder ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
          )}
        >
          <Folder className="h-4 w-4" />
          <span className="flex-1">All Files</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{stats.total}</span>
        </Link>

        {folders.map((folder) => (
          <div key={folder.id} className="group flex items-center">
            <Link
              href={`/dashboard?folder=${folder.id}`}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors flex-1',
                currentFolder === folder.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
              )}
            >
              <Folder className="h-4 w-4" />
              <span className="flex-1 truncate">{folder.name}</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-60 hover:opacity-100 transition-opacity"
              onClick={(e) => handleDelete(folder.id, e)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <HardDrive className="h-4 w-4" />
            Storage
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3 text-blue-500" />
                <span>Photos</span>
              </div>
              <span className="text-muted-foreground">
                {stats.images.count} ({formatFileSize(stats.images.size)})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Video className="h-3 w-3 text-purple-500" />
                <span>Videos</span>
              </div>
              <span className="text-muted-foreground">
                {stats.videos.count} ({formatFileSize(stats.videos.size)})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Music className="h-3 w-3 text-green-500" />
                <span>Audio</span>
              </div>
              <span className="text-muted-foreground">
                {stats.audio.count} ({formatFileSize(stats.audio.size)})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-orange-500" />
                <span>Documents</span>
              </div>
              <span className="text-muted-foreground">
                {stats.documents.count} ({formatFileSize(stats.documents.size)})
              </span>
            </div>
            <div className="pt-1.5 border-t flex items-center justify-between font-medium">
              <span>Total</span>
              <span>{formatFileSize(stats.totalSize)}</span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs"
          onClick={handleLogout}
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block w-64 border-r bg-muted/30 p-4">
        {sidebarContent}
      </div>

      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full bg-background border-r shadow-lg">
            {sidebarContent}
          </div>
          <div
            className="flex-1 bg-black/20"
            onClick={() => setIsMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
