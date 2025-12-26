# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reprise is a Chrome extension for YouTube video loop control. Features:
- Set custom start/end times to loop a specific section of YouTube videos
- Side Panel UI for configuration (start time, end time, loop name)
- Manage multiple loops per video with easy activation/deactivation
- Persistent storage: loop settings are saved and restored across sessions

### Specifications

- **Time format**: `m:ss` or `h:mm:ss` (e.g., `1:26`, `4:42`, `1:23:45`)
- **Validation**: Required (start < end, within video duration)
- **Persistence**: Loops are saved per video using Chrome Storage API
- **Loop mechanism**: Uses `timeupdate` event to check `currentTime` and seek back to start

## Development Commands

```bash
# Install dependencies
bun install

# Build extension
bun run build

# Build with watch mode (development)
bun run dev

# Lint (oxlint)
bun run lint

# Lint with auto-fix
bun run lint:fix

# Format code (oxfmt)
bun run fmt

# Check formatting
bun run fmt:check
```

## After Code Changes

コード編集後は以下のコマンドを順番に実行すること:

1. `bun run fmt` - コードフォーマット
2. `bun run lint` - リントチェック
3. `bun run build` - ビルド確認

## Architecture

This is a Chrome Extension (Manifest V3) built with:
- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **UI**: React (for Side Panel)
- **Styling**: Tailwind CSS
- **Linting/Formatting**: oxlint, oxfmt

### Extension Structure

```
src/
├── content.ts         # Content script injected into YouTube pages
├── background.ts      # Background service worker (Side Panel management)
├── storage.ts         # Chrome Storage API wrapper
├── types.ts           # Shared type definitions
├── utils.ts           # Utility functions
└── sidepanel/         # Side Panel UI (React)
    ├── index.html
    ├── main.tsx
    ├── App.tsx
    └── components/
        ├── LoopList.tsx    # Loop list display
        ├── LoopItem.tsx    # Individual loop item
        ├── LoopEditor.tsx  # Loop create/edit form
        └── TimeInput.tsx   # Time input with slider
manifest.json          # Chrome extension manifest (V3)
```

### Key Components

- **Content Script**: Monitors YouTube video player, implements loop logic by checking `currentTime` and seeking back to start time. Communicates with Side Panel via message passing.
- **Side Panel**: Settings UI for managing multiple loops. Displays video info, loop list, and provides create/edit/delete functionality.
- **Storage**: Wrapper around Chrome Storage API for persisting loop configurations per video.
- **Background**: Service worker that manages Side Panel state and handles extension icon clicks.

### Communication Flow

```
Side Panel <---> Content Script (YouTube page)
     |                    |
     +---> Storage <------+
```

State is persisted using Chrome Storage API. The content script restores loop state when video changes.
