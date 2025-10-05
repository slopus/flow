/**
 * Normalizes line endings in a text string to the specified style
 *
 * Converts all line endings (CRLF, CR, LF, NEL, LS) to either CRLF or LF.
 *
 * @param text - Text content with mixed line endings
 * @param lineEnding - Target line ending style ("CRLF" or "LF")
 * @returns Text with normalized line endings
 */
export function textNormalizeLineEnding(text: string, lineEnding: 'CRLF' | 'LF'): string {
    if (lineEnding === 'CRLF') {
        // First normalize everything to LF, then convert to CRLF
        return text
            .replace(/\r\n/g, '\n')  // CRLF -> LF
            .replace(/\r/g, '\n')    // CR -> LF
            .replace(/\n/g, '\r\n'); // LF -> CRLF
    } else {
        // Normalize to LF
        return text
            .replace(/\r\n/g, '\n')  // CRLF -> LF
            .replace(/\r/g, '\n');   // CR -> LF
    }
}
