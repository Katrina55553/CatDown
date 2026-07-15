# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## What This Project Is

CatDown is an Electron + Vue 3 desktop widget for Windows that shows a real-time countdown to end-of-work, estimates today's income, and displays auxiliary cards (payday, Friday, next holiday). It runs as a system tray app — clicking the tray icon shows the main window; closing the window hides it back to the tray.

## Build, Test, and Development Commands

```bash
npm install                  # install dependencies
npm run dev                  # start electron-vite dev server with hot reload
npm run build                # build main + preload + renderer into out/
npm run typecheck            # run both node (tsc) and web (vue-tsc) type checks
npm test                     # run Vitest unit suite once
npm run test:watch           # Vitest in watch mode
npm run dist                 # build + package Windows NSIS installer into release/
npm run dist:dir             # build + unpacked dir only (faster, no installer)
```

### Running a single test file

Tests go through `scripts/test.cjs` (a cross-platform Vitest wrapper that polyfills Node < 20). Extra args after `npm test` are forwarded to Vitest:

```bash
npm test -- src/shared/engine.test.ts          # run one file
npm test -- --watch src/shared/income.test.ts   # watch one file
npm test -- -t "should handle weekend"          # run by test name pattern
```

### CI checks before submitting

CI (`.github/workflows/release.yml`) runs on `windows-latest` with Node 22 and executes `typecheck` → `test` → `build` in that order. Run `npm run typecheck && npm test` locally before committing changes to calculation logic.

## Architecture

### Three-process Electron layout

```
src/main/        → Electron main process (window, tray, IPC handlers, file I/O)
src/preload/     → contextBridge: exposes a typed `window.catdown` API to the renderer
src/renderer/    → Vue 3 app (Composition API + Pinia)
src/shared/      → Pure TypeScript business logic (no Electron imports) — the engine layer
```

`electron.vite.config.ts` configures three separate build targets (main, preload, renderer) with path aliases `@shared` (→ `src/shared`) and `@renderer` (→ `src/renderer/src`).

### The pure-function engine layer (`src/shared/`)

**This is the most important architectural principle in the codebase.** All time, income, payday, and auxiliary-card calculations are pure functions in `src/shared/` that take explicit inputs (including `now: Date`) and return plain objects. They never import Electron or touch the DOM. This makes them trivially unit-testable and is the reason ~70 tests exist without any Electron runtime.

Key modules and their responsibilities:

| Module | Responsibility |
|---|---|
| `engine.ts` | Core countdown: determines current state (beforeWork / working / afterWork / restDay / noWorkday), finds next workday, computes remaining time |
| `income.ts` | Today's income: monthly and daily salary modes, work-days-in-month counting, worked-hours calculation |
| `payday.ts` | Next payday: handles 31st-of-month edge case, holiday-advance logic (move payday backward to nearest workday) |
| `auxiliary.ts` | Distance-to-Friday card + next-holiday card |
| `font-color.ts` | FontColor → CSS conversion (solid color or gradient with `background-clip: text`), gradient stop CRUD, validation/sanitization |
| `background-presets.ts` | 8 preset backgrounds (CSS gradients + optional animation overlay class), `sanitizeBackground()` for config migration |
| `types.ts` | All shared types, `AppConfig`, `defaultConfig`, `IPC_CHANNELS` constant |

### The EngineConfig pattern

`engine.ts` defines its own `EngineConfig` interface (workdays, startTime, endTime, holidays[]) rather than using the full `AppConfig`. This decouples the engine from config fields it doesn't need. `buildEngineConfig(config: AppConfig, holidays: string[])` is the bridge function called by the renderer before passing data to engine functions.

### Data flow: config → engines → view-model → Vue

1. **Pinia store** (`stores/config.ts`) loads `AppConfig` + holidays via `window.catdown` IPC on mount.
2. `App.vue` runs a 1-second `setInterval` updating `now`, then calls `computeDashboard()` (a pure function in `composables/dashboard.ts`) on every tick.
3. `computeDashboard()` aggregates all engine outputs (countdown, income, payday, friday, nextHoliday) plus style computations (font color CSS, background CSS) into a single `DashboardState` object.
4. `DashboardState` is passed as props to `PreviewPanel.vue` (left) and `SettingsPanel.vue` (right).

