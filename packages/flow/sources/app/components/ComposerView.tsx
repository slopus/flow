import * as React from "react";
import { Engine } from "sources/engine/Engine.js";
import { ComposerInputView } from "./ComposerInputView.jsx";
import { Box, Text } from "ink";
import { useKeyboard } from "sources/keyboard/useKeyboard.jsx";
import { findActiveWord, textWrap, suggestionApply } from "@slopus/helpers";
import { autocompleteProvider, Suggestion } from "../../autocomplete/autocompleteProvider.js";
import { AutocompleteView } from "./AutocompleteView.jsx";

export const ComposerView = React.memo((props: { engine: Engine }) => {
    const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [previousActiveWord, setPreviousActiveWord] = React.useState<string | null>(null);

    const exitRequested = props.engine.store().exitRequested;
    const mode = props.engine.store().mode;
    const knownModes = props.engine.store().knownModes;
    const composer = props.engine.store().composer;

    const nextMode = React.useCallback(() => {
        const currentIndex = knownModes.findIndex(m => m.slug === mode.slug);
        const nextIndex = (currentIndex + 1) % knownModes.length;
        props.engine.store.getState().setMode(knownModes[nextIndex].slug);
    }, [props.engine, mode, knownModes]);

    // Detect active word changes and fetch suggestions
    React.useEffect(() => {
        const activeWordResult = findActiveWord(
            composer.text,
            { start: composer.cursor, end: composer.cursor },
            ['/', '@']
        );

        const currentActiveWord = activeWordResult?.activeWord || null;

        // Only fetch if active word changed from null to non-null or changed value
        if (currentActiveWord !== previousActiveWord) {
            setPreviousActiveWord(currentActiveWord);

            if (currentActiveWord === null) {
                setSuggestions([]);
                setSelectedIndex(0);
            } else {
                // Fetch suggestions asynchronously
                autocompleteProvider(currentActiveWord).then(newSuggestions => {
                    setSuggestions(newSuggestions);
                    setSelectedIndex(0);
                });
            }
        }
    }, [composer.text, composer.cursor, previousActiveWord]);

    const hasAutocomplete = suggestions.length > 0;

    useKeyboard(React.useCallback((event) => {
        const store = props.engine.store.getState();

        // Handle text input
        if (event.type === 'text') {
            store.composerType(event.text);
            return;
        }

        // Handle autocomplete-specific keys first
        if (hasAutocomplete) {
            switch (event.command) {
                case 'Up':
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
                    return;
                case 'Down':
                    setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
                    return;
                case 'Tab':
                    // Tab: Always apply suggestion to input
                    const tabSuggestion = suggestions[selectedIndex];
                    if (tabSuggestion) {
                        const result = suggestionApply(
                            composer.text,
                            { start: composer.cursor, end: composer.cursor },
                            tabSuggestion.value,
                            ['/', '@'],
                            true
                        );
                        store.composerType(result.text.substring(composer.text.length));
                        store.composerSetCursor(result.cursorPosition);
                        setSuggestions([]);
                        setSelectedIndex(0);
                        setPreviousActiveWord(null);
                    }
                    return;
                case 'Enter':
                    // Enter: Execute command if it's a command, otherwise apply to input
                    const enterSuggestion = suggestions[selectedIndex];
                    if (enterSuggestion) {
                        if (enterSuggestion.type === 'command') {
                            // Execute command
                            const command = enterSuggestion.value;
                            if (command === '/exit') {
                                process.exit(0);
                            } else if (command === '/clear') {
                                store.clearHistory();
                            }
                            // Clear composer and autocomplete
                            store.composerReset();
                            setSuggestions([]);
                            setSelectedIndex(0);
                            setPreviousActiveWord(null);
                        } else {
                            // Apply to input for non-command suggestions (files, etc.)
                            const result = suggestionApply(
                                composer.text,
                                { start: composer.cursor, end: composer.cursor },
                                enterSuggestion.value,
                                ['/', '@'],
                                true
                            );
                            store.composerType(result.text.substring(composer.text.length));
                            store.composerSetCursor(result.cursorPosition);
                            setSuggestions([]);
                            setSelectedIndex(0);
                            setPreviousActiveWord(null);
                        }
                    }
                    return;
            }
        }

        // Normal keyboard handling
        const terminalWidth = process.stdout.columns || 120;
        const contentWidth = terminalWidth - 2; // Account for "> " prefix

        switch (event.command) {
            case 'Ctrl+A':
                store.composerSetCursor(0);
                break;
            case 'Ctrl+E':
                store.composerSetCursor(composer.text.length);
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
            case 'Up': {
                // Fresh wrapping to calculate cursor position
                if (composer.text === '') {
                    store.composerSetCursor(0);
                    break;
                }

                const wrapped = textWrap(composer.text, contentWidth, { trim: false, wordWrap: true });
                const wrappedLines = wrapped.split('\n');

                // Find current cursor position in wrapped text
                let charCount = 0;
                let cursorRow = 0;
                let cursorCol = 0;

                for (let i = 0; i < wrappedLines.length; i++) {
                    const lineLength = wrappedLines[i].length;
                    if (charCount + lineLength >= composer.cursor) {
                        cursorRow = i;
                        cursorCol = composer.cursor - charCount;
                        break;
                    }
                    charCount += lineLength + 1; // +1 for newline
                }

                if (composer.cursor >= composer.text.length) {
                    cursorRow = wrappedLines.length - 1;
                    cursorCol = wrappedLines[cursorRow].length;
                }

                // Move to previous line at same column position
                if (cursorRow > 0) {
                    const targetCol = Math.min(cursorCol, wrappedLines[cursorRow - 1].length);
                    let newCursor = 0;
                    for (let i = 0; i < cursorRow - 1; i++) {
                        newCursor += wrappedLines[i].length + 1;
                    }
                    newCursor += targetCol;
                    store.composerSetCursor(newCursor);
                } else {
                    store.composerSetCursor(0);
                }
                break;
            }
            case 'Down': {
                // Fresh wrapping to calculate cursor position
                if (composer.text === '') {
                    store.composerSetCursor(0);
                    break;
                }

                const wrapped = textWrap(composer.text, contentWidth, { trim: false, wordWrap: true });
                const wrappedLines = wrapped.split('\n');

                // Find current cursor position in wrapped text
                let charCount = 0;
                let cursorRow = 0;
                let cursorCol = 0;

                for (let i = 0; i < wrappedLines.length; i++) {
                    const lineLength = wrappedLines[i].length;
                    if (charCount + lineLength >= composer.cursor) {
                        cursorRow = i;
                        cursorCol = composer.cursor - charCount;
                        break;
                    }
                    charCount += lineLength + 1; // +1 for newline
                }

                if (composer.cursor >= composer.text.length) {
                    cursorRow = wrappedLines.length - 1;
                    cursorCol = wrappedLines[cursorRow].length;
                }

                // Move to next line at same column position
                if (cursorRow < wrappedLines.length - 1) {
                    const targetCol = Math.min(cursorCol, wrappedLines[cursorRow + 1].length);
                    let newCursor = 0;
                    for (let i = 0; i <= cursorRow; i++) {
                        newCursor += wrappedLines[i].length + 1;
                    }
                    newCursor += targetCol;
                    store.composerSetCursor(newCursor);
                } else {
                    store.composerSetCursor(composer.text.length);
                }
                break;
            }
            case 'Enter':
                const text = store.composerSubmit();
                if (text) {
                    props.engine.send(text);
                }
                break;
            case 'Tab':
                // nextThinking();
                break;
            case 'Shift+Tab':
                nextMode();
                break;
        }
    }, [props.engine, nextMode, hasAutocomplete, suggestions, selectedIndex, composer]));

    return (
        <Box flexDirection="column" width={'100%'} alignItems="stretch">
            <ComposerInputView engine={props.engine} placeholder="Type your message..." />
            {hasAutocomplete && (
                <AutocompleteView suggestions={suggestions} selectedIndex={selectedIndex} />
            )}
            {!hasAutocomplete && (
                <Box flexDirection="row" height={1} width={'100%'}>
                    {exitRequested && (
                        <Text dimColor>{'  '}Press {exitRequested} again to exit</Text>
                    )}
                    {!exitRequested && (
                        <>
                            <Box flexDirection="row" flexGrow={1} flexBasis={0}>
                                {mode.slug !== 'default' && (
                                    <Text color={mode.color}>
                                        <Text>{'  '}{mode.icon}{' '}</Text>
                                        <Text>{mode.description}</Text>
                                        <Text dimColor> (shift+tab to cycle)</Text>
                                    </Text>
                                )}
                            </Box>
                            <Box flexDirection="row" height={1} alignItems="flex-end">
                                <Text>{props.engine.model.displayName}</Text>
                            </Box>
                        </>
                    )}
                </Box>
            )}
        </Box>
    );
});