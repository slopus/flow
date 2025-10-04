import { Box, Text } from "ink";
import React from "react";
import { WelcomeBanner } from "./components/WelcomeBanner.js";
import { Composer } from "./components/Composer.js";
import { HistoryItem } from "./components/HistoryItem.js";
import { Thinking } from "./components/Thinking.jsx";
import { Engine } from "sources/engine/Engine.js";

export const App = React.memo((props: { engine: Engine }) => {
    const store = props.engine.store();

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
            />
        </Box>
    )
});