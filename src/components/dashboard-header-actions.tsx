'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Upload, Search, ChevronDown, Menu } from 'lucide-react';
import { UploadDialog } from '@/components/upload-dialog';

interface DashboardHeaderActionsProps {
  view: string;
  searchQuery: string;
  folderId?: string;
}

export function DashboardHeaderActions({ view, searchQuery, folderId }: DashboardHeaderActionsProps) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => window.dispatchEvent(new Event('open-mobile-sidebar'))}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {searchOpen ? (
          <div className="flex items-center gap-2">
             <Input
              placeholder="Search files..."
              defaultValue={searchQuery || ''}
              className="w-48 md:w-64"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value;
                  router.push(`/dashboard?search=${encodeURIComponent(value)}`);
                  setSearchOpen(false);
                }
                if (e.key === 'Escape') {
                  setSearchOpen(false);
                }
              }}
            />
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
        )}

        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUpload={async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            if (folderId) {
              formData.append('folderId', folderId);
            }
            try {
              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include',
              });

              const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));

              if (!response.ok) {
                throw new Error(data.error || `Upload failed (${response.status})`);
              }

              router.refresh();
            } catch (err) {
              console.error('Upload failed:', err);
              alert(err instanceof Error ? err.message : 'Upload failed');
            }
          }}
          folderId={folderId}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="hidden md:flex">
              <Upload className="h-4 w-4 mr-2" />
              Upload
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          className="md:hidden"
          size="icon"
          onClick={() => setUploadOpen(true)}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
