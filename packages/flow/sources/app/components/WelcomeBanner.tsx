import { trimIdent } from "@slopus/helpers";
import { Box, Text } from "ink";
import * as React from "react";
import { theme } from "../theme.js";

const text = trimIdent(`
░█░█░█▀█░█▀█░█▀█░█░█
░█▀█░█▀█░█▀▀░█▀▀░░█░
░▀░▀░▀░▀░▀░░░▀░░░░▀░
`);

// FF543A

export const WelcomeBanner = React.memo(() => {
    return (
        <Box flexDirection="row" marginTop={1}>
            {/* <Box flexDirection="column" marginRight={2}>
                {text.split('\n').map((line, index) => (
                    <Text key={index}>{line}</Text>
                ))}
            </Box>
            <Box flexDirection="column">
                <Text color={theme.accent}>Happy Coder</Text>
                <Text>v0.1.0</Text>
            </Box> */}
            <Text><Text color={theme.accent}>{'⏺'}</Text>{' '}Hello, how can I help you today?</Text>
        </Box>
    )
});