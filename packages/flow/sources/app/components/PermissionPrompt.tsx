import { Box, Text } from "ink";
import React from "react";
import { PendingPermission } from "../../store.js";
import { Engine } from "../../engine/Engine.js";
import { SelectionBox, SelectionBoxOption } from "./SelectionBox.js";
import { Tool } from "../../engine/Tool.js";

type PermissionAction = 'approve' | 'deny';

const PERMISSION_OPTIONS: SelectionBoxOption<PermissionAction>[] = [
    { value: 'approve', label: 'Approve', color: 'green' },
    { value: 'deny', label: 'Deny', color: 'red' },
];

export const PermissionPrompt = React.memo((props: { permission: PendingPermission, engine: Engine }) => {
    const { permission, engine } = props;

    const handleSelect = React.useCallback((action: PermissionAction) => {
        if (action === 'approve') {
            engine.permissionManager.approve(permission.id);
        } else {
            engine.permissionManager.deny(permission.id);
        }
    }, [permission.id, engine]);

    // Get the tool if available
    const tool = permission.tool as Tool<any, any> | undefined;

    // Render title using tool's formatTitle or default
    const titleContent = tool?.formatTitle
        ? tool.formatTitle(permission.parameters)
        : <Text bold>{permission.toolName}</Text>;

    // Render question using tool's formatQuestion or default
    const questionContent = tool?.formatQuestion
        ? tool.formatQuestion(permission.parameters)
        : (
            <>
                <Box marginBottom={1}>
                    <Text>Tool: <Text bold>{permission.toolName}</Text></Text>
                </Box>
                {Object.keys(permission.parameters).length > 0 && (
                    <Box flexDirection="column" marginBottom={1}>
                        <Text dimColor>Parameters:</Text>
                        <Text dimColor>{JSON.stringify(permission.parameters, null, 2)}</Text>
                    </Box>
                )}
            </>
        );

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={1} marginBottom={1}>
            <Box marginBottom={1} borderStyle="round" borderColor="magenta" paddingX={1}>
                {titleContent}
            </Box>
            <Box flexDirection="column" marginBottom={1}>
                {questionContent}
            </Box>
            <SelectionBox options={PERMISSION_OPTIONS} onSelect={handleSelect} defaultSelected={0} />
        </Box>
    );
});
