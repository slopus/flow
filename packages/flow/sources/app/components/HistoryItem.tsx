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
    } else if (props.data.type === 'reasoning') {
        return (
            <Box flexDirection="row">
                <Text color={theme.secondary}>{'⏺ '}</Text>
                <Box flexDirection="column" flexGrow={1}>
                    <Text color={theme.secondary}>{props.data.text}</Text>
                </Box>
            </Box>
        );
    } else if (props.data.type === 'tool_call') {
        return (
            <Box flexDirection="row">
                <Text color="gray">{'⏺ '}</Text>
                <Text>{props.data.name} {props.data.arguments}</Text>
            </Box>
        );
    } else {
        throw new Error(`Unknown history item type`);
    }
});