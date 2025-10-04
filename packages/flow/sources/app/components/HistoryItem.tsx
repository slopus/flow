import { Box, Text } from "ink";
import * as React from "react";
import { theme } from "../theme.js";
import { MarkdownView } from "./MarkdownView.js";
import { HistoryRecord } from "sources/engine/store.js";

// var KO = hA.platform === "darwin" ? "⏺" : "●";

export const HistoryItem = React.memo((props: {
    data: HistoryRecord
}) => {
    if (props.data.type === 'user') {
        return (
            <Box flexDirection="row">
                <Text color="gray">{'> '}</Text>
                <Text>{props.data.text}</Text>
            </Box>
        );
    } else if (props.data.type === 'assistant') {
        return (
            <Box flexDirection="row">
                <Text color={theme.accent}>{'⏺ '}</Text>
                <Box flexDirection="column" flexGrow={1}>
                    <MarkdownView content={props.data.text} />
                </Box>
            </Box>
        );
    } else if (props.data.type === 'tool_call') {
        return (
            <Box flexDirection="row">
                <Text color="gray">{'⏺ '}</Text>
                <Text>{props.data.name} {JSON.stringify(props.data.arguments)}</Text>
            </Box>
        );
    } else if (props.data.type === 'debug') {
        return (
            <Box flexDirection="row">
                <Text color="gray">{'⏺ '}</Text>
                <Text color="gray">{props.data.text}</Text>
            </Box>
        );
    } else {
        throw new Error(`Unknown history item type`);
    }
});