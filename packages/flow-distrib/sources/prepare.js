#!/usr/bin/env node
import { copyFileSync, rmSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function prepare() {
    try {
        const packageRoot = join(__dirname, '..');
        const projectRoot = join(packageRoot, '..', '..');
        const distSrc = join(projectRoot, 'dist');
        const distDest = join(packageRoot, 'dist');
        const binDir = join(packageRoot, 'bin');

        console.log('Preparing flow-distrib package for publishing...');

        // Clean existing dist and bin directories
        if (existsSync(distDest)) {
            console.log('Cleaning existing dist directory...');
            rmSync(distDest, { recursive: true, force: true });
        }
        if (existsSync(binDir)) {
            console.log('Cleaning existing bin directory...');
            rmSync(binDir, { recursive: true, force: true });
        }

        // Create dist directory
        mkdirSync(distDest, { recursive: true });

        // Copy all binaries from root dist to package dist
        if (!existsSync(distSrc)) {
            console.error(`Source dist directory not found: ${distSrc}`);
            console.error('Please run "bun run build" from the project root first.');
            process.exit(1);
        }

        console.log('Copying binaries...');
        const files = readdirSync(distSrc);
        files.forEach(file => {
            const src = join(distSrc, file);
            const dest = join(distDest, file);
            copyFileSync(src, dest);
            console.log(`  ✓ ${file}`);
        });

        // Copy README.md
        const readmeSrc = join(projectRoot, 'README.md');
        const readmeDest = join(packageRoot, 'README.md');
        if (existsSync(readmeSrc)) {
            copyFileSync(readmeSrc, readmeDest);
            console.log('  ✓ README.md');
        } else {
            console.warn('  ⚠ README.md not found in project root');
        }

        // Copy LICENSE
        const licenseSrc = join(projectRoot, 'LICENSE');
        const licenseDest = join(packageRoot, 'LICENSE');
        if (existsSync(licenseSrc)) {
            copyFileSync(licenseSrc, licenseDest);
            console.log('  ✓ LICENSE');
        } else {
            console.warn('  ⚠ LICENSE not found in project root');
        }

        console.log('\n✓ Package prepared successfully!');
        console.log(`  Binaries: ${files.length}`);
    } catch (error) {
        console.error('Preparation failed:', error.message);
        process.exit(1);
    }
}

prepare();
