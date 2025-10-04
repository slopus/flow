import { Box, Text } from "ink";
import React from "react";
import { WelcomeBanner } from "./components/WelcomeBanner.js";
import { Composer } from "./components/Composer.js";
import { HistoryItem } from "./components/HistoryItem.js";
import { Thinking } from "./components/Thinking.jsx";
import { Engine } from "sources/engine/Engine.js";

export const App = React.memo((props: { engine: Engine }) => {
    const store = props.engine.store();
    const [mode, setMode] = React.useState<'read-only' | 'default'>('default');
    const [thinking, setThinking] = React.useState<'low' | 'medium' | 'high' | 'auto'>('auto');
    const nextMode = React.useCallback(() => {
        setMode(mode === 'read-only' ? 'default' : 'read-only');
    }, [mode]);
    const nextThinking = React.useCallback(() => {
        setThinking(thinking === 'auto' ? 'low' : thinking === 'low' ? 'medium' : thinking === 'medium' ? 'high' : 'auto');
    }, [thinking]);

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <WelcomeBanner />
            </Box>
            <Box flexDirection="column">
                {store.history.map((update, index) => (
                    <Box key={index} marginBottom={1}>
                        <HistoryItem data={update} />
                    </Box>
                ))}
            </Box>
            {store.thinking && (
                <Box flexDirection="row" height={1} marginBottom={1}>
                    <Thinking text={store.thinking} />
                </Box>
            )}

            <Composer
                placeholder="Type your message..."
                onSubmit={props.engine.send}
                onShiftTab={nextMode}
                onTab={nextThinking}
            />
            <Box flexDirection="row" height={1} marginBottom={1}>
                <Box flexDirection="row" height={1} flexGrow={1} flexBasis={0}>
                    <Text>Mode: {mode}</Text>
                </Box>
                <Box flexDirection="row" height={1}>
                    <Text>{props.engine.model.displayName} {thinking}</Text>
                </Box>
            </Box>
        </Box>
    )
});