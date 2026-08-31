import { getFiles, searchFiles } from '@/actions/files';
import { MediaFile } from '@/types';
import { MediaGridClient } from './media-grid-client';
import { DashboardHeaderActions } from '@/components/dashboard-header-actions';
import { FolderSidebar } from '@/components/folder-sidebar';
import { getFolders, getStorageStats } from '@/lib/db';

export const dynamic = 'auto';
export const revalidate = 30;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; search?: string; folder?: string }>;
}) {
  const params = await searchParams;
  const view = params.view || 'grid';
  const searchQuery = params.search || '';
  const folderId = params.folder;

  const [files, folders, stats] = await Promise.all([
    searchQuery ? searchFiles(searchQuery) : getFiles(folderId),
    getFolders(),
    getStorageStats(),
  ]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <FolderSidebar folders={folders} stats={stats} currentFolder={folderId} />
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 md:p-8 pb-0 md:pb-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {searchQuery ? `Search: "${searchQuery}"` : folderId ? 'Folder' : 'All Files'}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                {files.length} file{files.length !== 1 ? 's' : ''}
              </p>
            </div>
            <DashboardHeaderActions view={view} searchQuery={searchQuery} folderId={folderId} />
          </div>
        </div>
        <div className="flex-1 overflow-auto px-4 md:px-8 pb-4 md:pb-8">
          <MediaGridClient files={files} view={view as 'grid' | 'list'} />
        </div>
      </div>
    </div>
  );
}
