import { getFileById } from '@/actions/files';
import { MediaPageClient } from './media-page-client';

export default async function MediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const file = await getFileById(id);

  if (!file) {
    return <div className="flex items-center justify-center h-full">File not found</div>;
  }

  return <MediaPageClient file={file} />;
}
