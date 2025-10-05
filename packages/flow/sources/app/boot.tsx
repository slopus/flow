import { createCodexProvider } from "@slopus/providers";
import { render } from 'ink';
import { App } from "./App.jsx";
import { Engine } from "sources/engine/Engine.js";
import { createGlobTool } from "sources/engine/tools/createGlobTool.js";
import { KeyboardProvider } from "sources/keyboard/useKeyboard.js";
import { createReadTool } from "sources/engine/tools/createReadTool.js";
import { createWriteTool } from "sources/engine/tools/createWriteTool.js";
import { createEditTool } from "sources/engine/tools/createEditTool.js";

export async function boot() {
    const provider = createCodexProvider(process.env.TEST_OPENAI_TOKEN!);

    const engine = new Engine(process.cwd(), [provider]);
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