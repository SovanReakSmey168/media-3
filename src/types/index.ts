export interface MediaFile {
  id: string;
  folder_id: string | null;
  filename: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  size: number;
  created_at: string;
  commit_sha?: string;
}

export interface Folder {
  id: string;
  name: string;
  created_at: string;
}

export interface GitHubConfig {
  username: string;
  repo: string;
  token: string;
  folder?: string;
}

export const FILE_TYPE_IMAGES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/x-icon',
  'image/heic',
  'image/heif',
] as const;
export const FILE_TYPE_VIDEOS = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  'video/x-matroska',
  'video/ogg',
] as const;
export const FILE_TYPE_AUDIO = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/opus',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'bmp', 'tiff', 'ico', 'heic', 'heif'];
export const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'avi', 'mkv', 'ogv'];
export const ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'opus'];
export const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'txt', 'md', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'json', 'xml', 'csv'];

// jsDelivr's GitHub CDN support is limited to 50 MB per file.
// Larger files fall back to raw.githubusercontent.com.
export const MAX_FILE_SIZE = 500 * 1024 * 1024;

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

export function isAudio(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

export function getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (isImage(mimeType)) return 'image';
  if (isVideo(mimeType)) return 'video';
  if (isAudio(mimeType)) return 'audio';
  const docMimes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/json',
    'application/xml',
    'text/csv',
  ];
  if (docMimes.includes(mimeType)) return 'document';
  return 'other';
}

export function getStorageFolder(mimeType: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (isImage(mimeType) || ALLOWED_IMAGE_EXTENSIONS.includes(ext)) return 'images';
  if (isVideo(mimeType) || ALLOWED_VIDEO_EXTENSIONS.includes(ext)) return 'videos';
  if (isAudio(mimeType) || ALLOWED_AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  if (ALLOWED_DOCUMENT_EXTENSIONS.includes(ext) || mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'documents';
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

export function generateEmbedCode(
  type: 'image' | 'video' | 'audio' | 'document' | 'other',
  publicUrl: string,
  filename?: string,
  mimeType?: string,
): string {
  const escapeAttribute = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const displayName = filename ? `Download ${filename}` : 'Download File';
  const escapedName = escapeAttribute(displayName);
  const sourceType = mimeType ? ` type="${escapeAttribute(mimeType)}"` : '';
  switch (type) {
    case 'image':
      return `<img src="${publicUrl}" alt="${escapedName}" loading="lazy" style="max-width: 100%; height: auto;" />`;
    case 'video':
      return `<video controls preload="metadata" style="max-width: 100%; height: auto;"><source src="${publicUrl}"${sourceType} />Your browser does not support video playback.</video>`;
    case 'audio':
      return `<audio controls preload="metadata"><source src="${publicUrl}"${sourceType} />Your browser does not support audio playback.</audio>`;
    case 'document':
    case 'other':
    default:
      return `<a href="${publicUrl}" target="_blank" rel="noopener noreferrer" download="${escapedName}">${escapedName}</a>`;
  }
}

export function generateMarkdown(publicUrl: string, filename?: string, type?: 'image' | 'video' | 'audio' | 'document' | 'other'): string {
  if (!filename) return publicUrl;
  return type === 'image' ? `![${filename}](${publicUrl})` : `[${filename}](${publicUrl})`;
}

export function generateBBCode(publicUrl: string, filename?: string): string {
  const displayName = filename || 'File';
  return `[url=${publicUrl}]${displayName}[/url]`;
}
