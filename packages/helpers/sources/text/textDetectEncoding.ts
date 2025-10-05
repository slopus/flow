/**
 * Detects the text encoding of a buffer by checking for Byte Order Marks (BOM)
 *
 * Checks for:
 * - UTF-16 LE BOM (FF FE)
 * - UTF-8 BOM (EF BB BF)
 * - Falls back to UTF-8 if valid UTF-8 content detected
 * - Falls back to ASCII otherwise
 *
 * @param buffer - Buffer to analyze
 * @returns Detected encoding: "utf16le", "utf8", or "ascii"
 */
export function textDetectEncoding(buffer: Buffer): 'utf16le' | 'utf8' | 'ascii' {
    const length = buffer.length;

    // Check for UTF-16 LE BOM (FF FE)
    if (length >= 2) {
        if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
            return 'utf16le';
        }
    }

    // Check for UTF-8 BOM (EF BB BF)
    if (length >= 3) {
        if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            return 'utf8';
        }
    }

    // Try to decode as UTF-8 and check if it's valid
    const asUtf8 = buffer.toString('utf8');
    if (asUtf8.length > 0) {
        return 'utf8';
    }

    // Default to ASCII if nothing else matches
    return 'ascii';
}
