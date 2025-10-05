import * as fs from 'fs';
import * as path from 'path';
import { createPatch, parsePatch } from 'diff';
import {
    textDetectLineEnding,
    textNormalizeLineEnding,
    textGetDefaultLineEnding,
    textDetectEncoding
} from '@slopus/helpers';

/**
 * Represents a hunk in a structured patch
 */
export interface PatchHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
}

/**
 * Represents the state of a read file
 */
interface ReadFileState {
    content: string;
    timestamp: number;
}

/**
 * Result of a write operation
 */
export interface WriteResult {
    type: 'create' | 'update';
    filePath: string;
    content: string;
    structuredPatch: PatchHunk[];
}

/**
 * Result of a read operation
 */
export interface ReadResult {
    content: string;
    encoding: BufferEncoding;
    lineEnding: 'CRLF' | 'LF';
}

/**
 * Manages file operations with read-before-write enforcement and modification detection.
 *
 * Features:
 * - Read-before-write enforcement: prevents accidental overwrites
 * - Modification detection: detects external file changes using mtime
 * - Encoding preservation: maintains original file encoding
 * - Line ending preservation: maintains CRLF vs LF
 * - Diff generation: generates structured diffs for all changes
 */
export class FileManager {
    private readFileState = new Map<string, ReadFileState>();

    /**
     * Read a file and track its state
     */
    async read(filePath: string, options?: { offset?: number; limit?: number }): Promise<ReadResult> {
        const absolutePath = path.resolve(filePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const stats = fs.statSync(absolutePath);
        if (!stats.isFile()) {
            throw new Error(`Path is not a file: ${filePath}`);
        }

        // Detect encoding
        const encoding = this.detectEncoding(absolutePath);

        // Read content
        let content = fs.readFileSync(absolutePath, { encoding });

        // Apply offset/limit if specified
        if (options?.offset !== undefined || options?.limit !== undefined) {
            const lines = content.split(/\r?\n/);
            const offset = options.offset ?? 0;
            const limit = options.limit ?? lines.length;
            const selectedLines = lines.slice(offset, offset + limit);
            content = selectedLines.join('\n');
        }

        // Detect line ending
        const lineEnding = this.detectLineEnding(absolutePath);

        // Update state
        const mtime = Math.floor(stats.mtimeMs);
        this.readFileState.set(absolutePath, {
            content: fs.readFileSync(absolutePath, { encoding }),
            timestamp: mtime
        });

        return { content, encoding, lineEnding };
    }

    /**
     * Write a file with read-before-write validation
     */
    async write(filePath: string, content: string): Promise<WriteResult> {
        const absolutePath = path.resolve(filePath);
        const fileExists = fs.existsSync(absolutePath);

        // Validation for existing files
        if (fileExists) {
            const readState = this.readFileState.get(absolutePath);

            if (!readState) {
                throw new Error(
                    'File has not been read yet. Read it first before writing to it.'
                );
            }

            // Check for external modifications
            const currentMtime = Math.floor(fs.statSync(absolutePath).mtimeMs);
            if (currentMtime > readState.timestamp) {
                throw new Error(
                    'File has been modified since read, either by the user or by a linter. Read it again before attempting to write it.'
                );
            }
        }

        // Determine encoding and line ending
        const encoding: BufferEncoding = fileExists ? this.detectEncoding(absolutePath) : 'utf-8';
        const originalContent = fileExists ? fs.readFileSync(absolutePath, { encoding }) : null;
        const lineEnding = fileExists
            ? this.detectLineEnding(absolutePath)
            : await this.getDefaultLineEnding();

        // Create parent directory if needed
        const parentDir = path.dirname(absolutePath);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }

        // Write file with proper line endings
        const normalizedContent = this.normalizeLineEndings(content, lineEnding);
        fs.writeFileSync(absolutePath, normalizedContent, { encoding });

        // Update read state
        const newMtime = Math.floor(fs.statSync(absolutePath).mtimeMs);
        this.readFileState.set(absolutePath, {
            content: normalizedContent,
            timestamp: newMtime
        });

        // Generate result
        if (originalContent !== null) {
            // File was updated
            const patch = this.generateStructuredPatch(
                filePath,
                originalContent,
                normalizedContent
            );

            return {
                type: 'update',
                filePath,
                content: normalizedContent,
                structuredPatch: patch
            };
        } else {
            // File was created
            return {
                type: 'create',
                filePath,
                content: normalizedContent,
                structuredPatch: []
            };
        }
    }

