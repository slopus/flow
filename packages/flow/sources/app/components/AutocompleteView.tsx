import { Box, Text } from "ink";
import * as React from "react";
import { Suggestion } from "../../autocomplete/autocompleteProvider.js";

interface AutocompleteViewProps {
    suggestions: Suggestion[];
    selectedIndex: number;
}

export const AutocompleteView = React.memo<AutocompleteViewProps>(({ suggestions, selectedIndex }) => {
    if (suggestions.length === 0) {
        return null;
    }

    return (
        <Box flexDirection="column" paddingLeft={2}>
            {suggestions.map((suggestion, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <Box key={suggestion.value} flexDirection="row">
                        <Text color={isSelected ? "cyan" : "gray"}>
                            {isSelected ? '▶ ' : '  '}
                        </Text>
                        <Text color={isSelected ? "cyan" : undefined}>
                            {suggestion.value}
                        </Text>
                        {suggestion.description && (
                            <Text color="gray" dimColor>
                                {' — '}{suggestion.description}
                            </Text>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
});
