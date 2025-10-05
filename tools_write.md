# Write Tool - Detailed Specification

This document provides a comprehensive specification for the **Write** tool that can be used to replicate its behavior.

## Overview

The Write tool creates new files or overwrites existing files on the local filesystem. It enforces strict read-before-write semantics and includes intelligent diff generation.

## Tool Definition

### Basic Properties

- **Name**: `Write`
- **User Facing Name**: `Write`
- **Description**: "Write a file to the local filesystem."
- **Concurrency Safe**: `false`
- **Read Only**: `false`
- **Category**: EDIT

### Input Schema

```typescript
{
    file_path: string;  // Absolute path to file to write (must be absolute, not relative)
    content: string;    // The content to write to the file
}
```

**Validation Rules**:
- `file_path` must be an absolute path
- `content` is any string value

### Output Schema

```typescript
{
    type: "create" | "update";           // Whether file was created or updated
    filePath: string;                     // Path to the file that was written
    content: string;                      // Content that was written to the file
    structuredPatch: Array<PatchHunk>;   // Diff patch showing the changes
}
```

Where `PatchHunk` is:
```typescript
{
    oldStart: number;    // Starting line in old file
    oldLines: number;    // Number of lines in old file section
    newStart: number;    // Starting line in new file
    newLines: number;    // Number of lines in new file section
    lines: string[];     // Diff lines (prefixed with ' ', '-', '+')
}
```

## Execution Flow

### 1. Input Validation (`validateInput`)

The validation happens in two phases: pre-execution validation and runtime validation.

#### Pre-execution Validation

1. **Check if file is in ignored directory**
   ```typescript
   if (isFileInIgnoredDirectory(absolutePath)) {
       return {
           result: false,
           message: "File is in a directory that is ignored by your project configuration.",
           errorCode: 1
       };
   }
   ```

