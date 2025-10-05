# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Flow** is an experimental terminal-based AI agent interface built with Bun and React (via Ink). The project enables conversational interaction with OpenAI's GPT-5 Codex models through a custom provider implementation, featuring real-time streaming responses, tool calling, and reasoning summaries.

## Technology Stack

- **Runtime**: Bun (not Node.js) - all commands use `bun`
- **Language**: TypeScript with strict mode enabled
- **UI**: React via Ink (terminal UI rendering)
- **State Management**: Zustand for reactive UI state
- **AI Integration**: Custom OpenAI Codex API client with SSE streaming
- **Schema Validation**: Zod v4 for runtime type validation
- **Workspace**: Bun workspaces with three packages

## Commands

### Development
```bash
bun run dev          # Start the Flow terminal UI
```

### Type Checking
```bash
# In packages/providers/
bun run typecheck    # TypeScript type checking (no build output)
```

### Testing
```bash
bun test             # Run tests (always use bun for testing)
```

### Formatting
```bash
bun run format       # Format code with Prettier
```

## Project Structure

The monorepo contains three packages:

### `packages/flow` - Main Terminal UI Application
- **Entry point**: `sources/index.ts` (requires `TEST_OPENAI_TOKEN` env var)
- **Core components**:
  - `sources/engine/Engine.ts` - Main orchestration engine managing models, sessions, and tools
  - `sources/app/App.tsx` - Root Ink component with history, thinking indicator, and composer
  - `sources/store.ts` - Zustand store for UI state (history, thinking status, model info)
- **UI components** (`sources/app/components/`):
  - `Composer.tsx` - Input field for user messages
  - `HistoryItem.tsx` - Renders user/assistant/tool call messages
  - `Thinking.tsx` - Animated thinking indicator with reasoning text
  - `WelcomeBanner.tsx` - Startup banner
  - `MarkdownView.tsx` - Markdown rendering in terminal

### `packages/providers` - AI Model Provider Abstraction
- **Core abstraction**:
  - `sources/types/ModelProvider.ts` - Provider interface for multi-model support
  - `sources/types/Session.ts` - Session interface for conversational state
  - `sources/types/StepArguments.ts` - Tool definitions and step parameters
- **Codex implementation** (`sources/codex/`):
  - `CodexProvider.ts` - Provider for GPT-5 Codex (high/medium/low reasoning tiers)
  - `CodexSession.ts` - Session implementation with SSE streaming
  - `api/responses.ts` - SSE parsing, request handling, and comprehensive Zod schemas
  - `api/zodToSchema.ts` - Converts Zod schemas to JSON Schema for tool parameters
  - `api/instructions.ts` - System instructions sent to Codex API

### `packages/helpers` - Shared Utilities
- `sources/async/` - Async utilities (lock, time, sync)
- `sources/objects/` - Object utilities (deepEqual, deterministicJson)
- `sources/text/` - Text utilities (trimIdent)

## Architecture Overview

### Engine System
The `Engine` class is the core orchestrator:
- **Model Management**: Maintains a priority-sorted map of available models from providers
- **Session Management**: Creates and manages sessions for the current model
- **Tool Execution**: Executes tool calls, handles results, and queues them for LLM
- **State Synchronization**: Updates Zustand store with history and thinking status
- **Async Queue**: Processes pending messages and tool calls sequentially

### Session Flow
1. User sends message via `Engine.send(text)`
2. Message added to pending queue, engine starts thinking
3. `Session.step()` streams SSE events from Codex API
4. Events update UI state: text deltas, tool calls, reasoning summaries
5. Tool calls queued for execution, results fed back into next step
6. Engine continues until no pending messages/tool calls remain

### Tool System
Tools follow a generic interface defined in `sources/engine/Tool.ts`:
- **Type-safe**: Zod schemas for parameters and return types
- **Async execution**: Tools return promises for their results
- **LLM formatting**: `toLLM()` converts results to strings for the model
- **Conditional**: `isEnabled()` allows runtime tool availability checks

Current tools:
- `Glob.ts` - File pattern matching tool

### Provider Architecture
Providers abstract different AI model backends:
- **Multi-model support**: Each provider can expose multiple models
- **Unified interface**: All models accessed through same `Session.step()` API
- **Streaming**: Callback-based SSE event handling for real-time updates
- **Tool calling**: Providers handle tool definition conversion (Zod → JSON Schema)

### Codex API Integration
Custom SSE client for OpenAI's Codex API:
- **Authentication**: JWT token with account ID extraction
- **Streaming**: Full SSE event parsing with Zod validation
- **Reasoning**: Captures encrypted reasoning content and summaries
- **Web search**: Integrated web search tool support
- **Tool calling**: Function call orchestration with arguments streaming

## Development Notes

- **Source directories**: Use `sources/` not `src/` (consistent across all packages)
- **Module resolution**: ESNext with `nodenext` module resolution
- **React in terminal**: Ink uses React 19 for declarative terminal UIs
- **Env variables**: `TEST_OPENAI_TOKEN` required for Codex API access
- **Bun-specific**: Uses `bun-types` for Bun runtime APIs
- **No build step**: TypeScript runs directly via Bun, no compilation needed

## Code Standards

- **Indentation**: 4 spaces (as per global CLAUDE.md)
- **TypeScript**: Strict mode enabled, no `any` types
- **Module system**: ES modules with `"type": "module"`
- **Exports**: Packages export via `sources/index.ts`
- **Testing**: Test files colocated with `.test.ts` or `.spec.ts` extensions
