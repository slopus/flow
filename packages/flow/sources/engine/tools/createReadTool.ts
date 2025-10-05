import { z } from 'zod';
import { tool } from '../Tool.js';
import { FileManager } from '../FileManager.js';

export function createReadTool(fileManager: FileManager) {
    return tool({
        name: 'Read',
        description: 'Reads a file from the local filesystem. You can access any file directly by using this tool.',
        parameters: z.object({
            file_path: z.string().describe('The absolute path to the file to read'),
            offset: z.number().optional().describe('The line number to start reading from. Only provide if the file is too large to read at once'),
            limit: z.number().optional().describe('The number of lines to read. Only provide if the file is too large to read at once')
        }),
        execute: async (args) => {
            const result = await fileManager.read(args.file_path, {
                offset: args.offset,
                limit: args.limit
            });
            return result;
        },
        toLLM: (result) => {
            // Format with line numbers (cat -n style)
            const startLine = 1; // We could track offset if needed
            return fileManager.formatWithLineNumbers(result.content, startLine);
        }
    });
}
