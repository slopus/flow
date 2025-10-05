import { z } from 'zod';
import { tool } from '../Tool.js';
import { FileManager } from '../FileManager.js';
import React from 'react';
import { Text, Box } from 'ink';

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
        },
        formatTitle: (args) => {
            return <Text bold>Edit file</Text>;
        },
        formatQuestion: (args) => {
            const MAX_PREVIEW = 100;
            const oldPreview = args.old_string.length > MAX_PREVIEW
                ? args.old_string.substring(0, MAX_PREVIEW) + '...'
                : args.old_string;
            const newPreview = args.new_string.length > MAX_PREVIEW
                ? args.new_string.substring(0, MAX_PREVIEW) + '...'
                : args.new_string;

            return (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text bold>{args.file_path}</Text>
                    </Box>
                    <Box flexDirection="column" marginBottom={1}>
                        <Text dimColor>Replace{args.replace_all ? ' all occurrences' : ''}:</Text>
                        <Box flexDirection="column" borderStyle="round" borderColor="red" paddingX={1}>
                            <Text color="red">{oldPreview}</Text>
                        </Box>
                    </Box>
                    <Box flexDirection="column">
                        <Text dimColor>With:</Text>
                        <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1}>
                            <Text color="green">{newPreview}</Text>
                        </Box>
                    </Box>
                </Box>
            );
        }
    });
}
