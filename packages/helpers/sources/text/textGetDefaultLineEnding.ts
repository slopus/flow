/**
 * Gets the default line ending style for the current platform
 *
 * Returns "CRLF" on Windows, "LF" on all other platforms (Unix, macOS, Linux).
 *
 * @returns The platform's default line ending style
 */
export function textGetDefaultLineEnding(): 'CRLF' | 'LF' {
    return process.platform === 'win32' ? 'CRLF' : 'LF';
}
