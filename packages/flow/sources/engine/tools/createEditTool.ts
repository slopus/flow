import { z } from 'zod';
import { tool } from '../Tool.js';
import { FileManager } from '../FileManager.js';

export function createEditTool(fileManager: FileManager) {
    return tool({
        name: 'Edit',
        description: 'Performs exact string replacements in files. You must use the Read tool at least once before editing. When editing text from Read tool output, ensure you preserve the exact indentation (tabs/spaces) as it appears AFTER the line number prefix.',
        parameters: z.object({
            file_path: z.string().describe('The absolute path to the file to modify'),
            old_string: z.string().describe('The text to replace'),
            new_string: z.string().describe('The text to replace it with (must be different from old_string)'),
            replace_all: z.boolean().optional().default(false).describe('Replace all occurrences of old_string (default false)')
        }),
        execute: async (args) => {
            if (args.old_string === args.new_string) {
                throw new Error('old_string and new_string must be different');
            }

            const result = await fileManager.edit(
                args.file_path,
                args.old_string,
                args.new_string,
                args.replace_all
            );
            return result;
        },
        toLLM: (result) => {
            if (result.type === 'update') {
                // Show snippet around the change
                const MAX_LINES = 50;
                const snippet = fileManager.formatWithLineNumbers(result.content, 1, MAX_LINES);
                return `The file ${result.filePath} has been edited. Here's the result:\n${snippet}`;
            }
            return `File edited successfully: ${result.filePath}`;
        }
    });
}
