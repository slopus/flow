# TUI Architecture Specification

## Overview

A Terminal User Interface (TUI) renderer with split-zone architecture for optimal performance and user experience. The system divides the terminal into two distinct rendering zones:

1. **Log Zone** (top) - Plain stdout rendering for scrollable output
2. **Input Zone** (bottom) - Ink-based interactive controls

## Design Goals

- **Performance**: Only re-render interactive controls on resize, never the entire log history
- **Native Feel**: Log output behaves like standard terminal (line-by-line, scrollable)
- **Flexibility**: Configurable input zone height
- **Compatibility**: Works with any terminal supporting ANSI escape codes

## Architecture

### Zone 1: Log Output (Top)

**Implementation**: Direct `process.stdout.write()`

**Behavior**:
- Outputs text line-by-line as it arrives
- Scrolls naturally with terminal scrollback
- No re-rendering on resize
- Persists in terminal history
- Supports ANSI colors and formatting

**Characteristics**:
- No React/Ink overhead
- Minimal memory footprint
- Standard terminal behavior
- Can be piped/redirected

### Zone 2: Input Controls (Bottom)

**Implementation**: Ink (React for terminal)

**Behavior**:
- Fixed N-line height at bottom of terminal
- Renders interactive components (text input, buttons, status bars)
- Re-renders on:
  - User interaction
  - State changes
  - Terminal resize
- Always visible (pinned to bottom)

**Characteristics**:
- Reactive UI updates
- Component-based architecture
- Managed state
- Positioned using ANSI cursor control

## Technical Implementation

### Rendering Pipeline

1. **Initialization**
   - Measure terminal dimensions
   - Reserve N lines at bottom for input zone
   - Initialize Ink renderer in alternate screen buffer (optional) or fixed position

2. **Log Output**
   - Write directly to stdout
   - Track current cursor position
   - Ensure output stays above input zone

3. **Input Rendering**
   - Ink renders to reserved bottom N lines
   - Uses absolute cursor positioning
   - Saves/restores cursor position around updates

4. **Resize Handling**
   - Detect terminal resize (SIGWINCH)
   - Recalculate input zone position
   - Re-render only input zone
   - Log history remains untouched

### Cursor Management

```typescript
// Pseudo-code
function renderInput() {
    const { rows } = getTerminalSize();
    const inputStartRow = rows - INPUT_HEIGHT + 1;

    // Save cursor position
    stdout.write('\x1b7');

    // Move to input zone
    stdout.write(`\x1b[${inputStartRow};1H`);

    // Render Ink component
    inkRender(<InputZone />);

    // Restore cursor
    stdout.write('\x1b8');
}
```

### State Isolation

- **Log State**: Stateless, append-only
- **Input State**: Managed by React/Ink
- **No Shared State**: Zones operate independently

## API Design

```typescript
interface TUIOptions {
    inputHeight: number;        // Number of lines for input zone
    clearOnExit?: boolean;      // Clear input zone on exit
}

class TUI {
    // Log output
    log(message: string): void;
    logLine(message: string): void;

    // Input zone rendering
    renderInput(component: React.ReactElement): void;
    updateInput(component: React.ReactElement): void;

    // Lifecycle
    start(options: TUIOptions): void;
    stop(): void;
}
```

## Usage Example

```typescript
const tui = new TUI();

tui.start({ inputHeight: 3 });

// Log output (top zone)
tui.log('Starting process...\n');
tui.log('Loading data...\n');
tui.log('Complete!\n');

// Input controls (bottom zone)
tui.renderInput(
    <Box flexDirection="column">
        <Text>Enter command:</Text>
        <TextInput value={input} onChange={setInput} />
    </Box>
);

// Only input re-renders on resize, logs stay intact
```

## Performance Characteristics

### Memory
- **Log Zone**: O(1) - no buffering, direct write
- **Input Zone**: O(n) where n = input component complexity

### CPU
- **Log Output**: Minimal - direct syscall
- **Input Rendering**: Only on state change or resize
- **Resize**: O(1) - only input zone re-renders

### Terminal Scrollback
- Log output participates in normal scrollback
- Input zone remains fixed at bottom
- No interference between zones

## Edge Cases

1. **Terminal Too Small**: Graceful degradation, minimum 1 line for input
2. **Rapid Resize**: Debounce input re-renders
3. **Log Overflow**: Handled by terminal scrollback
4. **Input Zone Height > Terminal Height**: Error or auto-adjust

## Benefits

1. **Efficient**: No re-rendering of historical output
2. **Familiar**: Logs behave like standard terminal
3. **Persistent**: Log output saved in terminal history
4. **Interactive**: Rich UI in input zone
5. **Scalable**: Handles large log volumes without performance degradation
