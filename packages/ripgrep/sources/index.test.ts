import { describe, test, expect } from 'bun:test';
import { ripgrep } from './index.js';

describe('ripgrep', () => {
    test('should search for pattern and return results', async () => {
        const result = await ripgrep(['ripgrep', '.', '--glob', '*.ts', '-n']);

        expect(result.exitCode).toBeLessThanOrEqual(1);
        expect(result.stdout).toContain('ripgrep');
    });

    test('should handle case insensitive search', async () => {
        const result = await ripgrep(['RIPGREP', '.', '--glob', '*.ts', '-i']);

        expect(result.exitCode).toBeLessThanOrEqual(1);
        expect(result.stdout).toContain('ripgrep');
    });

    test('should return files with matches', async () => {
        const result = await ripgrep(['ripgrep', '.', '--glob', '*.ts', '-l']);

        expect(result.exitCode).toBeLessThanOrEqual(1);
        expect(result.stdout).toMatch(/\.ts/);
    });

    test('should handle no matches with exit code 1', async () => {
        const result = await ripgrep(['^QWERTYPATTERNNOTFOUND$', '.', '--type', 'ts']);

        expect(result.exitCode).toBe(1);
        expect(result.stdout).toBe('');
    });

    test.skip('should search in specific file', async () => {
        const result = await ripgrep(['@slopus/ripgrep', 'package.json']);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('@slopus/ripgrep');
    });

    test('should handle errors in stderr', async () => {
        const result = await ripgrep(['--invalid-flag-that-does-not-exist', '.']);

        expect(result.exitCode).toBeGreaterThan(1);
        expect(result.stderr.length).toBeGreaterThan(0);
    });
});
