/**
 * Detects the line ending style used in a text string
 *
 * Counts occurrences of CRLF vs LF line endings and returns
 * the predominant style.
 *
 * @param text - Text content to analyze
 * @returns "CRLF" if Windows-style line endings are more common, otherwise "LF"
 */
export function textDetectLineEnding(text: string): 'CRLF' | 'LF' {
    let crlfCount = 0;
    let lfCount = 0;

    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') {
            if (i > 0 && text[i - 1] === '\r') {
                crlfCount++;
            } else {
                lfCount++;
            }
        }
    }

    return crlfCount > lfCount ? 'CRLF' : 'LF';
}
