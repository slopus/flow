import Fuse from 'fuse.js';
import { AsyncLock } from '@slopus/helpers';
import { ripgrep } from '@slopus/ripgrep';

export interface FileItem {
    fileName: string;
    filePath: string;
    fullPath: string;
    fileType: 'file' | 'folder';
}

interface SearchOptions {
    limit?: number;
    threshold?: number;
}

class FileSearchCache {
    private files: FileItem[] = [];
    private fuse: Fuse<FileItem> | null = null;
    private lastRefresh: number = 0;
    private refreshLock = new AsyncLock();
    private cacheTimeout = 5 * 60 * 1000; // 5 minutes

    private initializeFuse() {
        if (this.files.length === 0) {
            this.fuse = null;
            return;
        }

        const fuseOptions = {
            keys: [
                { name: 'fileName', weight: 0.7 },
                { name: 'fullPath', weight: 0.3 }
            ],
            threshold: 0.3,
            includeScore: true,
            shouldSort: true,
            minMatchCharLength: 1,
            ignoreLocation: true,
            useExtendedSearch: true,
            distance: 100
        };

        this.fuse = new Fuse(this.files, fuseOptions);
    }

    private async ensureCacheValid(): Promise<void> {
        const now = Date.now();

        // Check if cache needs refresh
        if (now - this.lastRefresh <= this.cacheTimeout && this.files.length > 0) {
            return;
        }

        // Use lock to prevent concurrent refreshes
        await this.refreshLock.inLock(async () => {
            // Double-check after acquiring lock
            const currentTime = Date.now();
            if (currentTime - this.lastRefresh < 1000) {
                return;
            }

            // Use ripgrep to get all files
            const result = await ripgrep(['--files', '--follow'], {
                cwd: process.cwd()
            });

            if (result.exitCode !== 0) {
                console.error('FileSearchCache: ripgrep failed');
                return;
            }

            const stdout = result.stdout;

            // Parse the output into file items
            const filePaths = stdout
                .split('\n')
                .filter(path => path.trim().length > 0);

            // Clear existing files
            this.files = [];

            // Add all files
            filePaths.forEach(path => {
                const parts = path.split('/');
                const fileName = parts[parts.length - 1] || path;
                const filePath = parts.slice(0, -1).join('/') || '';

                this.files.push({
                    fileName,
                    filePath: filePath ? filePath + '/' : '',
                    fullPath: path,
                    fileType: 'file' as const
                });
            });

            // Add unique directories with trailing slash
            const directories = new Set<string>();
            filePaths.forEach(path => {
                const parts = path.split('/');
                for (let i = 1; i <= parts.length - 1; i++) {
                    const dirPath = parts.slice(0, i).join('/');
                    if (dirPath) {
                        directories.add(dirPath);
                    }
                }
            });

            directories.forEach(dirPath => {
                const parts = dirPath.split('/');
                const dirName = parts[parts.length - 1] + '/';
                const parentPath = parts.slice(0, -1).join('/');

                this.files.push({
                    fileName: dirName,
                    filePath: parentPath ? parentPath + '/' : '',
                    fullPath: dirPath + '/',
                    fileType: 'folder'
                });
            });

            this.lastRefresh = Date.now();
            this.initializeFuse();
        });
    }

    async search(query: string, options: SearchOptions = {}): Promise<FileItem[]> {
        await this.ensureCacheValid();

        if (!this.fuse || this.files.length === 0) {
            return [];
        }

        const { limit = 10 } = options;

        // If query is empty, return first files
        if (!query || query.trim().length === 0) {
            return this.files.slice(0, limit);
        }

        // Perform fuzzy search
        const results = this.fuse.search(query, { limit });
        return results.map(result => result.item);
    }
}

// Export singleton instance
export const fileSearchCache = new FileSearchCache();

// Main export: search files with fuzzy matching
export async function searchFiles(
    query: string,
    options: SearchOptions = {}
): Promise<FileItem[]> {
    return fileSearchCache.search(query, options);
}
