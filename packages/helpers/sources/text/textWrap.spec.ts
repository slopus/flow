import { describe, test, expect } from 'bun:test';
import { textWrap } from './textWrap.js';

describe('textWrap', () => {
    describe('basic wrapping', () => {
        test('wraps text at word boundaries', () => {
            expect(textWrap('hello world', 10)).toBe('hello\nworld');
        });

        test('keeps text on one line when it fits', () => {
            expect(textWrap('hello world', 11)).toBe('hello world');
        });

        test('wraps at specific width', () => {
            expect(textWrap('hello world', 5)).toBe('hello\nworld');
        });

        test('handles multiple words', () => {
            expect(textWrap('one two three four', 8)).toBe('one two\nthree\nfour');
        });

        test('handles single word longer than width', () => {
            expect(textWrap('verylongword', 5, { hard: false })).toBe('verylongword');
        });
    });

    describe('hard wrapping', () => {
        test('does NOT hard wrap by default (hard: false is default)', () => {
            // Long words overflow when hard wrapping is disabled
            expect(textWrap('verylongword', 5)).toBe('verylongword');
            expect(textWrap('verylongword', 5, {})).toBe('verylongword');
            expect(textWrap('verylongword', 5, { hard: false })).toBe('verylongword');
        });

        test('breaks long words with hard: true', () => {
            expect(textWrap('verylongword', 5, { hard: true })).toBe('veryl\nongwo\nrd');
        });

        test('hard wraps mixed content', () => {
            // "short " takes 6 columns, "verylongword" has 12 columns
            // First line: "short very" (10 cols)
            // Second line: "longword" (8 cols)
            expect(textWrap('short verylongword', 10, { hard: true })).toBe('short very\nlongword');
        });

        test('hard wraps exactly at boundary', () => {
            expect(textWrap('12345678901234', 7, { hard: true })).toBe('1234567\n8901234');
        });

        test('hard wraps wide characters correctly', () => {
            // 世界世界世界 = 10 columns (5 chars × 2 width each)
            expect(textWrap('世界世界世界', 6, { hard: true })).toBe('世界世\n界世界');
        });

        test('hard wraps emojis correctly', () => {
            expect(textWrap('🎉🎉🎉🎉🎉', 6, { hard: true })).toBe('🎉🎉🎉\n🎉🎉');
        });

        test('hard wraps only words that exceed width', () => {
            // "short " = 6, "averylongword" = 13 (exceeds 10)
            // Line 1: "short aver" (10 cols)
            // Line 2: "ylongword" (9 cols)
            // Line 3: "end" (3 cols)
            expect(textWrap('short averylongword end', 10, { hard: true }))
                .toBe('short aver\nylongword\nend');
        });

        test('hard wrapping respects word boundaries for normal words', () => {
            // Words that fit don't get broken
            expect(textWrap('one two three', 5, { hard: true })).toBe('one\ntwo\nthree');
        });

        test('hard wrapping with trim disabled', () => {
            // Spaces are preserved, wrapped character by character
            expect(textWrap('  verylongword  ', 5, { hard: true, trim: false }))
                .toBe('  ver\nylong\nword \n ');
        });
    });

    describe('wide characters', () => {
        test('handles CJK characters (width 2)', () => {
            expect(textWrap('hello 世界', 8)).toBe('hello\n世界');
        });

        test('wraps CJK correctly', () => {
            // 世界 = 4 cols, hello = 5 cols, total = 9 cols
            // With width 7, it won't wrap because it's a single word (no space)
            expect(textWrap('世界hello', 7)).toBe('世界hello');
        });

        test('handles mixed width characters', () => {
            // Hi = 2 cols, 世界 = 4 cols, total = 6 cols
            // With width 5 and hard: true, it should wrap
            expect(textWrap('Hi世界', 5, { hard: true })).toBe('Hi世\n界');
        });

        test('handles emojis (width 2)', () => {
            expect(textWrap('hello 🎉 world', 10)).toBe('hello 🎉\nworld');
        });
    });

    describe('ANSI codes', () => {
        test('preserves color codes', () => {
            const input = '\x1b[31mhello world\x1b[39m';
            const output = textWrap(input, 8);
            // Should close and reopen red color across line break
            expect(output).toContain('\x1b[31m');
            expect(output).toContain('\x1b[39m');
            expect(output).toMatch(/hello.*\n.*world/);
        });

        test('handles color codes with zero width', () => {
            const input = '\x1b[31m\x1b[39m';
            expect(textWrap(input, 10)).toBe('\x1b[31m\x1b[39m');
        });

        test('preserves multiple color codes', () => {
            const input = '\x1b[31mred\x1b[39m \x1b[32mgreen\x1b[39m text';
            const output = textWrap(input, 8);
            expect(output).toContain('\x1b[31m');
            expect(output).toContain('\x1b[32m');
        });
    });

    describe('trim option', () => {
        test('trims whitespace by default', () => {
            expect(textWrap('  hello  world  ', 10)).toBe('hello\nworld');
        });

        test('preserves whitespace with trim: false', () => {
            const output = textWrap('  hello  world  ', 10, { trim: false });
            expect(output).toContain('  hello');
        });

        test('handles empty lines with trim: true', () => {
            expect(textWrap('   ', 10, { trim: true })).toBe('');
        });

        test('handles empty lines with trim: false', () => {
            expect(textWrap('   ', 10, { trim: false })).toBe('   ');
        });

        test('preserves spaces between words even with trim: true', () => {
            // trim only affects leading/trailing, not internal spaces
            expect(textWrap('hello    world', 15, { trim: true })).toBe('hello    world');
        });
    });

    describe('wordWrap option', () => {
        test('wraps at word boundaries with wordWrap: true', () => {
            expect(textWrap('hello world', 8, { wordWrap: true })).toBe('hello\nworld');
        });

        test('breaks mid-word with wordWrap: false', () => {
            expect(textWrap('hello world', 8, { wordWrap: false })).toBe('hello wo\nrld');
        });

        test('wordWrap: false forces character breaking', () => {
            expect(textWrap('verylongword', 5, { wordWrap: false })).toBe('veryl\nongwo\nrd');
        });
    });

    describe('edge cases', () => {
        test('handles empty string', () => {
            expect(textWrap('', 10)).toBe('');
        });

        test('handles single character', () => {
            expect(textWrap('a', 10)).toBe('a');
        });

        test('handles single wide character wider than columns', () => {
            // When emoji (width 2) is forced into width 1, it creates a new line
            const result = textWrap('🎉', 1, { hard: true });
            expect(result).toContain('🎉');
        });

        test('handles line breaks in input', () => {
            expect(textWrap('hello\nworld', 10)).toBe('hello\nworld');
        });

        test('handles trailing newlines', () => {
            expect(textWrap('hello\n', 10)).toBe('hello\n');
        });

        test('handles multiple newlines', () => {
            expect(textWrap('hello\n\n', 10)).toBe('hello\n\n');
        });

        test('handles CRLF line endings', () => {
            expect(textWrap('hello\r\nworld', 10)).toBe('hello\nworld');
        });

        test('handles very long lines', () => {
            const long = 'a'.repeat(100);
            const output = textWrap(long, 10, { hard: true });
            const lines = output.split('\n');
            expect(lines.every((line) => line.length <= 10)).toBe(true);
        });
    });

    describe('unicode normalization', () => {
        test('normalizes unicode characters', () => {
            // é can be represented as single codepoint or e + combining acute
            const composed = 'café'; // single codepoint é
            const decomposed = 'cafe\u0301'; // e + combining acute
            expect(textWrap(composed, 10)).toBe(textWrap(decomposed, 10));
        });
    });

    describe('complex scenarios', () => {
        test('handles mixed content with wrapping', () => {
            const input = 'The quick brown 🦊 jumps over the lazy 🐶';
            const output = textWrap(input, 20);
            const lines = output.split('\n');
            expect(lines.every((line) => {
                // Strip ANSI and measure
                const stripped = line.replace(/\x1b\[\d+m/g, '');
                return stripped.length <= 22; // Account for wide chars
            })).toBe(true);
        });

        test('handles ANSI codes with hard wrapping', () => {
            const input = '\x1b[31mverylongredword\x1b[39m';
            const output = textWrap(input, 8, { hard: true });
            expect(output).toContain('\x1b[31m');
            expect(output).toContain('\x1b[39m');
            expect(output).toMatch(/\n/);
        });

        test('preserves formatting across multiple wraps', () => {
            const input = '\x1b[31mThis is a very long red text that needs multiple wraps\x1b[39m';
            const output = textWrap(input, 15, { hard: false });
            const lines = output.split('\n');
            expect(lines.length).toBeGreaterThan(1);
            // Each line should have color codes
            expect(lines.every((line) => line.includes('\x1b['))).toBe(true);
        });
    });

    describe('option combinations', () => {
        test('trim: false, hard: true', () => {
            const output = textWrap('  verylongword  ', 8, { trim: false, hard: true });
            expect(output).toContain('  ');
        });

        test('wordWrap: false, trim: true', () => {
            const output = textWrap('  hello world  ', 8, { wordWrap: false, trim: true });
            expect(output).toBe('hello wo\nrld');
        });

        test('all options enabled', () => {
            const output = textWrap('  hello verylongword world  ', 10, {
                trim: true,
                hard: true,
                wordWrap: true,
            });
            expect(output).toContain('\n');
            expect(output).not.toContain('  ');
        });
    });
});
