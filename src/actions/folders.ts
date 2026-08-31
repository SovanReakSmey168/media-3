'use server';

import { revalidatePath } from 'next/cache';
import {
  getFolders as getFoldersFromDB,
  createFolder as createFolderInDB,
  renameFolder as renameFolderInDB,
  deleteFolder as deleteFolderFromDB,
} from '@/lib/db';
import { readConfig, githubRequest } from '@/lib/github';
import { sanitizeFilename } from '@/types';
import { requireAuth } from '@/actions/auth';

export async function getFolders() {
  await requireAuth();
  return getFoldersFromDB();
}

export async function createFolder(name: string) {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Folder name is required');

  const config = await readConfig();
  const sanitizedFolderName = sanitizeFilename(trimmed);
  const folderPath = config.folder ? `${sanitizeFilename(config.folder)}/${sanitizedFolderName}` : sanitizedFolderName;

  if (config.username && config.repo && config.token) {
    try {
      const gitkeepPath = `${folderPath}/.gitkeep`;
      const existing = await githubRequest(config, `/contents/${encodeURIComponent(gitkeepPath)}`);
      if (!existing.ok) {
        const response = await githubRequest(config, `/contents/${encodeURIComponent(gitkeepPath)}`, {
          method: 'PUT',
          body: JSON.stringify({
            message: `Create folder ${trimmed}`,
            content: btoa(''),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('GitHub folder creation failed:', error.message || response.status);
        }
      }
    } catch (error) {
      console.error('GitHub folder creation failed:', error);
    }
  }

  const folders = await getFoldersFromDB();
  const exists = folders.some(f => f.name.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    await createFolderInDB(trimmed);
  }

  revalidatePath('/dashboard');
}

export async function renameFolder(id: string, name: string) {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Folder name is required');

  const folder = await renameFolderInDB(id, trimmed);
  revalidatePath('/dashboard');
  return folder;
}

export async function deleteFolder(id: string) {
  await requireAuth();
  const config = await readConfig();
  const folders = await getFoldersFromDB();
  const folder = folders.find(f => f.id === id);

  if (folder && config.username && config.repo && config.token) {
    const folderPath = config.folder ? `${sanitizeFilename(config.folder)}/${sanitizeFilename(folder.name)}` : sanitizeFilename(folder.name);
    try {
      const response = await githubRequest(config, `/contents/${encodeURIComponent(folderPath + '/.gitkeep')}`, {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        await githubRequest(config, `/contents/${encodeURIComponent(folderPath + '/.gitkeep')}`, {
          method: 'DELETE',
          body: JSON.stringify({
            message: `Delete folder ${folder.name}`,
            sha: data.sha,
          }),
        });
      }
    } catch (error) {
      console.error('GitHub folder delete failed:', error);
    }
  }

  await deleteFolderFromDB(id);
  revalidatePath('/dashboard');
}
