import { trimIdent } from "@slopus/helpers";
import { Box, Text } from "ink";
import * as React from "react";

const text = trimIdent(`
░█░█░█▀█░█▀█░█▀█░█░█
░█▀█░█▀█░█▀▀░█▀▀░░█░
░▀░▀░▀░▀░▀░░░▀░░░░▀░
`);

export const WelcomeBanner = React.memo(() => {
    return (
        <Box flexDirection="row" marginTop={1} marginLeft={1} marginRight={1}>
            <Box flexDirection="column" marginRight={2}>
                {text.split('\n').map((line, index) => (
                    <Text key={index}>{line}</Text>
                ))}
            </Box>
            <Box flexDirection="column">
                <Text>Happy Coder</Text>
                <Text>v0.1.0</Text>
            </Box>
        </Box>
    )
});