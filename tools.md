# Claude Code Tools

This document lists all tools extracted from `cli-2.0.5.js`.

## Edit Tool (jD / p7)

**Name**: `Edit` / `p7`
**User Facing Name**: "Edit"

**Description**: A tool for editing files

**Parameters** (inputSchema: yk2):
- `file_path`: Path to the file to edit
- `old_string`: String to replace
- `new_string`: String to replace with
- `replace_all`: Boolean (optional, default false) - whether to replace all occurrences

**Output** (outputSchema: kk2):
- `filePath`: The edited file path
- `oldString`: The actual old string matched
- `newString`: The new string
- `originalFile`: Original file content
- `structuredPatch`: Diff patch showing changes
- `userModified`: Whether user modified the changes
- `replaceAll`: Whether all occurrences were replaced

**Execution** (call method):
1. Validates file exists and has been read
2. Finds the old string in file content (with fuzzy matching via `ru()`)
3. Checks for multiple matches if replace_all is false
4. Creates structured diff patch using `VM1()`
5. Writes updated content to file
6. Updates read file state with new content and timestamp
7. Yields result with patch information

**LLM Formatting** (mapToolResultToToolResultBlockParam):
- Returns confirmation message with file path
- For replace_all: Simple confirmation of all replacements
- For single replace: Shows snippet with cat -n format around the change

**Validation** (validateInput):
- Checks if old_string equals new_string (error)
- Checks if file is in ignored directory (error)
- For new files: Checks if old_string is empty (allowed)
- Checks if file exists (error if not and old_string not empty)
- Rejects .ipynb files (must use NotebookEdit)
- Checks if file has been read (error if not)
- Checks if file was modified since read (error)
- Checks if old_string is found in file (error if not)
- Checks for multiple matches when replace_all is false (error)

---

## Write Tool (bF / MF)

**Name**: `Write` / `MF`
**User Facing Name**: "Write"

**Description**: Write a file to the local filesystem.

**Parameters** (inputSchema: v56):
- `file_path`: Absolute path to file to write
- `content`: Content to write to the file

**Output** (outputSchema: b56):
- `type`: "create" or "update"
- `filePath`: Path to the file that was written
- `content`: Content that was written
- `structuredPatch`: Diff patch showing the changes

**Execution** (call method):
- Creates parent directories if needed
- Detects line ending style (CRLF vs LF)
- Detects file encoding
- Writes content to file
- Updates read file state
- Yields result with patch

**LLM Formatting**:
- Returns confirmation with file path and operation type (create/update)

---

## Bash Tool (_Q / H8)

**Name**: `Bash` / `H8`
**User Facing Name**: "Bash" or "SandboxedBash"

**Description** (dynamic): Provided via description parameter or defaults to "Run shell command"

**Parameters** (inputSchema: UL6):
- `command`: The shell command to execute
- `description`: Optional description of what the command does
- `timeout`: Optional timeout in milliseconds
- `run_in_background`: Optional boolean to run in background

**Output** (outputSchema: qL6):
- `stdout`: Standard output
- `stderr`: Standard error
- `code`: Exit code
- `interrupted`: Whether command was interrupted
- `summary`: Optional summarized output
- `isImage`: Boolean if output is image data
- `backgroundTaskId`: ID if running in background

**Execution** (call method):
1. Executes command via `OL6()` with abort controller
2. Streams progress updates with elapsed time and output
3. Captures stdout and stderr
4. Checks exit code and determines if error
5. Handles special cases (git index lock errors, sandbox failures)
6. Attempts to extract file paths from output and auto-read them
7. Optionally summarizes long output using LLM (via `ML6()`)
8. Truncates very long output
9. Handles image output (base64 data URLs)
10. Yields final result

**LLM Formatting**:
- For images: Returns base64 image content block
- For summaries: Returns summary text
- Otherwise: Returns stdout, stderr, and background task ID (if applicable)
- Adds error marker if command was aborted

**Validation** (checkPermissions):
- Auto-allows if in sandbox mode
- Otherwise checks permissions via `I$0()`

**Read-only Detection** (isReadOnly):
- Uses `DQB()` to determine if command is read-only

---

## Read Tool (t4 / FZ)

**Name**: `Read` / `FZ`
**User Facing Name**: Not specified

**Description**: Tool for reading files

**Parameters** (inputSchema: qE6):
- `file_path`: Path to file to read
- `offset`: Optional line offset to start reading from
- `limit`: Optional number of lines to read

**Output** (outputSchema: NE6):
Multiple possible output types (discriminated union):
- Type "text": Regular text file with content
- Type "image": Image file with base64 data
- Type "pdf": PDF file with base64 data

**Execution**: Details not fully visible in minified code

