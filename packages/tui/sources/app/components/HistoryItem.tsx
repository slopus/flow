import { Text } from "ink";
import * as React from "react";

// var KO = hA.platform === "darwin" ? "⏺" : "●";

export const HistoryItem = React.memo((props: {
    data: { type: 'user', text: string } | { type: 'assistant', text: string } | { type: 'tool_call', name: string, arguments: string }
}) => {
    if (props.data.type === 'user') {
        return <Text color="gray">{'> '}{props.data.text}</Text>;
    } else if (props.data.type === 'assistant') {
        return <Text>{'⏺ '}{props.data.text}</Text>;
    } else if (props.data.type === 'tool_call') {
        return <Text><Text color="gray">{'⏺'}</Text>{' ' + props.data.name} {props.data.arguments}</Text>;
    } else {
        throw new Error(`Unknown history item type`);
    }
});