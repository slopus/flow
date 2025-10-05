import { Box, Text } from "ink";
import React from "react";
import { PendingPermission } from "../../store.js";
import { Engine } from "../../engine/Engine.js";
import { useKeyboard } from "../../keyboard/useKeyboard.js";

export const PermissionPrompt = React.memo((props: { permission: PendingPermission, engine: Engine }) => {
    const { permission, engine } = props;
    const [selected, setSelected] = React.useState<'approve' | 'deny'>('approve');

    useKeyboard(React.useCallback((event) => {
        if (event.type === 'command') {
            if (event.command === 'Up') {
                setSelected('approve');
            } else if (event.command === 'Down') {
                setSelected('deny');
            } else if (event.command === 'Enter') {
                if (selected === 'approve') {
                    engine.permissionManager.approve(permission.id);
                } else {
                    engine.permissionManager.deny(permission.id);
                }
            }
        }
    }, [selected, permission.id, engine]));

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1} marginBottom={1}>
            <Box marginBottom={1}>
                <Text bold color="yellow">⚠ Permission Required</Text>
            </Box>
            <Box marginBottom={1}>
                <Text>Tool: <Text bold>{permission.toolName}</Text></Text>
            </Box>
            {Object.keys(permission.parameters).length > 0 && (
                <Box flexDirection="column" marginBottom={1}>
                    <Text dimColor>Parameters:</Text>
                    <Text dimColor>{JSON.stringify(permission.parameters, null, 2)}</Text>
                </Box>
            )}
            <Box flexDirection="column">
                <Box>
                    <Text color={selected === 'approve' ? 'green' : undefined}>
                        {selected === 'approve' ? '> ' : '  '}
                        Approve
                    </Text>
                </Box>
                <Box>
                    <Text color={selected === 'deny' ? 'red' : undefined}>
                        {selected === 'deny' ? '> ' : '  '}
                        Deny
                    </Text>
                </Box>
            </Box>
        </Box>
    );
});
