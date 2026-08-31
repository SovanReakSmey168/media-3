import { sanitizeFilename } from '@/types';

const CONFIG_PATH = './data/config.json';
const DEFAULT_BRANCH = process.env.GITHUB_DEFAULT_BRANCH || 'main';
const GITHUB_DB_PATH = 'data/db.json';

type MediaDb = {
  folders: import('@/types').Folder[];
  files: import('@/types').MediaFile[];
};

export interface GitHubConfig {
  username: string;
  repo: string;
  token: string;
  folder?: string;
}

export async function readConfig(): Promise<GitHubConfig> {
  const envConfig = getEnvConfig();
  if (envConfig) {
    return envConfig;
  }

  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const configPath = path.join(process.cwd(), CONFIG_PATH);
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { username: '', repo: '', token: '', folder: '' };
  }
}

export function getEnvConfig(): GitHubConfig | null {
  const username = process.env.GITHUB_USERNAME;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const folder = process.env.GITHUB_FOLDER;

  if (username && repo && token && token !== 'ghp_xxxx' && token !== 'github_pat_xxxx') {
    return { username, repo, token, folder: folder ? sanitizeFilename(folder) : '' };
  }

  return null;
}

export async function writeConfig(config: GitHubConfig): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const configPath = path.join(process.cwd(), CONFIG_PATH);
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function getJsDelivrUrl(username: string, repo: string, filePath: string, commitSha?: string): string {
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const ref = commitSha ? `@${commitSha}` : '@latest';
  return `https://cdn.jsdelivr.net/gh/${username}/${repo}${ref}/${encodedPath}`;
}

export function getGitHubRawUrl(username: string, repo: string, filePath: string, branch = DEFAULT_BRANCH): string {
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${encodedPath}`;
}

export async function githubRequest(config: GitHubConfig, path: string, options: RequestInit = {}): Promise<Response> {
  const url = `https://api.github.com/repos/${config.username}/${config.repo}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

function emptyDb(): MediaDb {
  return { folders: [], files: [] };
}

function validateDb(value: unknown): MediaDb {
  if (!value || typeof value !== 'object') throw new Error('The GitHub media database is invalid.');
  const db = value as Partial<MediaDb>;
  if (!Array.isArray(db.folders) || !Array.isArray(db.files)) {
    throw new Error('The GitHub media database is invalid.');
  }
  return { folders: db.folders, files: db.files };
}

async function getDbWithSha(config: GitHubConfig): Promise<{ db: MediaDb; sha?: string }> {
  const response = await githubRequest(config, `/contents/${encodeURIComponent(GITHUB_DB_PATH)}`);
  if (response.status === 404) return { db: emptyDb() };
  if (!response.ok) {
    console.error(`GitHub DB read failed (${response.status}): falling back to local mode`);
    return { db: emptyDb() };
  }

  const data = await response.json();
  if (!data.content || data.encoding !== 'base64' || !data.sha) {
    throw new Error('GitHub returned an invalid media database response.');
  }
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { db: validateDb(JSON.parse(content)), sha: data.sha };
}

export async function readDbFromGitHub(config: GitHubConfig): Promise<MediaDb> {
  return (await getDbWithSha(config)).db;
}

export async function mutateDbInGitHub<T>(config: GitHubConfig, mutate: (db: MediaDb) => T): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const { db, sha } = await getDbWithSha(config);
      const result = mutate(db);
      const content = Buffer.from(JSON.stringify(db, null, 2), 'utf-8').toString('base64');
      const response = await githubRequest(config, `/contents/${encodeURIComponent(GITHUB_DB_PATH)}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: 'Update database',
          content,
          sha,
        }),
      });

      if (response.ok) return result;
      if (response.status === 409) continue;

      const error = await response.json().catch(() => ({}));
      console.error('GitHub DB write failed:', error.message || response.status);
      return result;
    } catch (error) {
      console.error('GitHub DB mutation failed:', error);
      throw error;
    }
  }

  throw new Error('GitHub DB mutation failed after multiple attempts');
}

export async function writeDbToGitHub(config: GitHubConfig, db: MediaDb): Promise<void> {
  await mutateDbInGitHub(config, (current) => {
    current.folders = db.folders;
    current.files = db.files;
  });
}
