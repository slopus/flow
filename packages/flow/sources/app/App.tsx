import { Box } from "ink";
import React from "react";
import { WelcomeBanner } from "./components/WelcomeBanner.js";
import { HistoryItem } from "./components/HistoryItem.js";
import { Thinking } from "./components/Thinking.jsx";
import { PermissionPrompt } from "./components/PermissionPrompt.jsx";
import { Engine } from "sources/engine/Engine.js";
import { useKeyboard } from "sources/keyboard/useKeyboard.js";
import { ComposerView } from "./components/ComposerView.jsx";
// import { log } from "sources/log.js";

export const App = React.memo((props: { engine: Engine }) => {
    const store = props.engine.store();
    const [shouldExit, setShouldExit] = React.useState(false);

    // Handle global keyboard commands (only exit commands, composer handles text/enter)
    useKeyboard(React.useCallback((event) => {
        // log('keyboard event', event);

        // Skip if there's a pending permission (handled by PermissionPrompt)
        if (store.pendingPermission) {
            return;
        }

        if (event.type === 'command') {
            switch (event.command) {
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
            {!shouldExit && store.pendingPermission ? (
                <PermissionPrompt permission={store.pendingPermission} engine={props.engine} />
            ) : (
                !shouldExit && <ComposerView engine={props.engine} />
            )}
        </Box>
    )
});