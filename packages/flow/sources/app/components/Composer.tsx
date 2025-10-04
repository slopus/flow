import { Box, Text, useInput } from "ink";
import * as React from "react";

interface ComposerProps {
    placeholder?: string;
    onSubmit?: (text: string) => void;
}

export const Composer = React.memo<ComposerProps>(({
    placeholder = "Type your message...",
    onSubmit
}) => {
    const [lines, setLines] = React.useState<string[]>(['']);
    const [cursor, setCursor] = React.useState<[number, number]>([0, 0]);

    // Handle key input
    useInput((input, key) => {
        const [row, col] = cursor;
        const currentLine = lines[row];

        // Ctrl+C - Clear input
        if (key.ctrl && input === 'c') {
            setLines(['']);
            setCursor([0, 0]);
            return;
        }

        // Ctrl+A - Home (start of line)
        if (key.ctrl && input === 'a') {
            setCursor([row, 0]);
            return;
        }

        // Ctrl+E - End (end of line)
        if (key.ctrl && input === 'e') {
            setCursor([row, currentLine.length]);
            return;
        }

        // Shift+Enter sends input ending with \r but return: false - New line
        if (input && input.includes('\r') && !key.return) {
            const newLines = [...lines];
            const beforeCursor = currentLine.slice(0, col);
            const afterCursor = currentLine.slice(col);
            newLines[row] = beforeCursor;
            newLines.splice(row + 1, 0, afterCursor);
            setLines(newLines);
            setCursor([row + 1, 0]);
            return;
        }

        // Enter - Submit (return: true)
        if (key.return) {
            const text = lines.join('\n').trim();
            if (text && onSubmit) {
                onSubmit(text);
                setLines(['']);
                setCursor([0, 0]);
            }
            return;
        }

        // Backspace
        if (key.backspace || key.delete) {
            if (col > 0) {
                // Delete character before cursor
                const newLine = currentLine.slice(0, col - 1) + currentLine.slice(col);
                const newLines = [...lines];
                newLines[row] = newLine;
                setLines(newLines);
                setCursor([row, col - 1]);
            } else if (row > 0) {
                // Join with previous line
                const newLines = [...lines];
                const prevLine = newLines[row - 1];
                newLines[row - 1] = prevLine + currentLine;
                newLines.splice(row, 1);
                setLines(newLines);
                setCursor([row - 1, prevLine.length]);
            }
            return;
        }

        // Arrow keys
        if (key.leftArrow) {
            if (col > 0) {
                setCursor([row, col - 1]);
            } else if (row > 0) {
                setCursor([row - 1, lines[row - 1].length]);
            }
            return;
        }

        if (key.rightArrow) {
            if (col < currentLine.length) {
                setCursor([row, col + 1]);
            } else if (row < lines.length - 1) {
                setCursor([row + 1, 0]);
            }
            return;
        }

        if (key.upArrow) {
            if (row > 0) {
                const prevLineLength = lines[row - 1].length;
                setCursor([row - 1, Math.min(col, prevLineLength)]);
            }
            return;
        }

        if (key.downArrow) {
            if (row < lines.length - 1) {
                const nextLineLength = lines[row + 1].length;
                setCursor([row + 1, Math.min(col, nextLineLength)]);
            }
            return;
        }

        // Regular character input (filter out control characters)
        if (input && !key.ctrl && !key.meta) {
            // Remove \r and other control characters
            const cleanInput = input.replace(/[\r\n]/g, '');
            if (cleanInput) {
                const newLine = currentLine.slice(0, col) + cleanInput + currentLine.slice(col);
                const newLines = [...lines];
                newLines[row] = newLine;
                setLines(newLines);
                setCursor([row, col + cleanInput.length]);
            }
        }
    });

    const isEmpty = lines.length === 1 && lines[0] === '';
    const terminalWidth = process.stdout.columns || 120;
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
                        const [cursorRow, cursorCol] = cursor;
                        const isOnCursorLine = rowIdx === cursorRow;

                        // Handle empty lines
                        if (line.length === 0) {
                            if (isOnCursorLine) {
                                return <Text key={rowIdx} inverse> </Text>;
                            }
                            // Empty line without cursor - still needs to take up space
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