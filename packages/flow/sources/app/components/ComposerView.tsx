import * as React from "react";
import { Engine } from "sources/engine/Engine.js";
import { ComposerInputView } from "./ComposerInputView.jsx";
import { Box, Text } from "ink";
import { useKeyboard } from "sources/keyboard/useKeyboard.jsx";

export const ComposerView = React.memo((props: { engine: Engine }) => {

    const exitRequested = props.engine.store().exitRequested;

    const [mode, setMode] = React.useState<'read-only' | 'default'>('default');
    const [thinking, setThinking] = React.useState<'low' | 'medium' | 'high' | 'auto'>('auto');
    const nextMode = React.useCallback(() => {
        setMode(mode === 'read-only' ? 'default' : 'read-only');
    }, [mode]);
    const nextThinking = React.useCallback(() => {
        setThinking(thinking === 'auto' ? 'low' : thinking === 'low' ? 'medium' : thinking === 'medium' ? 'high' : 'auto');
    }, [thinking]);
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
                    nextThinking();
                    break;
                case 'Shift+Tab':
                    nextMode();
                    break;
            }
        }
    }, [props.engine, nextThinking, nextMode]));

    return (
        <Box flexDirection="column">
            <Box flexDirection="row" height={1}>
                <Box flexDirection="row" height={1} flexGrow={1} flexBasis={0}>
                    <Text>Mode: {mode}</Text>
                </Box>
                <Box flexDirection="row" height={1}>
                    <Text>{props.engine.model.displayName} {thinking}</Text>
                </Box>
            </Box>
            <ComposerInputView engine={props.engine} placeholder="Type your message..." />
            <Box flexDirection="row" height={1} marginBottom={1}>
                {exitRequested && <Text dimColor>Press {exitRequested} again to exit</Text>}
            </Box>
        </Box>
    );
});