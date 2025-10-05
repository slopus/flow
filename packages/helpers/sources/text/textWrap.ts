import stringWidth from 'string-width';

export interface TextWrapOptions {
    /**
     * Whether to trim whitespace (default: true)
     */
    trim?: boolean;
    /**
     * Enable hard wrapping for long words (default: false)
     */
    hard?: boolean;
    /**
     * Enable word wrapping (default: true)
     */
    wordWrap?: boolean;
}

/**
 * Wrap text to fit within a specified column width
 *
 * Features:
 * - Respects word boundaries when possible
 * - Handles ANSI escape codes (preserves across line breaks)
 * - Accounts for wide characters (CJK, emojis)
 * - Supports both soft and hard wrapping modes
 *
 * @param text - Input text to wrap
 * @param columns - Maximum width in display columns
 * @param options - Wrapping options
 * @returns Wrapped text with newlines
 */
export function textWrap(
    text: string,
    columns: number,
    options: TextWrapOptions = {}
): string {
    return String(text)
        .normalize()
        .replaceAll('\r\n', '\n')
        .split('\n')
        .map((line) => wrapLine(line, columns, options))
        .join('\n');
}

const ESC = '\x1b';
const ANSI_COLOR_REGEX = /\x1b\[(\d+)m/g;
const ANSI_HYPERLINK_START = ']8;;';
const ANSI_HYPERLINK_END = '\x1b\\';

interface AnsiState {
    color?: number;
    hyperlink?: string;
}

function stripAnsi(text: string): string {
    return text
        .replace(/\x1b\[\d+m/g, '')
        .replace(/\x1b]8;;[^\x1b]*\x1b\\/g, '');
}

function wrapLine(
    line: string,
    columns: number,
    options: TextWrapOptions = {}
): string {
    const { trim = true, hard = false, wordWrap = true } = options;

    // Handle empty lines
    if (trim && line.trim() === '') {
        return '';
    }

    // Pre-calculate word widths
    const words = line.split(' ');
    const wordWidths = words.map((word) => stringWidth(stripAnsi(word)));
    const outputLines: string[] = [''];

    // Process each word
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        const word = words[wordIndex];
        const wordWidth = wordWidths[wordIndex];

        // Trim leading spaces if trim enabled
        if (trim) {
            outputLines[outputLines.length - 1] = outputLines[outputLines.length - 1].trimStart();
        }

        let currentLineWidth = stringWidth(stripAnsi(outputLines[outputLines.length - 1]));

        // Add space before word (except first word)
        if (wordIndex !== 0) {
            if (currentLineWidth >= columns && (!wordWrap || !trim)) {
                outputLines.push('');
                currentLineWidth = 0;
            }
            if (currentLineWidth > 0 || !trim) {
                outputLines[outputLines.length - 1] += ' ';
                currentLineWidth++;
            }
        }

        // Hard wrap if word exceeds column width
        if (hard && wordWidth > columns) {
            const remainingSpace = columns - currentLineWidth;
            const linesNeeded = 1 + Math.floor((wordWidth - remainingSpace - 1) / columns);

            if (Math.floor((wordWidth - 1) / columns) < linesNeeded) {
                outputLines.push('');
            }

            hardWrapWord(outputLines, word, columns);
            continue;
        }

        // Check if word fits on current line
        if (currentLineWidth + wordWidth > columns && currentLineWidth > 0 && wordWidth > 0) {
            if (!wordWrap && currentLineWidth < columns) {
                hardWrapWord(outputLines, word, columns);
                continue;
            }
            outputLines.push(''); // Start new line
        }

        // Force character wrap if wordWrap disabled
        if (currentLineWidth + wordWidth > columns && !wordWrap) {
            hardWrapWord(outputLines, word, columns);
            continue;
        }

        // Add word to current line
        outputLines[outputLines.length - 1] += word;
    }

    // Trim trailing spaces if enabled
    let finalLines = trim ? outputLines.map((l) => smartTrimTrailing(l)) : outputLines;

    // Join lines and restore ANSI codes
    const joined = finalLines.join('\n');
    return restoreAnsiCodes(joined);
}

