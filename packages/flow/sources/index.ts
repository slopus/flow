import { boot } from "./app/boot.js";

const token = process.env.TEST_OPENAI_TOKEN;

if (!token) {
    throw new Error('TEST_OPENAI_TOKEN not found in environment');
}

boot();



// // Terminal size handler
// function printTerminalSize() {
//     const columns = process.stdout.columns || 0;
//     const rows = process.stdout.rows || 0;
//     console.log(`Terminal size: ${columns} columns × ${rows} rows`);
// }

// // Print initial size
// printTerminalSize();

// // Listen for resize events
// process.stdout.on('resize', () => {
//     console.log('Terminal resized!');
//     printTerminalSize();
// });

// const provider = createCodexProvider(token);
// const models = await provider.models();
// const session = await provider.createSession(models[0].name);

// const shellTool: ToolDefinition = {
//     name: 'shell',
//     description: 'Runs a shell command and returns its output.',
//     parameters: z.object({
//         command: z.array(z.string()).describe('The command to execute'),
//         justification: z.string().optional().describe('Only set if with_escalated_permissions is true. 1-sentence explanation of why we want to run this command.'),
//         timeout_ms: z.number().optional().describe('The timeout for the command in milliseconds'),
//         with_escalated_permissions: z.boolean().optional().describe('Whether to request escalated permissions. Set to true if command needs to be run without sandbox restrictions'),
//         workdir: z.string().optional().describe('The working directory to execute the command in')
//     })
// }

// const writeTool: ToolDefinition = {
//     name: 'write',
//     description: 'Writes a file to the filesystem. Always use this tool when writing files, rather than using the shell command to run a custom command.',
//     parameters: z.object({
//         path: z.string().describe('The path to the file to write'),
//         content: z.string().describe('The content to write to the file')
//     })
// }

// for await (const update of session.step({ text: 'What is 2 + 2?' })) {
//     console.log(update);
// }

// for await (const update of session.step({ text: 'And multiply by pi' })) {
//     console.log(update);
// }

// for await (const update of session.step({ text: 'Write result to a file out.txt', tools: [shellTool, writeTool] })) {
//     console.log(update);
// }

// while (true) {
//     await new Promise(resolve => setTimeout(resolve, 1000));
// }