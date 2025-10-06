#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getPlatformBinary() {
    const platform = process.platform;
    const arch = process.arch;

    const binaryMap = {
        'win32-x64': 'flow-windows-x64.exe',
        'darwin-x64': 'flow-macos-x64',
        'darwin-arm64': 'flow-macos-arm64',
        'linux-x64': 'flow-linux-x64',
        'linux-arm64': 'flow-linux-arm64',
    };

    const key = `${platform}-${arch}`;
    const binaryName = binaryMap[key];

    if (!binaryName) {
        console.error(
            `Unsupported platform: ${platform}-${arch}\n` +
            `Supported platforms: ${Object.keys(binaryMap).join(', ')}`
        );
        process.exit(1);
    }

    return binaryName;
}

function main() {
    const binaryName = getPlatformBinary();
    const packageRoot = join(__dirname, '..');
    const binaryPath = join(packageRoot, 'dist', binaryName);

    if (!existsSync(binaryPath)) {
        console.error(`Flow binary not found: ${binaryPath}`);
        console.error('The package may not have been installed correctly.');
        process.exit(1);
    }

    // Pass through all arguments and spawn the binary
    const result = spawnSync(binaryPath, process.argv.slice(2), {
        stdio: 'inherit',
        shell: false
    });

    process.exit(result.status ?? 1);
}

main();
