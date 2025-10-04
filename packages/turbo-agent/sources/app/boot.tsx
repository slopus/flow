import { createCodexProvider } from "@slopus/providers";
import { App } from "@slopus/tui";
import { render } from 'ink';

export async function boot() {

    const provider = createCodexProvider(process.env.TEST_OPENAI_TOKEN!);
    const models = await provider.models();
    const session = await provider.createSession(models[0].name);

    render(<App session={session} />);
}