**LLM Formatting**: Returns file content with line numbers (cat -n format)

---

## Glob Tool (bE / JM)

**Name**: `Glob` / `JM`
**User Facing Name**: "Glob"

**Description**: Fast file pattern matching tool

**Parameters** (inputSchema: Jh6):
- `pattern`: Glob pattern to match (e.g., "*.js", "**/*.ts")
- `path`: Optional directory to search in

**Output** (outputSchema: Xh6):
- `executionTimeMs`: Time taken in milliseconds
- `numFiles`: Total number of files found
- `filenames`: Array of matching file paths
- `truncated`: Whether results were truncated (max 100 files)

**Execution**: Uses fast glob matching algorithm

**LLM Formatting**: Returns list of matching files with count and timing info

---

## Grep Tool (US / yU)

**Name**: `Grep` / `yU`
**User Facing Name**: "Search"

**Description**: Content search tool built on ripgrep

**Parameters** (multiple modes):
- `pattern`: Regex pattern to search for
- `path`: Optional file or directory to search in
- `type`: Optional file type filter
- `glob`: Optional glob pattern for files
- `-i`: Case insensitive flag
- `-n`: Show line numbers flag
- `-A/-B/-C`: Context lines (after/before/around)
- `multiline`: Enable multiline matching
- `output_mode`: "content", "files_with_matches", or "count"
- `head_limit`: Limit number of results

**Output** (outputSchema: Wh6):
- `mode`: The output mode used
- `numFiles`: Number of files with matches
- `filenames`: Array of matching files
- `content`: Optional content with matches (if mode is "content")
- `numLines`: Optional line count
- `numMatches`: Optional match count

**Execution**: Uses ripgrep (rg) under the hood

**LLM Formatting**: Returns search results formatted based on output mode

---

## Notebook Edit Tool (vO / wx)

**Name**: `NotebookEdit` / `wx`
**User Facing Name**: "Edit Notebook"

**Description**: Tool for editing Jupyter notebooks

**Parameters**:
- `notebook_path`: Path to .ipynb file
- `cell_id`: Optional cell ID to edit
- `cell_type`: "code" or "markdown"
- `edit_mode`: "replace", "insert", or "delete"
- `new_source`: New source code/content for cell

**Output**:
- `notebook_path`: Path to edited notebook
- `cell_id`: Optional ID of edited cell
- `cell_type`: Type of cell
- `language`: Programming language
- `edit_mode`: Mode used
- `error`: Optional error message

**Execution**: Modifies Jupyter notebook cells

---

## ExitPlanMode Tool (zO / sT6)

**Name**: `ExitPlanMode` / `sT6`
**User Facing Name**: Not specified

**Description**: Prompts the user to exit plan mode and start coding

**Parameters** (inputSchema: rT6):
- `plan`: The plan to present to user (markdown supported)

**Output** (outputSchema: oT6):
- `plan`: The plan presented
- `isAgent`: Boolean flag

**Execution**: Prompts user to exit planning mode

---

## TodoWrite Tool (HG)

**Name**: `TodoWrite`

**Description**: Tool for managing todo lists

**Parameters** (inputSchema: $w6):
- `oldTodos`: Previous todo list state
- `newTodos`: Updated todo list state

**Output** (outputSchema: ww6):
- `oldTodos`: Previous state
- `newTodos`: New state

**Execution**: Updates todo list state

---

## BashOutput Tool (Su1)

**Name**: `BashOutput`

**Description**: Retrieves output from a background bash shell

**Parameters**:
- `bash_id`: ID of background shell
- `filter`: Optional regex to filter output lines

**Output**: Shell output (stdout/stderr)

**Execution** (async prompt): Uses `uRB()` for prompting

---

## MCP Tools

The file also contains MCP (Model Context Protocol) related tools with names like:
- `ReadMcpResourceTool`
- Various MCP list and call tools

These appear to be for integrating with external MCP servers.

---

## Tool Categories

Tools are organized into categories:

1. **READ_ONLY**: Read, Grep, Glob, ExitPlanMode, BashOutput, and others
2. **EDIT**: Edit, Write, NotebookEdit
3. **EXECUTION**: Bash
4. **MCP**: MCP-specific tools (dynamically loaded)

---

## Notes

- The source file is heavily minified/obfuscated, making full extraction difficult
- Many tool names are shortened (e.g., `jD`, `bF`, `_Q`) with longer aliases
- Tools follow a pattern: name, description, prompt, inputSchema, outputSchema, validateInput, call, mapToolResultToToolResultBlockParam
- Most tools include permission checking via `checkPermissions()`
- Tools support concurrency safety checks via `isConcurrencySafe()`
- Read-only detection via `isReadOnly()`
