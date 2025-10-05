import { Box, Text } from "ink";
import * as React from "react";
import { wrapText } from "@slopus/helpers";
import { useKeyboard } from "../../keyboard/useKeyboard.jsx";
import { Engine } from "../../engine/Engine.js";

interface ComposerInputProps {
    engine: Engine;
    placeholder?: string;
}

export const ComposerInputView = React.memo<ComposerInputProps>(({
    engine,
    placeholder = "Type your message..."
}) => {
    const store = engine.store();
    const { text, cursor } = store.composer;
    const terminalWidth = process.stdout.columns || 120;
    const contentWidth = terminalWidth - 2; // Account for "> " prefix

    // Calculate wrapped lines and cursor position
    const { lines, cursorRow, cursorCol } = React.useMemo(() => {
        if (text === '') {
            return { lines: [''], cursorRow: 0, cursorCol: 0 };
        }

        // Wrap text to terminal width
        const wrapped = wrapText(text, contentWidth, { trim: false, wordWrap: true });
        const wrappedLines = wrapped.split('\n');

        // Find cursor position in wrapped text
        let charCount = 0;
        let foundRow = 0;
        let foundCol = 0;

        for (let i = 0; i < wrappedLines.length; i++) {
            const lineLength = wrappedLines[i].length;
            if (charCount + lineLength >= cursor) {
                foundRow = i;
                foundCol = cursor - charCount;
                break;
            }
            charCount += lineLength + 1; // +1 for newline
        }

        // If cursor is at the very end after all text
        if (cursor >= text.length) {
            foundRow = wrappedLines.length - 1;
            foundCol = wrappedLines[foundRow].length;
        }

        return {
            lines: wrappedLines,
            cursorRow: foundRow,
            cursorCol: foundCol
        };
    }, [text, cursor, contentWidth]);

    // Handle keyboard events
    useKeyboard(React.useCallback((event) => {
        if (event.type === 'text') {
            store.composerType(event.text);
            return;
        }

        // Handle commands
        switch (event.command) {
            case 'Ctrl+A':
                store.composerSetCursor(0);
                break;
            case 'Ctrl+E':
                store.composerSetCursor(text.length);
                break;
            case 'Shift+Enter':
                store.composerType('\n');
                break;
            case 'Backspace':
                store.composerBackspace();
                break;
            case 'Delete':
                store.composerDelete();
                break;
            case 'Left':
                store.composerMoveCursor(-1);
                break;
            case 'Right':
                store.composerMoveCursor(1);
                break;
            case 'Up':
                // Move to previous line at same column position
                if (cursorRow > 0) {
                    const targetCol = Math.min(cursorCol, lines[cursorRow - 1].length);
                    let newCursor = 0;
                    for (let i = 0; i < cursorRow - 1; i++) {
                        newCursor += lines[i].length + 1;
                    }
                    newCursor += targetCol;
                    store.composerSetCursor(newCursor);
                } else {
                    store.composerSetCursor(0);
                }
                break;
            case 'Down':
                // Move to next line at same column position
                if (cursorRow < lines.length - 1) {
                    const targetCol = Math.min(cursorCol, lines[cursorRow + 1].length);
                    let newCursor = 0;
                    for (let i = 0; i <= cursorRow; i++) {
                        newCursor += lines[i].length + 1;
                    }
                    newCursor += targetCol;
                    store.composerSetCursor(newCursor);
                } else {
                    store.composerSetCursor(text.length);
                }
                break;
        }
    }, [store, text.length, cursorRow, cursorCol, lines]));

    const isEmpty = text === '';
    const separator = '─'.repeat(terminalWidth);

    return (
        <Box flexDirection="column">
            <Box>
                <Text color="gray" dimColor>{separator}</Text>
            </Box>
            <Box>
                <Text>&gt; </Text>
                <Box flexGrow={1} flexDirection="column">
                {isEmpty ? (
                    <Text>
                        <Text inverse>{placeholder.slice(0, 1)}</Text>
                        <Text color="gray">{placeholder.slice(1)}</Text>
                    </Text>
                ) : (
                    lines.map((line, rowIdx) => {
                        const isOnCursorLine = rowIdx === cursorRow;

                        // Handle empty lines
                        if (line.length === 0) {
                            if (isOnCursorLine) {
                                return <Text key={rowIdx} inverse> </Text>;
                            }
                            return <Text key={rowIdx}> </Text>;
                        }

                        if (!isOnCursorLine || cursorCol >= line.length) {
                            return (
                                <Text key={rowIdx}>
                                    {line}
                                    {isOnCursorLine && <Text inverse> </Text>}
                                </Text>
                            );
                        }

                        // Render line with cursor in the middle
                        const before = line.slice(0, cursorCol);
                        const char = line[cursorCol] || ' ';
                        const after = line.slice(cursorCol + 1);

                        return (
                            <Text key={rowIdx}>
                                {before}
                                <Text inverse>{char}</Text>
                                {after}
                            </Text>
                        );
                    })
                )}
                </Box>
            </Box>
            <Box>
                <Text color="gray" dimColor>{separator}</Text>
            </Box>
        </Box>
    );
});