`computeDashboard()` is itself a pure function with a dedicated test (`composables/dashboard.test.ts`), keeping the view-model layer testable without Vue.

### IPC architecture

- All channel names are defined in `IPC_CHANNELS` (in `src/shared/types.ts`) — never hardcode channel strings.
- IPC handlers are split by domain into `src/main/ipc/` modules: `config-ipc.ts`, `holiday-ipc.ts`, `background-ipc.ts`, `window-ipc.ts`. Each exports a `register*Ipc()` function called from `index.ts`'s `registerAllIpc()`.
- The preload script (`src/preload/index.ts`) wraps `ipcRenderer.invoke/send` into a typed API object and exposes it via `contextBridge.exposeInMainWorld('catdown', api)`.
- The renderer declares the `window.catdown` type in `stores/config.ts` (global interface augmentation).
- `wiring.test.ts` verifies that every IPC channel registered by handlers exists in `IPC_CHANNELS` — this guards against magic strings.

### File persistence (`src/main/json-store.ts`)

A generic JSON read/write layer for the Electron `userData` directory. `readJson<T>()` accepts `validate` and `sanitize` hooks — on parse failure or validation failure, it writes the default value and returns a copy. Used by:
- `config.ts` → `config.json` (with `sanitizeConfig` merging defaults + `sanitizeBackground` migration)
- `holidays.ts` → `holidays.json`

For testing, `setUserDataResolver()` can inject a temp directory so main-process modules don't touch real `userData`.

### Holiday data: dual sources that must stay in sync

Holiday data exists in two places:
1. `resources/holidays.json` — static resource file bundled with the app.
2. `src/main/default-holidays.ts` — TypeScript copy compiled into the main process (used as the default when no user-customized `holidays.json` exists in `userData`).

**If you update holiday data, update both files.** The comment in `default-holidays.ts` explicitly notes this requirement.

### Background image lifecycle

Background images are stored in `userData/bg/`. The flow: user selects an image → main process validates (≤5MB, JPG/PNG/WebP) and returns a data URL → renderer crops with cropperjs → renderer sends base64 back → main process saves to `userData/bg/background.<ext>` and returns a relative path stored in config. At load time, `readBackgroundImage()` reads the file back as a data URL for the renderer.

## Coding Conventions

- TypeScript throughout. Two-space indentation, single quotes, no semicolons.
- Named exports for shared helpers; PascalCase for Vue components (e.g. `BackgroundPicker.vue`); lowercase filenames for store/utility modules.
- Use `@renderer` for renderer source and `@shared` for shared logic (configured in both `electron.vite.config.ts` and `tsconfig.*.json`).
- New IPC channels must be added to `IPC_CHANNELS` in `src/shared/types.ts` and registered in the appropriate `src/main/ipc/*-ipc.ts` module.
- New calculation logic goes in `src/shared/` as pure functions — never in the main process or renderer directly.
- Tests live next to the module under test as `*.test.ts` (e.g. `src/shared/engine.test.ts`).
- Commit messages use Conventional Commits (`feat:`, `fix(scope):`, `docs:`, `chore:`).

## Testing Infrastructure

- **Vitest 4** with config in `vitest.config.cjs`.
- The `electron` module is aliased to `scripts/mock-electron.cjs` in tests — a minimal stub providing no-op `app`, `ipcMain`, `dialog`, `BrowserWindow`, `Tray`, etc. This lets main-process modules be imported in tests without a real Electron runtime.
- For modules that need finer control (e.g. IPC wiring tests), `vi.mock('electron', ...)` overrides the stub with spies.
- `scripts/test.cjs` wraps the Vitest CLI to handle Node < 20 polyfilling transparently.
- Two separate `tsconfig` files: `tsconfig.node.json` (main + preload + shared) and `tsconfig.web.json` (renderer + shared). `npm run typecheck` runs both.

## Security & Configuration

- Runtime user data belongs in Electron `userData` (typically `%APPDATA%/catdown/`). Never hardcode local machine paths in source.
- Background images are copied to `userData/bg/` — the config stores only a relative filename, not an absolute path, so images survive if the original file moves.
- For China-region Electron installs, use temporary mirror environment variables locally rather than committing registry or mirror settings to `package.json` or `.npmrc`.
- Do not commit generated `out/`, `release/`, or `node_modules/` artifacts.
