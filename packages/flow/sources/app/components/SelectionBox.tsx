import { Box, Text } from "ink";
import React from "react";
import { useKeyboard } from "../../keyboard/useKeyboard.js";

export type SelectionBoxOption<T = string> = {
    value: T;
    label: string;
    color?: string;
};

export type SelectionBoxProps<T = string> = {
    options: SelectionBoxOption<T>[];
    onSelect: (value: T) => void;
    defaultSelected?: number;
};

export function SelectionBox<T = string>(props: SelectionBoxProps<T>) {
    const { options, onSelect, defaultSelected = 0 } = props;
    const [selectedIndex, setSelectedIndex] = React.useState(defaultSelected);

    useKeyboard(React.useCallback((event) => {
        if (event.type === 'command') {
            if (event.command === 'Up') {
                setSelectedIndex((prev) => Math.max(0, prev - 1));
            } else if (event.command === 'Down') {
                setSelectedIndex((prev) => Math.min(options.length - 1, prev + 1));
            } else if (event.command === 'Enter') {
                onSelect(options[selectedIndex].value);
            }
        }
    }, [selectedIndex, options, onSelect]));

    return (
        <Box flexDirection="column">
            {options.map((option, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <Box key={index}>
                        <Text color={isSelected ? option.color : undefined}>
                            {isSelected ? '> ' : '  '}
                            {option.label}
                        </Text>
                    </Box>
                );
            })}
        </Box>
    );
}
