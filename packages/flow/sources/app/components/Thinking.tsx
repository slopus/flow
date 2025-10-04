import { Box, Text } from 'ink';
import * as React from 'react';
import { theme } from '../theme.js';
import { Spinner } from './Spinner.jsx';

export const Thinking = React.memo((props: { text: string }) => {
    return (
        <Text wrap='truncate-end' color={theme.accent}>
            <Spinner />
            <Text>{' ' + props.text + '...'}</Text>
        </Text>
    );
});