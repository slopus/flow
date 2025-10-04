import { Box, Text } from "ink";
import React from "react";
import { WelcomeBanner } from "./components/WelcomeBanner.js";
import { Composer } from "./components/Composer.js";
import { Session } from "@slopus/providers";
import { AsyncLock } from "@slopus/helpers";
import Spinner from "ink-spinner";
import { HistoryItem } from "./components/HistoryItem.js";

export const App = React.memo((props: { session: Session }) => {

    const [history, setHistory] = React.useState<({ type: 'user', text: string } | { type: 'assistant', text: string } | { type: 'tool_call', name: string, arguments: string })[]>([]);
    const lock = React.useMemo(() => new AsyncLock(), []);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = React.useCallback((text: string) => {
        lock.inLock(async () => {
            setIsLoading(true);
            setHistory(prev => [...prev, { type: 'user', text }]);
            try {
                for await (const update of props.session.step({ text })) {
                    if (update.type === 'text') {
                        setHistory(prev => [...prev, { type: 'assistant', text: update.text }]);
                    } else if (update.type === 'tool_call') {
                        setHistory(prev => [...prev, { type: 'tool_call', name: update.name, arguments: update.arguments }]);
                    } else if (update.type === 'reasoning') {
                        // setHistory(prev => [...prev, { type: 'reasoning', text: update.text }]);
                    }
                }
            } finally {
                setIsLoading(false);
            }
        });
    }, []);

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <WelcomeBanner />
            </Box>
            {history.map((update, index) => (
                <Box key={index} marginBottom={1}>
                    <HistoryItem data={update} />
                </Box>
            ))}
            {isLoading && (
                <Box flexDirection="row" height={1} marginBottom={1}>
                    {isLoading && <Spinner />}
                    <Text>{' '}</Text>
                    {isLoading && <Text>{'Thinking...'}</Text>}
                </Box>
            )}

            <Composer
                placeholder="Type your message..."
                onSubmit={handleSubmit}
            />
        </Box>
    )
});