2. **For new files (file doesn't exist)**
   ```typescript
   if (!fs.existsSync(absolutePath)) {
       return { result: true };  // Allow creation
   }
   ```

3. **For existing files - Check if file has been read**
   ```typescript
   const readState = readFileState.get(absolutePath);
   if (!readState) {
       return {
           result: false,
           message: "File has not been read yet. Read it first before writing to it.",
           errorCode: 2
       };
   }
   ```

4. **For existing files - Check if file was modified since read**
   ```typescript
   const currentMtime = fs.statSync(absolutePath).mtimeMs;
   if (currentMtime > readState.timestamp) {
       return {
           result: false,
           message: "File has been modified since read, either by the user or by a linter. Read it again before attempting to write it.",
           errorCode: 3
       };
   }
   ```

### 2. Main Execution (`call`)

The execution is an async generator that yields progress and results.

```typescript
async *call(
    { file_path, content },
    { readFileState, updateFileHistoryState },
    context,
    metadata
) {
    // Step 1: Normalize file path
    const absolutePath = normalizePath(file_path);
    const parentDir = path.dirname(absolutePath);

    // Step 2: Fire before-edit hook
    await hooks.beforeFileEdited(absolutePath);

    // Step 3: Check if file exists
    const fileExists = fs.existsSync(absolutePath);

    // Step 4: Runtime validation (double-check for race conditions)
    if (fileExists) {
        const stats = fs.statSync(absolutePath);
        const currentMtime = Math.floor(stats.mtimeMs);
        const readState = readFileState.get(absolutePath);

        if (!readState || currentMtime > readState.timestamp) {
            throw new Error(
                "File has been unexpectedly modified. Read it again before attempting to write it."
            );
        }
    }

    // Step 5: Determine encoding and line ending
    const encoding = fileExists ? detectEncoding(absolutePath) : "utf-8";
    const originalContent = fileExists
        ? fs.readFileSync(absolutePath, { encoding })
        : null;

    // Step 6: Update file history (if tracking enabled)
    if (isFileHistoryEnabled()) {
        await updateFileHistory(updateFileHistoryState, absolutePath, metadata.uuid);
    }

    // Step 7: Determine line ending style
    const lineEnding = fileExists
        ? detectLineEnding(absolutePath)  // Returns "CRLF" or "LF"
        : await getDefaultLineEnding();    // From system settings

    // Step 8: Create parent directory
    fs.mkdirSync(parentDir, { recursive: true });

    // Step 9: Write file with proper encoding and line endings
    writeFileWithEncoding(absolutePath, content, encoding, lineEnding);

    // Step 10: Update read file state
    const newMtime = fs.statSync(absolutePath).mtimeMs;
    readFileState.set(absolutePath, {
        content: content,
        timestamp: newMtime
    });

    // Step 11: Track if CLAUDE.md was written (telemetry)
    if (absolutePath.endsWith(path.sep + "CLAUDE.md")) {
        trackEvent("tengu_write_claudemd", {});
    }

    // Step 12: Generate diff and yield result
    if (originalContent !== null) {
        // File was updated
        const patch = generateStructuredPatch({
            filePath: file_path,
            fileContents: originalContent,
            edits: [{
                old_string: originalContent,
                new_string: content,
                replace_all: false
            }]
        });

        const result = {
            type: "update",
            filePath: file_path,
            content: content,
            structuredPatch: patch
        };

        trackPatch(patch);  // Telemetry
        yield { type: "result", data: result };
    } else {
        // File was created
        const result = {
            type: "create",
            filePath: file_path,
            content: content,
            structuredPatch: []
        };

        trackPatch([], content);  // Telemetry
        yield { type: "result", data: result };
    }
}
```

### 3. LLM Response Formatting (`mapToolResultToToolResultBlockParam`)

The tool formats its response to the LLM based on whether it created or updated a file:

```typescript
mapToolResultToToolResultBlockParam(
    { filePath, content, type },
    toolUseId
) {
    switch (type) {
        case "create":
            return {
                tool_use_id: toolUseId,
                type: "tool_result",
                content: `File created successfully at: ${filePath}`
            };

        case "update":
            // Show snippet with line numbers (cat -n format)
            const MAX_LINES = 50;  // configurable constant
            const lines = content.split(/\r?\n/);
            const snippet = lines.length > MAX_LINES
                ? lines.slice(0, MAX_LINES).join('\n') + '\n...[truncated]'
                : content;

            const formattedSnippet = formatWithLineNumbers({
                content: snippet,
                startLine: 1
            });

            return {
                tool_use_id: toolUseId,
                type: "tool_result",
                content: `The file ${filePath} has been updated. Here's the result of running \`cat -n\` on a snippet of the edited file:\n${formattedSnippet}`
            };
    }
}
```

## Utility Functions

### Line Number Formatting

```typescript
function formatWithLineNumbers({ content, startLine }) {
    const lines = content.split('\n');
    const maxLineNum = startLine + lines.length - 1;
    const width = String(maxLineNum).length;

    return lines.map((line, index) => {
        const lineNum = startLine + index;
        const paddedNum = String(lineNum).padStart(width, ' ');
        return `${paddedNum}\t${line}`;
    }).join('\n');
}
```

### Encoding Detection

```typescript
function detectEncoding(filePath: string): string {
    // Read first few bytes to detect encoding
    // Returns one of: "utf-8", "utf-16le", "utf-16be", "ascii", etc.
    // Implementation varies by platform
}
```

### Line Ending Detection

```typescript
function detectLineEnding(filePath: string): "CRLF" | "LF" {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for CRLF first
    if (content.includes('\r\n')) {
        return "CRLF";
    }

    return "LF";
}
```

### Write with Encoding

```typescript
function writeFileWithEncoding(
    filePath: string,
    content: string,
    encoding: string,
    lineEnding: "CRLF" | "LF"
) {
    // Normalize line endings in content
    let normalizedContent = content;
    if (lineEnding === "CRLF") {
        normalizedContent = content.replace(/\r?\n/g, '\r\n');
    } else {
        normalizedContent = content.replace(/\r\n/g, '\n');
    }

    fs.writeFileSync(filePath, normalizedContent, { encoding });
}
```

### Structured Patch Generation

```typescript
function generateStructuredPatch({
    filePath,
    fileContents,
    edits
}): PatchHunk[] {
    // Apply all edits to get new content
    let newContent = fileContents;
    for (const edit of edits) {
        if (edit.old_string === "" && edit.new_string === "") {
            continue;  // No-op
        }

        if (edit.replace_all) {
            newContent = newContent.replaceAll(edit.old_string, edit.new_string);
        } else {
            newContent = newContent.replace(edit.old_string, edit.new_string);
        }
    }

    // Use diff library (e.g., diff or jsdiff) to generate unified diff
    const diff = createPatch(
        filePath,
        fileContents || "",
        newContent,
        "original",
        "updated"
    );

    // Parse unified diff into structured hunks
    return parseUnifiedDiff(diff);
}
```

## System Prompt

The tool provides this prompt/description to the LLM:

```
Writes a file to the local filesystem.

