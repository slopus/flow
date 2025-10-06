import * as React from "react";
import { Engine } from "sources/engine/Engine.js";
import { ComposerInputView } from "./ComposerInputView.jsx";
import { Box, Text } from "ink";
import { useKeyboard } from "sources/keyboard/useKeyboard.jsx";

export const ComposerView = React.memo((props: { engine: Engine }) => {

    const exitRequested = props.engine.store().exitRequested;
    const mode = props.engine.store().mode;
    const knownModes = props.engine.store().knownModes;
    const nextMode = React.useCallback(() => {
        const currentIndex = knownModes.findIndex(m => m.slug === mode.slug);
        const nextIndex = (currentIndex + 1) % knownModes.length;
        props.engine.store.getState().setMode(knownModes[nextIndex].slug);
    }, [props.engine, mode, knownModes]);
    useKeyboard(React.useCallback((event) => {
        // log('keyboard event', event);
        if (event.type === 'command') {
            switch (event.command) {
                case 'Enter':
                    const text = props.engine.store.getState().composerSubmit();
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
        }
    }, [props.engine, nextMode]));

    return (
        <Box flexDirection="column" width={'100%'} alignItems="stretch">
            <ComposerInputView engine={props.engine} placeholder="Type your message..." />
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
        </Box>
    );
});