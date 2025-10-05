import { describe, test, expect } from 'bun:test';
import { textNormalizeLineEnding } from './textNormalizeLineEnding.js';

describe('textNormalizeLineEnding', () => {
    describe('normalizing to LF', () => {
        test('converts CRLF to LF', () => {
            const text = 'line1\r\nline2\r\nline3';
            expect(textNormalizeLineEnding(text, 'LF')).toBe('line1\nline2\nline3');
        });

        test('converts CR to LF', () => {
            const text = 'line1\rline2\rline3';
            expect(textNormalizeLineEnding(text, 'LF')).toBe('line1\nline2\nline3');
        });

        test('preserves existing LF', () => {
            const text = 'line1\nline2\nline3';
            expect(textNormalizeLineEnding(text, 'LF')).toBe('line1\nline2\nline3');
        });

        test('handles mixed line endings', () => {
            const text = 'line1\r\nline2\nline3\rline4';
            expect(textNormalizeLineEnding(text, 'LF')).toBe('line1\nline2\nline3\nline4');
        });

        test('handles empty string', () => {
            expect(textNormalizeLineEnding('', 'LF')).toBe('');
        });

        test('handles text with no line endings', () => {
            const text = 'single line';
            expect(textNormalizeLineEnding(text, 'LF')).toBe('single line');
        });

        test('handles multiple consecutive line endings', () => {
            const text = 'line1\r\n\r\nline2\n\nline3';
            expect(textNormalizeLineEnding(text, 'LF')).toBe('line1\n\nline2\n\nline3');
        });
    });

    describe('normalizing to CRLF', () => {
        test('converts LF to CRLF', () => {
            const text = 'line1\nline2\nline3';
            expect(textNormalizeLineEnding(text, 'CRLF')).toBe('line1\r\nline2\r\nline3');
        });

        test('converts CR to CRLF', () => {
            const text = 'line1\rline2\rline3';
            expect(textNormalizeLineEnding(text, 'CRLF')).toBe('line1\r\nline2\r\nline3');
        });

        test('preserves existing CRLF', () => {
            const text = 'line1\r\nline2\r\nline3';
            expect(textNormalizeLineEnding(text, 'CRLF')).toBe('line1\r\nline2\r\nline3');
        });

        test('handles mixed line endings', () => {
            const text = 'line1\r\nline2\nline3\rline4';
            expect(textNormalizeLineEnding(text, 'CRLF')).toBe('line1\r\nline2\r\nline3\r\nline4');
        });

        test('handles empty string', () => {
            expect(textNormalizeLineEnding('', 'CRLF')).toBe('');
        });

        test('handles text with no line endings', () => {
            const text = 'single line';
            expect(textNormalizeLineEnding(text, 'CRLF')).toBe('single line');
        });

        test('handles multiple consecutive line endings', () => {
            const text = 'line1\n\nline2\r\n\r\nline3';
            expect(textNormalizeLineEnding(text, 'CRLF')).toBe('line1\r\n\r\nline2\r\n\r\nline3');
        });
    });

    describe('edge cases', () => {
        test('handles text ending with line ending (LF)', () => {
            const text = 'line1\nline2\n';
            expect(textNormalizeLineEnding(text, 'LF')).toBe('line1\nline2\n');
            expect(textNormalizeLineEnding(text, 'CRLF')).toBe('line1\r\nline2\r\n');
        });

        test('handles text ending with line ending (CRLF)', () => {
            const text = 'line1\r\nline2\r\n';
            expect(textNormalizeLineEnding(text, 'LF')).toBe('line1\nline2\n');
            expect(textNormalizeLineEnding(text, 'CRLF')).toBe('line1\r\nline2\r\n');
        });

        test('handles text starting with line ending', () => {
            const text = '\nline1\nline2';
            expect(textNormalizeLineEnding(text, 'LF')).toBe('\nline1\nline2');
            expect(textNormalizeLineEnding(text, 'CRLF')).toBe('\r\nline1\r\nline2');
        });

        test('handles only line endings', () => {
            const text = '\n\n\n';
            expect(textNormalizeLineEnding(text, 'LF')).toBe('\n\n\n');
            expect(textNormalizeLineEnding(text, 'CRLF')).toBe('\r\n\r\n\r\n');
        });
    });
});
