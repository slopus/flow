import { searchFiles } from './fileSearch.js';

export interface Suggestion {
    value: string;
    description?: string;
    type?: 'command' | 'file';
}

const SLASH_COMMANDS: Suggestion[] = [
    { value: '/clear', description: 'Clear the conversation history', type: 'command' },
    { value: '/exit', description: 'Exit the application', type: 'command' },
];

/**
 * Provides autocomplete suggestions based on the active word
 * @param activeWord The active word detected at cursor position (e.g., "/cl", "@user")
 * @returns Array of suggestions or empty array if no matches
 */
export async function autocompleteProvider(activeWord: string): Promise<Suggestion[]> {
    // Handle slash commands
    if (activeWord.startsWith('/')) {
        const query = activeWord.substring(1).toLowerCase();

        // If just the slash, return all commands
        if (query === '') {
            return SLASH_COMMANDS;
        }

        // Filter commands by prefix match
        return SLASH_COMMANDS.filter(cmd =>
            cmd.value.substring(1).toLowerCase().startsWith(query)
        );
    }

    // Handle file mentions
    if (activeWord.startsWith('@')) {
        const query = activeWord.substring(1);

        const files = await searchFiles(query, { limit: 10 });
        return files.map(file => ({
            value: '@' + file.fullPath,
            description: file.fileType === 'folder' ? 'folder' : undefined,
            type: 'file' as const
        }));
    }

    // No suggestions for other prefixes yet
    return [];
}
