import fs from 'fs/promises';
import path from 'path';
import { sanitizeFilename, MediaFile, Folder } from '@/types';
import { readConfig, readDbFromGitHub, writeDbToGitHub } from '@/lib/github';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

let cachedGitHubConfig: Awaited<ReturnType<typeof readConfig>> | null = null;

async function getGitHubConfig() {
  if (cachedGitHubConfig) return cachedGitHubConfig;
  const config = await readConfig();
  cachedGitHubConfig = !!(config.username && config.repo && config.token) ? config : null;
  return cachedGitHubConfig;
}

export interface DB {
  folders: Folder[];
  files: MediaFile[];
}

async function readDBInternal(): Promise<DB> {
  const githubConfig = await getGitHubConfig();
  if (githubConfig) {
    try {
      return await readDbFromGitHub(githubConfig);
    } catch (error) {
      console.error('Failed to read DB from GitHub, falling back to local:', error);
    }
  }

  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read local DB, returning empty:', error);
    return { folders: [], files: [] };
  }
}

export async function readDB(): Promise<DB> {
  return readDBInternal();
}

async function writeDBInternal(db: DB): Promise<void> {
  const githubConfig = await getGitHubConfig();
  if (githubConfig) {
    try {
      await writeDbToGitHub(githubConfig, db);
      return;
    } catch (error) {
      console.error('Failed to write DB to GitHub, falling back to local:', error);
    }
  }

  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write local DB:', error);
    throw error;
  }
}

export async function writeDB(db: DB): Promise<void> {
  return writeDBInternal(db);
}

export async function getFolders(): Promise<Folder[]> {
  const db = await readDB();
  return db.folders.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createFolder(name: string): Promise<Folder> {
  const db = await readDB();
  const folder: Folder = {
    id: crypto.randomUUID(),
    name,
    created_at: new Date().toISOString(),
  };
  db.folders.push(folder);
  await writeDB(db);
  return folder;
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  const db = await readDB();
  const folder = db.folders.find(f => f.id === id);
  if (!folder) throw new Error('Folder not found');
  folder.name = name;
  await writeDB(db);
  return folder;
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await readDB();
  db.folders = db.folders.filter(f => f.id !== id);
  db.files.forEach(f => {
    if (f.folder_id === id) f.folder_id = null;
  });
  await writeDB(db);
}

export async function getFiles(folderId?: string | null): Promise<MediaFile[]> {
  const db = await readDB();
  let files = db.files;
  if (folderId) {
    files = files.filter(f => f.folder_id === folderId);
  }
  return files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getFileCount(folderId?: string | null): Promise<number> {
  const db = await readDB();
  if (folderId) {
    return db.files.filter(f => f.folder_id === folderId).length;
  }
  return db.files.length;
}

export async function getStorageStats() {
  const db = await readDB();
  const stats = {
    total: db.files.length,
    totalSize: db.files.reduce((sum, f) => sum + f.size, 0),
    images: { count: 0, size: 0 },
    videos: { count: 0, size: 0 },
    audio: { count: 0, size: 0 },
    documents: { count: 0, size: 0 },
    other: { count: 0, size: 0 },
  };

  db.files.forEach(file => {
    const category = getFileCategory(file.mime_type);
    if (stats[category]) {
      stats[category].count++;
      stats[category].size += file.size;
    } else {
      stats.other.count++;
      stats.other.size += file.size;
    }
  });

  return stats;
}

function getFileCategory(mimeType: string): 'images' | 'videos' | 'audio' | 'documents' | 'other' {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (['application/pdf', 'text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/json', 'application/xml', 'text/csv'].includes(mimeType)) return 'documents';
  return 'other';
}

export async function getFileById(id: string): Promise<MediaFile | undefined> {
  const db = await readDB();
  return db.files.find(f => f.id === id);
}

export async function insertFile(file: MediaFile): Promise<MediaFile> {
  const db = await readDB();
  db.files.push(file);
  await writeDB(db);
  return file;
}

export async function deleteFileRecord(id: string): Promise<void> {
  const db = await readDB();
  db.files = db.files.filter(f => f.id !== id);
  await writeDB(db);
}

export async function updateFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile> {
  const db = await readDB();
  const file = db.files.find(f => f.id === id);
  if (!file) throw new Error('File not found');
  if (updates.filename) {
    updates.filename = sanitizeFilename(updates.filename);
  }
  Object.assign(file, updates);
  await writeDB(db);
  return file;
}

export async function searchFiles(query: string): Promise<MediaFile[]> {
  const db = await readDB();
  const lowerQuery = query.toLowerCase();
  return db.files
    .filter(f => f.filename.toLowerCase().includes(lowerQuery))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getUploadDir(): string {
  return UPLOAD_DIR;
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}
