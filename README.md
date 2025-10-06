<h1 align="center">
  Flow
</h1>

<h4 align="center">
Claude Code interface, re-implemented for OpenAI's GPT-5 Codex
</h4>

<div align="center">
<img width="857" height="659" alt="Screenshot 2025-10-05 at 6 58 07 PM" src="https://github.com/user-attachments/assets/5d35217b-908d-48a1-96cd-1fe534166f1d" />
</div>

<div align="center">

[⭐ **Star on GitHub**](https://github.com/slopus/flow) • [📚 **Documentation**](https://github.com/slopus/flow/blob/main/CLAUDE.md)

</div>

<h3 align="center">
Step 1: Download the binary
</h3>

<div align="center">
Coming soon - macOS, Linux, Windows
</div>

<h3 align="center">
Step 2: Set your OpenAI token
</h3>

For beta token must be provided manually, it is an access token from "auth.json" from your codex folder.
```bash
export TEST_OPENAI_TOKEN=your-codex-token
```

<h3 align="center">
Step 3: Run Flow
</h3>

```bash
./flow
```

## How does it work?

Flow is a complete re-implementation of Claude Code's terminal interface, purpose-built for OpenAI's GPT-5 Codex. It's not a wrapper or fork—every detail from SSE streaming to tool orchestration is engineered from the ground up for Codex's reasoning models. You get the same conversational, agentic AI coding experience, but optimized for Codex.

## 🔥 Why Flow?

- 🎯 **Claude Code's interface for Codex** - Same conversational flow, streaming responses, and tool calling
- 🧠 **Transparent reasoning** - See Codex's reasoning summaries as it works through problems
- ⚡ **Single binary** - One file to run anywhere. No runtime, no dependencies, no setup
- 🔧 **Agentic tools** - File pattern matching, code analysis, and more (CC-style tools)
- 🎨 **Terminal-native** - Beautiful markdown rendering, syntax highlighting, thinking indicators
- 🚀 **Blazing fast** - Built on Bun with real-time SSE streaming

## 📦 Current Status

**Currently supports:**
- ✅ **GPT-5 Codex** (high, medium, and low reasoning tiers)
- ✅ **Tool calling** (Claude Code-style tools)
- ✅ **Single binary** compiled with Bun

**Coming soon:**
- 🔄 **MCP (Model Context Protocol)** - Plugin system for extensible tools
- 🎣 **Hooks** - Customize behavior with pre/post execution hooks
- 🔌 **Multi-provider support** - Beyond Codex

## 🏠 Who We Are

From the creators of **[Happy Coder ⭐ 2.5k](https://github.com/slopus/happy)** - we're engineers who believe in building tools that scratch our own itch. Flow was born from wanting Claude Code's polished interface with Codex's cutting-edge reasoning. We built it from scratch, shared it with the community, and now you can use it too.

## 📚 Documentation & Contributing

Flow is experimental and open source. Want to contribute? The codebase is clean, well-documented, and designed for extensibility.

```bash
# Clone and build
git clone https://github.com/slopus/flow
cd flow
bun install
bun run dev
```

Questions? Issues? Contributions? Open an issue or PR.

## License

MIT License - see [LICENSE](LICENSE) for details.
