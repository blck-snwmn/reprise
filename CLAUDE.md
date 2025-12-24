# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reprise is a Chrome extension for YouTube video loop control. Features:
- Set custom start/end times to loop a specific section of YouTube videos
- Popup UI for configuration (start time, end time, enable/disable)
- Loop is OFF by default on initial load
- No persistence: settings reset when page is refreshed or video changes

### Specifications

- **Time format**: `mm:ss` (e.g., `1:26`, `4:42`)
- **Validation**: Required (start < end, within video duration)
- **Video change**: Reset loop settings when navigating to different video
- **Loop mechanism**: Uses `timeupdate` event to check `currentTime` and seek back to start

## Development Commands

```bash
# Install dependencies
bun install

# Type check
bun run tsc --noEmit

# Build extension (after build script is configured)
bun run build
```

## Architecture

This is a Chrome Extension (Manifest V3) built with:
- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **UI**: React (for popup)

### Extension Structure (planned)

```
src/
├── content.ts         # Content script injected into YouTube pages
├── popup/             # Extension popup UI (React)
│   ├── index.html
│   ├── App.tsx
│   └── main.tsx
└── types.ts           # Shared type definitions
manifest.json          # Chrome extension manifest (V3)
```

### Key Components

- **Content Script**: Monitors YouTube video player, implements loop logic by checking `currentTime` and seeking back to start time
- **Popup**: Settings UI for start/end time input and toggle switch

### Communication Flow

```
Popup <---> Content Script (YouTube page)
```

State is managed in-memory within the content script. No background service worker needed for this simple use case.