function hardWrapWord(outputLines: string[], word: string, columns: number): void {
    const chars = [...word];
    let inAnsiSequence = false;
    let inHyperlink = false;
    let currentLineWidth = stringWidth(stripAnsi(outputLines[outputLines.length - 1]));

    for (let charIndex = 0; charIndex < chars.length; charIndex++) {
        const char = chars[charIndex];
        const charWidth = stringWidth(stripAnsi(char));

        if (currentLineWidth + charWidth <= columns) {
            // Fits on current line
            outputLines[outputLines.length - 1] += char;
        } else {
            // Start new line
            outputLines.push(char);
            currentLineWidth = 0;
        }

        // Track ANSI sequences (skip in width calculation)
        if (char === ESC) {
            inAnsiSequence = true;
            // Check if hyperlink
            const next = chars.slice(charIndex + 1, charIndex + 1 + ANSI_HYPERLINK_START.length).join('');
            inHyperlink = next === ANSI_HYPERLINK_START;
        }

        if (inAnsiSequence) {
            if (inHyperlink && char === '\\' && chars[charIndex - 1] === ESC) {
                inAnsiSequence = false;
                inHyperlink = false;
            } else if (!inHyperlink && char === 'm') {
                inAnsiSequence = false;
            }
            continue; // Don't add to width
        }

        currentLineWidth += charWidth;

        // Exactly at limit - start new line
        if (currentLineWidth === columns && charIndex < chars.length - 1) {
            outputLines.push('');
            currentLineWidth = 0;
        }
    }

    // Merge empty trailing line
    if (
        currentLineWidth === 0 &&
        outputLines[outputLines.length - 1].length > 0 &&
        outputLines.length > 1
    ) {
        const last = outputLines.pop()!;
        outputLines[outputLines.length - 1] += last;
    }
}

function smartTrimTrailing(line: string): string {
    const parts = line.split(' ');
    let lastNonEmpty = parts.length;

    while (lastNonEmpty > 0) {
        if (stringWidth(stripAnsi(parts[lastNonEmpty - 1])) > 0) break;
        lastNonEmpty--;
    }

    if (lastNonEmpty === parts.length) return line;

    return parts.slice(0, lastNonEmpty).join(' ') + parts.slice(lastNonEmpty).join('');
}

function restoreAnsiCodes(text: string): string {
    let result = '';
    let currentState: AnsiState = {};
    const chars = [...text];

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        result += char;

        // Detect ANSI escape sequences
        if (char === ESC) {
            // Try to match color code
            const colorMatch = text.slice(i).match(/^\x1b\[(\d+)m/);
            if (colorMatch) {
                const code = Number.parseInt(colorMatch[1], 10);
                currentState.color = code === 0 ? undefined : code;
            }

            // Try to match hyperlink
            const hyperlinkMatch = text.slice(i).match(/^\x1b]8;;([^\x1b]*)\x1b\\/);
            if (hyperlinkMatch) {
                currentState.hyperlink = hyperlinkMatch[1].length === 0 ? undefined : hyperlinkMatch[1];
            }
        }

        const nextChar = chars[i + 1];

        // Before newline - close codes
        if (nextChar === '\n') {
            if (currentState.hyperlink) {
                result += `\x1b]8;;\x1b\\`; // Close hyperlink
            }
            if (currentState.color !== undefined) {
                const closeCode = getCloseCode(currentState.color);
                if (closeCode !== undefined) {
                    result += `\x1b[${closeCode}m`; // Close color
                }
            }
        }
        // After newline - reopen codes
        else if (char === '\n') {
            if (currentState.color !== undefined) {
                result += `\x1b[${currentState.color}m`; // Reopen color
            }
            if (currentState.hyperlink) {
                result += `\x1b]8;;${currentState.hyperlink}\x1b\\`; // Reopen hyperlink
            }
        }
    }

    return result;
}

function getCloseCode(code: number): number | undefined {
    // Map of ANSI color codes to their closing codes
    const closeMap: Record<number, number> = {
        1: 22, // bold -> normal intensity
        2: 22, // dim -> normal intensity
        3: 23, // italic -> not italic
        4: 24, // underline -> not underlined
        5: 25, // blink -> not blinking
        7: 27, // reverse -> not reversed
        8: 28, // hidden -> not hidden
        9: 29, // strikethrough -> not strikethrough
        30: 39, // black foreground -> default foreground
        31: 39, // red foreground -> default foreground
        32: 39, // green foreground -> default foreground
        33: 39, // yellow foreground -> default foreground
        34: 39, // blue foreground -> default foreground
        35: 39, // magenta foreground -> default foreground
        36: 39, // cyan foreground -> default foreground
        37: 39, // white foreground -> default foreground
        40: 49, // black background -> default background
        41: 49, // red background -> default background
        42: 49, // green background -> default background
        43: 49, // yellow background -> default background
        44: 49, // blue background -> default background
        45: 49, // magenta background -> default background
        46: 49, // cyan background -> default background
        47: 49, // white background -> default background
        90: 39, // bright black foreground -> default foreground
        91: 39, // bright red foreground -> default foreground
        92: 39, // bright green foreground -> default foreground
        93: 39, // bright yellow foreground -> default foreground
        94: 39, // bright blue foreground -> default foreground
        95: 39, // bright magenta foreground -> default foreground
        96: 39, // bright cyan foreground -> default foreground
        97: 39, // bright white foreground -> default foreground
        100: 49, // bright black background -> default background
        101: 49, // bright red background -> default background
        102: 49, // bright green background -> default background
        103: 49, // bright yellow background -> default background
        104: 49, // bright blue background -> default background
        105: 49, // bright magenta background -> default background
        106: 49, // bright cyan background -> default background
        107: 49, // bright white background -> default background
    };

    return closeMap[code];
}
