import { appendFileSync } from 'fs';
import { resolve } from 'path';

const LOG_FILE = resolve(process.cwd(), 'log.txt');
const DEBUG_ENABLED = process.env.DEBUG === '1';

export function log(...args: unknown[]): void {
    if (!DEBUG_ENABLED) {
        return;
    }

    const timestamp = new Date().toISOString();
    const message = args.map(arg =>
        typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');

    const logLine = `[${timestamp}] ${message}\n`;

    appendFileSync(LOG_FILE, logLine, 'utf8');
}
