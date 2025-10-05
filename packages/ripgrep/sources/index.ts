import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

/**
 * Determine the platform-specific binary directory
 */
function getBinaryPath(): string {
    const platform = process.platform;
    const arch = process.arch;

    let vendorDir: string;

    if (platform === 'darwin' && arch === 'arm64') {
        vendorDir = 'arm64-darwin';
    } else if (platform === 'darwin' && arch === 'x64') {
        vendorDir = 'x64-darwin';
    } else if (platform === 'linux' && arch === 'arm64') {
        vendorDir = 'arm64-linux';
    } else if (platform === 'linux' && arch === 'x64') {
        vendorDir = 'x64-linux';
    } else if (platform === 'win32' && arch === 'x64') {
        vendorDir = 'x64-win32';
    } else {
        throw new Error(`Unsupported platform: ${platform}-${arch}`);
    }

    const rgBinary = platform === 'win32' ? 'rg.exe' : 'rg';
    return join(__dirname, '..', 'vendor', vendorDir, rgBinary);
}

/**
 * Ripgrep search options
 */
export interface RipgrepOptions {
    /**
     * Working directory for the search
     */
    cwd?: string;
}

/**
 * Result from a ripgrep search
 */
export interface RipgrepResult {
    /**
     * Standard output from ripgrep
     */
    stdout: string;

    /**
     * Standard error from ripgrep
     */
    stderr: string;

    /**
     * Exit code from ripgrep process
     */
    exitCode: number;
}

/**
 * Execute ripgrep search
 */
export async function ripgrep(
    args: string[],
    options: RipgrepOptions = {}
): Promise<RipgrepResult> {
    const rgPath = getBinaryPath();

    // Spawn ripgrep process
    const proc = Bun.spawn([rgPath, ...args], {
        cwd: options.cwd,
        stdout: 'pipe',
        stderr: 'pipe',
    });

    // Collect output
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    // Wait for process to exit
    const exitCode = await proc.exited;

    return {
        stdout,
        stderr,
        exitCode,
    };
}