    /**
     * Edit a file using string replacement
     */
    async edit(
        filePath: string,
        oldString: string,
        newString: string,
        replaceAll: boolean = false
    ): Promise<WriteResult> {
        const absolutePath = path.resolve(filePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const readState = this.readFileState.get(absolutePath);
        if (!readState) {
            throw new Error('File has not been read yet. Read it first before editing it.');
        }

        // Check for external modifications
        const currentMtime = Math.floor(fs.statSync(absolutePath).mtimeMs);
        if (currentMtime > readState.timestamp) {
            throw new Error(
                'File has been modified since read. Read it again before attempting to edit it.'
            );
        }

        // Perform replacement
        const content = readState.content;
        let newContent: string;

        if (replaceAll) {
            newContent = content.replaceAll(oldString, newString);
        } else {
            // Check for multiple matches
            const matches = content.split(oldString).length - 1;
            if (matches === 0) {
                throw new Error(`String not found in file: ${oldString}`);
            }
            if (matches > 1) {
                throw new Error(
                    `Multiple matches found (${matches}). Use replaceAll=true or provide a more specific string.`
                );
            }
            newContent = content.replace(oldString, newString);
        }

        // Write the edited content
        return this.write(filePath, newContent);
    }

    /**
     * Detect file encoding
     */
    private detectEncoding(filePath: string): BufferEncoding {
        const buffer = fs.readFileSync(filePath);
        return textDetectEncoding(buffer);
    }

    /**
     * Detect line ending style
     */
    private detectLineEnding(filePath: string): 'CRLF' | 'LF' {
        const content = fs.readFileSync(filePath, 'utf8');
        return textDetectLineEnding(content);
    }

    /**
     * Get default line ending based on platform
     */
    private async getDefaultLineEnding(): Promise<'CRLF' | 'LF'> {
        return textGetDefaultLineEnding();
    }

    /**
     * Normalize line endings in content
     */
    private normalizeLineEndings(content: string, lineEnding: 'CRLF' | 'LF'): string {
        return textNormalizeLineEnding(content, lineEnding);
    }

    /**
     * Generate structured patch from old and new content
     */
    private generateStructuredPatch(
        filePath: string,
        oldContent: string,
        newContent: string
    ): PatchHunk[] {
        // Generate unified diff
        const patch = createPatch(
            filePath,
            oldContent,
            newContent,
            'original',
            'updated'
        );

        // Parse into structured format
        const parsed = parsePatch(patch);

        if (parsed.length === 0) {
            return [];
        }

        // Convert to our PatchHunk format
        return parsed[0].hunks.map((hunk: any) => ({
            oldStart: hunk.oldStart,
            oldLines: hunk.oldLines,
            newStart: hunk.newStart,
            newLines: hunk.newLines,
            lines: hunk.lines
        }));
    }

    /**
     * Format content with line numbers (cat -n style)
     */
    formatWithLineNumbers(content: string, startLine: number = 1, maxLines?: number): string {
        const lines = content.split('\n');
        const linesToShow = maxLines ? lines.slice(0, maxLines) : lines;
        const endLine = startLine + linesToShow.length - 1;
        const width = String(endLine).length;

        const formatted = linesToShow.map((line, index) => {
            const lineNum = startLine + index;
            const paddedNum = String(lineNum).padStart(width, ' ');
            return `${paddedNum}\t${line}`;
        }).join('\n');

        if (maxLines && lines.length > maxLines) {
            return formatted + '\n...[truncated]';
        }

        return formatted;
    }

    /**
     * Clear the read state for a file (useful for testing or reset)
     */
    clearState(filePath?: string): void {
        if (filePath) {
            const absolutePath = path.resolve(filePath);
            this.readFileState.delete(absolutePath);
        } else {
            this.readFileState.clear();
        }
    }

    /**
     * Check if a file has been read
     */
    hasBeenRead(filePath: string): boolean {
        const absolutePath = path.resolve(filePath);
        return this.readFileState.has(absolutePath);
    }

    /**
     * Get the cached content for a file (if it has been read)
     */
    getCachedContent(filePath: string): string | null {
        const absolutePath = path.resolve(filePath);
        const state = this.readFileState.get(absolutePath);
        return state ? state.content : null;
    }
}
