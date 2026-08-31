import { readConfig, githubRequest, getJsDelivrUrl, getGitHubRawUrl } from '@/lib/github';
import { getFolders as getFoldersFromDB, insertFile } from '@/lib/db';
import { MediaFile, MAX_FILE_SIZE, sanitizeFilename, getStorageFolder } from '@/types';
import fs from 'fs/promises';
import path from 'path';

export async function processUpload(file: File, folderId: string | null): Promise<MediaFile> {
  if (!file) throw new Error('No file provided');

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'bmp', 'tiff', 'ico', 'heic', 'heif'];
  const videoExts = ['mp4', 'mov', 'webm', 'avi', 'mkv', 'ogv'];
  const audioExts = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'opus'];
  const docExts = ['pdf', 'txt', 'md', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'json', 'xml', 'csv'];

  let mimeType = file.type;
  if (!mimeType || mimeType === 'application/octet-stream') {
    if (imageExts.includes(ext)) mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext === 'ico' ? 'x-icon' : ext === 'tiff' ? 'tiff' : ext === 'bmp' ? 'bmp' : ext === 'heic' ? 'heic' : ext === 'heif' ? 'heif' : ext}`;
    else if (videoExts.includes(ext)) mimeType = `video/${ext === 'mov' ? 'quicktime' : ext === 'mkv' ? 'x-matroska' : ext === 'avi' ? 'x-msvideo' : ext === 'ogv' ? 'ogg' : ext}`;
    else if (audioExts.includes(ext)) mimeType = `audio/${ext === 'm4a' ? 'mp4' : ext === 'ogg' ? 'ogg' : ext === 'flac' ? 'flac' : ext === 'aac' ? 'aac' : ext === 'opus' ? 'opus' : ext}`;
    else if (docExts.includes(ext)) {
      if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'txt') mimeType = 'text/plain';
      else if (ext === 'md') mimeType = 'text/markdown';
      else if (ext === 'doc') mimeType = 'application/msword';
      else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === 'xls') mimeType = 'application/vnd.ms-excel';
      else if (ext === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (ext === 'ppt') mimeType = 'application/vnd.ms-powerpoint';
      else if (ext === 'pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      else if (ext === 'zip') mimeType = 'application/zip';
      else if (ext === 'rar') mimeType = 'application/x-rar-compressed';
      else if (ext === '7z') mimeType = 'application/x-7z-compressed';
      else if (ext === 'json') mimeType = 'application/json';
      else if (ext === 'xml') mimeType = 'application/xml';
      else if (ext === 'csv') mimeType = 'text/csv';
    }
  }

  if (!mimeType) mimeType = 'application/octet-stream';

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  const config = await readConfig();
  const isGitHubConfigured = !!(config.username && config.repo && config.token);
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  let folderName = '';
  if (folderId) {
    const folders = await getFoldersFromDB();
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      folderName = sanitizeFilename(folder.name);
    }
  }

  const storageFolder = getStorageFolder(mimeType, file.name);
  const folderPrefix = config.folder ? `${sanitizeFilename(config.folder)}/` : '';
  const userFolderPrefix = folderName ? `${folderName}/` : '';
  const githubPath = `${folderPrefix}${userFolderPrefix}${storageFolder}/${sanitizeFilename(file.name)}`;

  const newFileId = crypto.randomUUID();
  let publicUrl: string;
  let storagePath = githubPath;
  let commitSha: string | undefined;

  if (isGitHubConfigured) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    let sha: string | undefined;
    try {
      const getResponse = await githubRequest(config, `/contents/${encodeURIComponent(githubPath)}`);
      if (getResponse.ok) {
        const data = await getResponse.json();
        sha = data.sha;
      }
    } catch {
      // File doesn't exist yet, proceed without sha
    }

    const response = await githubRequest(config, `/contents/${encodeURIComponent(githubPath)}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Upload ${file.name}`,
        content: base64,
        sha,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `GitHub upload failed (${response.status})`);
    }

    const uploadResult = await response.json();
    commitSha = typeof uploadResult.commit?.sha === 'string' ? uploadResult.commit.sha : undefined;
    publicUrl = file.size > 50 * 1024 * 1024
      ? getGitHubRawUrl(config.username, config.repo, githubPath)
      : getJsDelivrUrl(config.username, config.repo, githubPath, commitSha);
  } else {
    const uploadDir = path.join(process.cwd(), 'data', 'uploads');
    await fs.mkdir(path.join(uploadDir, storageFolder), { recursive: true });
    const localPath = path.join(uploadDir, storageFolder, sanitizeFilename(file.name));
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(localPath, buffer);
    publicUrl = `${origin}/api/uploads/${newFileId}`;
    storagePath = path.join(storageFolder, sanitizeFilename(file.name)).replace(/\\/g, '/');
  }

  const newFile: MediaFile = {
    id: newFileId,
    folder_id: folderId || null,
    filename: sanitizeFilename(file.name),
    storage_path: storagePath,
    public_url: publicUrl,
    mime_type: mimeType,
    size: file.size,
    created_at: new Date().toISOString(),
    commit_sha: commitSha,
  };

  await insertFile(newFile);
  return newFile;
}
