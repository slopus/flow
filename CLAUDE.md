# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Turbo** is an early-stage monorepo project using Bun as the runtime. The project is currently in transition - the git history shows removal of Tauri (Rust) and React frontend components, with the codebase being restructured.

Currently contains:
- **turbo-agent** - A minimal package in `packages/turbo-agent/` with a single TypeScript entry point

## Technology Stack

- **Runtime**: Bun (not Node.js)
- **Language**: TypeScript with strict mode enabled
- **Package Manager**: Bun (use `bun` commands, not `npm` or `yarn`)
- **Workspace**: Yarn workspaces configuration (despite using Bun)
- **AI SDK**: Vercel AI SDK with Anthropic provider
- **AI Model**: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929) - same model as Claude Code

## Commands

### Development
```bash
bun run dev          # Run the turbo-agent entry point (packages/turbo-agent/sources/index.ts)
```

### Package Management
```bash
bun install          # Install dependencies
bun add <package>    # Add a dependency
```

### Testing
```bash
bun test             # Run tests (always use bun for testing)
```

## Project Structure

```
turbo/
├── packages/
│   └── turbo-agent/          # Main agent package
│       ├── sources/          # TypeScript source files
│       │   ├── providers/    # AI model providers
│       │   │   └── claude.ts # Claude provider configuration
│       │   └── index.ts      # Entry point
│       ├── package.json
│       └── tsconfig.json
├── package.json              # Root workspace configuration
└── tsconfig.json             # Root TypeScript config
```

## AI SDK Usage

The project uses Vercel's AI SDK with Anthropic's Claude models. Available providers are in `packages/turbo-agent/sources/providers/claude.ts`:

- **claudeCode** - Claude Sonnet 4.5 (same as Claude Code)
- **claudeSonnet** - Claude Sonnet 3.5
- **claudeOpus** - Claude Opus 4

Environment variable required:
```bash
export ANTHROPIC_API_KEY=your_api_key
```

## Code Standards

- **Indentation**: 4 spaces (as per global CLAUDE.md)
- **TypeScript**: Strict mode enabled, no `any` types
- **Module System**: ES modules with `"type": "module"`
- **Target**: ESNext with nodenext module resolution

## Development Notes

- The project uses Bun-specific types via `bun-types` package
- Source files are in `sources/` directories (not `src/`)
- TypeScript configs include `jsx: preserve` even though no JSX currently exists
- Git status shows this is a fresh restructure with many deleted Tauri/React files
