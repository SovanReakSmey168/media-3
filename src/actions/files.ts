'use server';

import { revalidatePath } from 'next/cache';
import {
  MediaFile,
  sanitizeFilename,
} from '@/types';
import {
  getFiles as getFilesFromDB,
  getFileById as getFileByIdFromDB,
  getFolders as getFoldersFromDB,
  insertFile,
  deleteFileRecord,
  updateFile,
  searchFiles as searchFilesFromDB,
  getUploadDir,
  ensureUploadDir,
} from '@/lib/db';
import { readConfig, githubRequest, getJsDelivrUrl, getGitHubRawUrl } from '@/lib/github';
import { requireAuth } from '@/actions/auth';
import { processUpload } from '@/lib/upload-core';
import fs from 'fs/promises';
import path from 'path';

export async function getFiles(folderId?: string) {
  await requireAuth();
  return getFilesFromDB(folderId);
}

export async function getFileById(id: string) {
  await requireAuth();
  const file = await getFileByIdFromDB(id);
  if (!file) throw new Error('File not found');
  return file;
}

export async function uploadFile(formData: FormData) {
  await requireAuth();
  const file = formData.get('file') as File;
  const folderId = formData.get('folderId') as string | null;

  const result = await processUpload(file, folderId);
  revalidatePath('/dashboard');
  revalidatePath('/share');
  return result;
}

export async function deleteFile(id: string) {
  await requireAuth();
  const file = await getFileByIdFromDB(id);
  if (!file) throw new Error('File not found');

  const config = await readConfig();
  const isGitHubConfigured = !!(config.username && config.repo && config.token);

  if (isGitHubConfigured) {
    try {
      const response = await githubRequest(config, `/contents/${encodeURIComponent(file.storage_path)}`, {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        const deleteResponse = await githubRequest(config, `/contents/${encodeURIComponent(file.storage_path)}`, {
          method: 'DELETE',
          body: JSON.stringify({
            message: `Delete ${file.filename}`,
            sha: data.sha,
          }),
        });
        if (!deleteResponse.ok) {
          const error = await deleteResponse.json();
          throw new Error(error.message || `GitHub delete failed (${deleteResponse.status})`);
        }
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete file from GitHub');
    }
  } else {
    try {
      const localPath = path.join(getUploadDir(), file.storage_path);
      await fs.unlink(localPath);
    } catch (error) {
      console.warn('Local file delete failed:', error);
    }
  }

  await deleteFileRecord(id);
  revalidatePath('/dashboard');
}

export async function renameFile(id: string, filename: string) {
  await requireAuth();
  const file = await getFileByIdFromDB(id);
  if (!file) throw new Error('File not found');

  const sanitized = sanitizeFilename(filename);
  if (sanitized === file.filename) {
    return file;
  }

  const config = await readConfig();
  const isGitHubConfigured = !!(config.username && config.repo && config.token);

  if (isGitHubConfigured) {
    const oldPath = file.storage_path;
    const folderPrefix = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
    const newPath = `${folderPrefix}${sanitized}`;

    const getResponse = await githubRequest(config, `/contents/${encodeURIComponent(oldPath)}`);
    if (!getResponse.ok) {
      throw new Error('File not found on GitHub');
    }
    const existing = await getResponse.json();
    if (!existing.content || existing.encoding !== 'base64') {
      throw new Error('GitHub did not return file content for rename');
    }

    const putResponse = await githubRequest(config, `/contents/${encodeURIComponent(newPath)}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Rename ${file.filename} to ${sanitized}`,
        content: existing.content.replace(/\s/g, ''),
      }),
    });

    if (!putResponse.ok) {
      const error = await putResponse.json();
      throw new Error(error.message || `GitHub rename failed (${putResponse.status})`);
    }

    const renameResult = await putResponse.json();
    const commitSha = typeof renameResult.commit?.sha === 'string' ? renameResult.commit.sha : undefined;
    const newPublicUrl = file.size > 50 * 1024 * 1024
      ? getGitHubRawUrl(config.username, config.repo, newPath)
      : getJsDelivrUrl(config.username, config.repo, newPath, commitSha);

    const updated = await updateFile(id, {
      filename: sanitized,
      storage_path: newPath,
      public_url: newPublicUrl,
      commit_sha: commitSha,
    });

    try {
      await githubRequest(config, `/contents/${encodeURIComponent(oldPath)}`, {
        method: 'DELETE',
        body: JSON.stringify({
          message: `Remove old file after rename`,
          sha: existing.sha,
        }),
      });
    } catch {
      // Old file cleanup is best-effort
    }

    revalidatePath('/dashboard');
    return updated;
  } else {
    const oldStoragePath = file.storage_path;
    const folderPrefix = oldStoragePath.substring(0, oldStoragePath.lastIndexOf('/') + 1);
    const newStoragePath = `${folderPrefix}${sanitized}`;

    try {
      const oldFullPath = path.join(getUploadDir(), oldStoragePath);
      const newFullPath = path.join(getUploadDir(), newStoragePath);
      await fs.rename(oldFullPath, newFullPath);
    } catch (error) {
      console.warn('Local file rename failed:', error);
    }

    const updated = await updateFile(id, {
      filename: sanitized,
      storage_path: newStoragePath,
      public_url: file.public_url,
    });

    revalidatePath('/dashboard');
    return updated;
  }
}

export async function searchFiles(query: string) {
  await requireAuth();
  if (!query || query.trim().length > 100) {
    return [];
  }
  return searchFilesFromDB(query.trim());
}
