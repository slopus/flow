import { z } from 'zod';
import { tool } from '../Tool.js';
import { FileManager } from '../FileManager.js';

export function createWriteTool(fileManager: FileManager) {
    return tool({
        name: 'Write',
        description: 'Writes a file to the local filesystem. This tool will overwrite the existing file if there is one at the provided path. If this is an existing file, you MUST use the Read tool first to read the file\'s contents.',
        parameters: z.object({
            file_path: z.string().describe('The absolute path to the file to write (must be absolute, not relative)'),
            content: z.string().describe('The content to write to the file')
        }),
        execute: async (args) => {
            const result = await fileManager.write(args.file_path, args.content);
            return result;
        },
        toLLM: (result) => {
            if (result.type === 'create') {
                return `File created successfully at: ${result.filePath}`;
            } else {
                // Show snippet with line numbers for updates
                const MAX_LINES = 50;
                const snippet = fileManager.formatWithLineNumbers(result.content, 1, MAX_LINES);
                return `The file ${result.filePath} has been updated. Here's the result of running \`cat -n\` on a snippet of the edited file:\n${snippet}`;
            }
        }
    });
}
