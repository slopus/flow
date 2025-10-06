#!/usr/bin/env node
import { copyFileSync, chmodSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
        throw new Error(
            `Unsupported platform: ${platform}-${arch}\n` +
            `Supported platforms: ${Object.keys(binaryMap).join(', ')}`
        );
    }

    return binaryName;
}

function install() {
    try {
        const binaryName = getPlatformBinary();
        const packageRoot = join(__dirname, '..');
        const distDir = join(packageRoot, 'dist');
        const binDir = join(packageRoot, 'bin');

        const sourcePath = join(distDir, binaryName);
        const targetPath = join(binDir, 'flow' + (process.platform === 'win32' ? '.exe' : ''));

        // Check if source binary exists
        if (!existsSync(sourcePath)) {
            // During development or before prepare script runs, dist won't exist
            // Only fail if we're being installed as a real package (dist should exist)
            if (!existsSync(distDir)) {
                // Development mode - skip installation
                console.log('Skipping installation (development mode)');
                return;
            }
            console.error(`Binary not found: ${sourcePath}`);
            console.error('Please run "bun run build" from the project root first.');
            process.exit(1);
        }

        // Create bin directory if it doesn't exist
        if (!existsSync(binDir)) {
            mkdirSync(binDir, { recursive: true });
        }

        // Copy binary
        console.log(`Installing Flow for ${process.platform}-${process.arch}...`);
        copyFileSync(sourcePath, targetPath);

        // Make executable on Unix-like systems
        if (process.platform !== 'win32') {
            chmodSync(targetPath, 0o755);
        }

        console.log(`✓ Flow installed successfully at ${targetPath}`);
    } catch (error) {
        console.error('Installation failed:', error.message);
        process.exit(1);
    }
}

install();
