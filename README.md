# Quiet Questions

Quiet Questions is a gentle, local-first desktop journal for short reflections. It lives in your menu bar/system tray, periodically surfaces smart prompts, and keeps your thoughts on your own machine using SQLite.

## Tech Stack

- Electron (main process, tray integration, prompt scheduler)
- React + TypeScript + Vite (renderer)
- Tailwind CSS (calm, pastel interface)
- better-sqlite3 (local storage)

## Getting Started

### Prerequisites

- Node.js 18+ (Electron 39 ships with Node 20 inside, but building requires a modern Node on your host)
- `npm` (bundled with Node). Native modules (`better-sqlite3`) require a C++ toolchain; on macOS install Xcode command line tools, on Windows install the Microsoft Build Tools.

### Install dependencies

```bash
npm install
```

### Development

Runs Vite, tsup (Electron main/preload), and Electron with live reload.

```bash
npm run dev
```

### Production build

Outputs compiled main/preload files and a packaged renderer, then runs `electron-builder`.

```bash
npm run build
```

### Scripts Overview

- `npm run dev` — launches the dev environment (renderer + main + electron)
- `npm run build` — produces a distributable app via `electron-builder`
- `npm run build:renderer` — Vite production build (renderer assets)
- `npm run build:main` — bundles Electron main & preload via tsup
- `npm run clean` — removes `dist/`

## Project Structure

```
/electron            # Main process, preload, services, prompt scheduler
/src                 # React renderer
  /components        # UI primitives & layout
  /hooks             # Data & settings hooks
  /pages             # Dashboard, Settings, Prompt capture
  /types             # Shared domain types
  /lib               # IPC bridge helpers and utilities
/resources           # Icons (future expansion)
```

## Data storage

The SQLite database lives at:

- macOS: `~/Library/Application Support/Quiet Questions/storage/quiet-questions.db`
- Windows: `%APPDATA%/Quiet Questions/storage/quiet-questions.db`

Tables include journal entries, prompts, projects, traits, and user settings. The schema seeds curated prompt categories on first launch.

## Key Entry Points

- `electron/main.ts` — app bootstrap (windows, tray, scheduler, IPC)
- `electron/preload.ts` — secure renderer bridge exposing `window.api`
- `electron/database.ts` — SQLite initialisation, migrations, seed data
- `electron/services/*` — data access (entries, prompts, projects, traits, stats)
- `electron/promptScheduler.ts` — periodic prompt timer respecting quiet hours
- `src/App.tsx` — routing setup
- `src/pages/DashboardPage.tsx` — timeline, filters, insights
- `src/pages/PromptCapturePage.tsx` — lightweight prompt popup UI
- `src/pages/SettingsPage.tsx` — prompt cadence, projects, traits management

## Design Notes

- Uses a soft pastel palette defined in `tailwind.config.js` to keep the UI calm.
- Prompt scheduler respects user configurable quiet hours and pause state.
- Tray menu offers quick entry, pause/resume, and window controls.
- Renderer communicates exclusively through IPC (no `remote` module) for security.

## Next Steps / Ideas

- Dark theme toggle tied to settings.
- Sync prompt history for smarter rotations.
- Light analytics in the insights panel (streaks, mood, etc.).
- Export/import reflections.

Enjoy quiet, mindful check-ins ✨

