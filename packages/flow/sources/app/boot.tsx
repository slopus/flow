import { createCodexProvider } from "@slopus/providers";
import { render } from 'ink';
import { App } from "./App.jsx";
import { Engine } from "sources/engine/Engine.js";
import { createGlobTool } from "sources/engine/tools/Glob.js";

export async function boot() {
    const provider = createCodexProvider(process.env.TEST_OPENAI_TOKEN!);
    const tools = [createGlobTool(process.cwd())];
    const engine = new Engine([provider], tools);
    render(<App engine={engine} />);
}