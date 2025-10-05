import { describe, test, expect } from 'bun:test';
import { textGetDefaultLineEnding } from './textGetDefaultLineEnding.js';

describe('textGetDefaultLineEnding', () => {
    test('returns platform-appropriate line ending', () => {
        const result = textGetDefaultLineEnding();

        // Should return either CRLF or LF
        expect(['CRLF', 'LF']).toContain(result);

        // On Windows, should be CRLF
        if (process.platform === 'win32') {
            expect(result).toBe('CRLF');
        } else {
            // On Unix-like systems (macOS, Linux, etc.), should be LF
            expect(result).toBe('LF');
        }
    });

    test('returns consistent result', () => {
        const first = textGetDefaultLineEnding();
        const second = textGetDefaultLineEnding();

        expect(first).toBe(second);
    });
});
