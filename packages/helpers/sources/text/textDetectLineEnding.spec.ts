import { describe, test, expect } from 'bun:test';
import { textDetectLineEnding } from './textDetectLineEnding.js';

describe('textDetectLineEnding', () => {
    test('detects LF line endings', () => {
        const text = 'line1\nline2\nline3\n';
        expect(textDetectLineEnding(text)).toBe('LF');
    });

    test('detects CRLF line endings', () => {
        const text = 'line1\r\nline2\r\nline3\r\n';
        expect(textDetectLineEnding(text)).toBe('CRLF');
    });

    test('returns LF when counts are equal', () => {
        const text = 'line1\nline2\r\nline3';
        expect(textDetectLineEnding(text)).toBe('LF');
    });

    test('returns predominant style when mixed', () => {
        const textWithMoreCRLF = 'line1\r\nline2\r\nline3\nline4\r\n';
        expect(textDetectLineEnding(textWithMoreCRLF)).toBe('CRLF');

        const textWithMoreLF = 'line1\nline2\nline3\r\nline4\n';
        expect(textDetectLineEnding(textWithMoreLF)).toBe('LF');
    });

    test('handles empty string', () => {
        expect(textDetectLineEnding('')).toBe('LF');
    });

    test('handles text with no line endings', () => {
        expect(textDetectLineEnding('single line')).toBe('LF');
    });

    test('handles text with only CR (not CRLF)', () => {
        const text = 'line1\rline2\rline3';
        // CR followed by something other than LF is not counted
        expect(textDetectLineEnding(text)).toBe('LF');
    });

    test('correctly counts CRLF vs LF', () => {
        // 3 CRLF, 2 LF
        const text = 'a\r\nb\r\nc\nd\ne\r\n';
        expect(textDetectLineEnding(text)).toBe('CRLF');
    });

    test('handles trailing line ending', () => {
        const textLF = 'line1\nline2\n';
        expect(textDetectLineEnding(textLF)).toBe('LF');

        const textCRLF = 'line1\r\nline2\r\n';
        expect(textDetectLineEnding(textCRLF)).toBe('CRLF');
    });

    test('handles text with only newline at end', () => {
        const textLF = 'no newlines until end\n';
        expect(textDetectLineEnding(textLF)).toBe('LF');

        const textCRLF = 'no newlines until end\r\n';
        expect(textDetectLineEnding(textCRLF)).toBe('CRLF');
    });
});