Usage:
- This tool will overwrite the existing file if there is one at the provided path.
- If this is an existing file, you MUST use the Read tool first to read the file's contents. This tool will fail if you did not read the file first.
- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
- Only use emojis if the user explicitly requests it. Avoid writing emojis to files unless asked.
```

## Permission Checking

```typescript
async checkPermissions(input, context) {
    const appState = await context.getAppState();
    return checkToolPermissions(
        this,  // the Write tool
        input,
        appState.toolPermissionContext
    );
}
```

The permission check:
1. Checks if auto-approval is enabled for this tool
2. Checks if the file path matches any allowed/denied patterns
3. May prompt user for approval if not auto-approved

## State Management

### Read File State

The tool maintains a state map of files that have been read:

```typescript
type ReadFileState = Map<string, {
    content: string;      // File content at time of read
    timestamp: number;    // mtime in milliseconds
}>;
```

This state is used to:
1. Validate that files have been read before writing
2. Detect if files have been modified externally
3. Update after successful writes

### File History State

If file history tracking is enabled, each write operation records:
- File path
- Operation UUID
- Timestamp
- Previous content hash

## Error Handling

The tool can fail with these specific error codes:

| Error Code | Condition | Message |
|------------|-----------|---------|
| 1 | File in ignored directory | "File is in a directory that is ignored by your project configuration." |
| 2 | File not read before write | "File has not been read yet. Read it first before writing to it." |
| 3 | File modified since read | "File has been modified since read, either by the user or by a linter. Read it again before attempting to write it." |
| - | Runtime modification detected | "File has been unexpectedly modified. Read it again before attempting to write it." (thrown as Error) |

## Key Design Principles

1. **Read-before-write enforcement**: Prevents accidental overwrites by requiring files to be read first
2. **Modification detection**: Uses mtime comparison to detect external modifications
3. **Encoding preservation**: Detects and preserves the original file encoding
4. **Line ending preservation**: Detects and preserves CRLF vs LF line endings
5. **Atomic operations**: Uses filesystem atomic write operations when available
6. **Diff generation**: Always generates structured diffs for transparency
7. **User feedback**: Provides detailed feedback with file snippets for updates

## Implementation Checklist

To implement this tool:

- [ ] File system operations (read, write, stat, mkdir)
- [ ] Path normalization and validation
- [ ] Encoding detection (utf-8, utf-16, etc.)
- [ ] Line ending detection (CRLF vs LF)
- [ ] Diff generation (unified diff format)
- [ ] Structured patch parsing
- [ ] Read file state management (Map<path, {content, timestamp}>)
- [ ] File history tracking (optional)
- [ ] Permission checking system
- [ ] Ignored directory detection
- [ ] Line number formatting (cat -n style)
- [ ] Async generator for streaming results
- [ ] Before-edit hooks
- [ ] Telemetry/event tracking (optional)

## Example Usage

### Creating a new file

```typescript
// Input
{
    file_path: "/Users/steve/project/src/newfile.ts",
    content: "export const greeting = 'Hello, World!';\n"
}

// Output
{
    type: "create",
    filePath: "/Users/steve/project/src/newfile.ts",
    content: "export const greeting = 'Hello, World!';\n",
    structuredPatch: []
}

// LLM Response
"File created successfully at: /Users/steve/project/src/newfile.ts"
```

### Updating an existing file

```typescript
// Input (after reading file first)
{
    file_path: "/Users/steve/project/src/index.ts",
    content: "import { greeting } from './newfile';\n\nconsole.log(greeting);\n"
}

// Output
{
    type: "update",
    filePath: "/Users/steve/project/src/index.ts",
    content: "import { greeting } from './newfile';\n\nconsole.log(greeting);\n",
    structuredPatch: [
        {
            oldStart: 1,
            oldLines: 1,
            newStart: 1,
            newLines: 3,
            lines: [
                "-// TODO: import greeting",
                "+import { greeting } from './newfile';",
                "+",
                "+console.log(greeting);"
            ]
        }
    ]
}

// LLM Response
"The file /Users/steve/project/src/index.ts has been updated. Here's the result of running `cat -n` on a snippet of the edited file:
     1\timport { greeting } from './newfile';
     2\t
     3\tconsole.log(greeting);"
```

## Integration Points

### With Read Tool
- Must check Read tool state before allowing writes
- Shares the same `readFileState` context

### With Edit Tool
- Write tool is for full file replacement
- Edit tool is for targeted string replacements
- Both update the same `readFileState`

### With Permission System
- Checks tool permissions before execution
- Can be auto-approved based on patterns
- May require user confirmation for sensitive paths

### With File History
- Records operation metadata for undo/replay
- Links to operation UUID for correlation
- Optional feature that can be disabled
