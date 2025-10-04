import { createCodexProvider } from "@slopus/providers";
import { render } from 'ink';
import { App } from "./App.jsx";
import { Engine } from "sources/engine/Engine.js";

export async function boot() {
    const provider = createCodexProvider(process.env.TEST_OPENAI_TOKEN!);
    const engine = new Engine([provider]);
    render(<App engine={engine} />);
}