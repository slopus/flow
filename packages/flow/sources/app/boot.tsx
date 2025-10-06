import { createCodexProvider } from "@slopus/providers";
import { render } from 'ink';
import { App } from "./App.jsx";
import { Engine } from "sources/engine/Engine.js";
import { createGlobTool } from "sources/engine/tools/createGlobTool.js";
import { KeyboardProvider } from "sources/keyboard/useKeyboard.js";
import { createReadTool } from "sources/engine/tools/createReadTool.js";
import { createWriteTool } from "sources/engine/tools/createWriteTool.js";
import { createEditTool } from "sources/engine/tools/createEditTool.js";
import { OperationMode } from "sources/engine/OperationMode.js";

export async function boot() {
    const provider = createCodexProvider(process.env.TEST_OPENAI_TOKEN!);
    const modes: OperationMode[] = [
        {
            slug: "default",
            name: "Default",
            description: "allow read-only commands",
            icon: "⏵⏵",
            color: "#A989F7",
            bypassPermissions: false,
            allowEdits: false,
            allowReadOnly: true
        },
        {
            slug: "allow-edits",
            name: "Allow all edits",
            description: "allow edits",
            icon: "⏵⏵",
            color: "#A989F7",
            bypassPermissions: false,
            allowEdits: true,
            allowReadOnly: true
        },
        {
            slug: 'plan',
            name: "Plan Mode",
            description: "plan mode on",
            icon: "꓿",
            color: "#729F9C",
            bypassPermissions: false,
            allowEdits: true,
            allowReadOnly: true
        },
        {
            slug: 'yolo',
            name: "YOLO",
            description: "bypass all permissions",
            icon: "∞",
            color: "#FF543A",
            bypassPermissions: true,
            allowEdits: true,
            allowReadOnly: true
        }
    ];

    const engine = new Engine(process.cwd(), [provider], modes);
    engine.addTool(createGlobTool(engine));
    engine.addTool(createReadTool(engine.fileManager));
    engine.addTool(createWriteTool(engine.fileManager));
    engine.addTool(createEditTool(engine.fileManager));
    render(
        <KeyboardProvider>
            <App engine={engine} />
        </KeyboardProvider>,
        {
            exitOnCtrlC: false
        }
    );
}