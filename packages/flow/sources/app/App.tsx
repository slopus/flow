import { Box } from "ink";
import React from "react";
import { WelcomeBanner } from "./components/WelcomeBanner.js";
import { HistoryItem } from "./components/HistoryItem.js";
import { Thinking } from "./components/Thinking.jsx";
import { Engine } from "sources/engine/Engine.js";
import { useKeyboard } from "sources/keyboard/useKeyboard.js";
import { ComposerView } from "./components/ComposerView.jsx";
// import { log } from "sources/log.js";

export const App = React.memo((props: { engine: Engine }) => {
    const store = props.engine.store();
    const [shouldExit, setShouldExit] = React.useState(false);

    // Handle global keyboard commands
    useKeyboard(React.useCallback((event) => {
        // log('keyboard event', event);
        if (event.type === 'command') {
            switch (event.command) {
                case 'Enter':
                    const text = store.composerSubmit();
                    if (text) {
                        props.engine.send(text);
                    }
                    break;
                case 'Ctrl+C':
                    if (store.requestExit('Ctrl+C')) {
                        setShouldExit(true);
                    }
                    break;
                case 'Ctrl+D':
                    if (store.requestExit('Ctrl+D')) {
                        setShouldExit(true);
                    }
                    break;
            }
        }
    }, [store, props.engine]));

    // Graceful exit
    React.useEffect(() => {
        if (shouldExit) {
            process.exit(0);
        }
    }, [shouldExit]);

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
            {!shouldExit && store.thinking && (
                <Box flexDirection="row" height={1} marginBottom={1}>
                    <Thinking text={store.thinking} />
                </Box>
            )}
            {!shouldExit && <ComposerView engine={props.engine} />}
        </Box>
    )
});