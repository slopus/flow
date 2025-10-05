import { describe, test, expect } from 'bun:test';
import { textDetectEncoding } from './textDetectEncoding.js';

describe('textDetectEncoding', () => {
    describe('BOM detection', () => {
        test('detects UTF-16 LE BOM', () => {
            // UTF-16 LE BOM: FF FE
            const buffer = Buffer.from([0xFF, 0xFE, 0x48, 0x00, 0x65, 0x00]);
            expect(textDetectEncoding(buffer)).toBe('utf16le');
        });

        test('detects UTF-8 BOM', () => {
            // UTF-8 BOM: EF BB BF
            const buffer = Buffer.from([0xEF, 0xBB, 0xBF, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });

        test('UTF-16 LE BOM takes precedence over UTF-8 BOM check', () => {
            // Only UTF-16 LE BOM present
            const buffer = Buffer.from([0xFF, 0xFE]);
            expect(textDetectEncoding(buffer)).toBe('utf16le');
        });
    });

    describe('UTF-8 detection without BOM', () => {
        test('detects UTF-8 without BOM', () => {
            const buffer = Buffer.from('Hello, World!', 'utf8');
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });

        test('detects UTF-8 with multi-byte characters', () => {
            const buffer = Buffer.from('Hello 世界 🌍', 'utf8');
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });

        test('detects UTF-8 with emoji', () => {
            const buffer = Buffer.from('Hello 🎉🎊', 'utf8');
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });
    });

    describe('ASCII detection', () => {
        test('detects ASCII for basic text', () => {
            // ASCII text
            const buffer = Buffer.from('Hello ASCII', 'ascii');
            expect(textDetectEncoding(buffer)).toBe('utf8'); // ASCII is valid UTF-8
        });
    });

    describe('edge cases', () => {
        test('handles empty buffer', () => {
            const buffer = Buffer.from([]);
            expect(textDetectEncoding(buffer)).toBe('ascii');
        });

        test('handles single byte buffer', () => {
            const buffer = Buffer.from([0x48]); // 'H'
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });

        test('handles two byte buffer without BOM', () => {
            const buffer = Buffer.from([0x48, 0x65]); // 'He'
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });

        test('handles buffer with partial BOM (only first byte of UTF-16 LE)', () => {
            const buffer = Buffer.from([0xFF]);
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });

        test('handles buffer with partial BOM (only two bytes of UTF-8 BOM)', () => {
            const buffer = Buffer.from([0xEF, 0xBB]);
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });

        test('handles buffer with null bytes', () => {
            const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
            // Null bytes can be decoded as UTF-8 (they're just NUL characters)
            const result = textDetectEncoding(buffer);
            expect(['utf8', 'ascii']).toContain(result);
        });
    });

    describe('various encodings', () => {
        test('detects plain English text', () => {
            const buffer = Buffer.from('The quick brown fox jumps over the lazy dog');
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });

        test('detects text with special characters', () => {
            const buffer = Buffer.from('Café, naïve, résumé');
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });

        test('detects CJK characters', () => {
            const buffer = Buffer.from('你好世界'); // Chinese
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });

        test('detects mixed scripts', () => {
            const buffer = Buffer.from('Hello Привет مرحبا');
            expect(textDetectEncoding(buffer)).toBe('utf8');
        });
    });

    describe('invalid or binary data', () => {
        test('handles random binary data', () => {
            const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG signature
            const result = textDetectEncoding(buffer);
            expect(['utf8', 'ascii']).toContain(result);
        });

        test('handles high byte values', () => {
            const buffer = Buffer.from([0xFF, 0xFF, 0xFF]);
            const result = textDetectEncoding(buffer);
            // Should not be UTF-16 LE (wrong BOM), will be utf8 or ascii
            expect(['utf8', 'ascii']).toContain(result);
        });
    });
});
