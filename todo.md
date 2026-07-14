# CatDown Optimization TODO

## 1. Deepen the Renderer Shell

- [x] Extract a dashboard view-model module from `src/renderer/src/App.vue`.
  - Moved to `src/renderer/src/composables/dashboard.ts` (`computeDashboard` + helpers).
  - Interface: input is config, holidays, holidayEntries, backgroundUrl, now; output is display-ready `DashboardState`.
- [x] Split the preview area into `PreviewPanel.vue`.
  - Owns countdown text, background style, font color style, cat illustration, and info cards.
- [x] Split the settings area into `SettingsPanel.vue`.
  - Owns workday, time, salary, payday, card visibility, minimal mode, and autostart controls.
- [x] Move large style blocks into focused files or scoped module styles.
  - Preview/overlay styles now scoped in `PreviewPanel.vue`; settings styles scoped in `SettingsPanel.vue`; only global reset + minimal-toggle remain in `App.vue`.
- [x] Add tests for the dashboard view-model, especially date and visibility edge cases.
  - `src/renderer/src/composables/dashboard.test.ts` covers formatDisplayText, font/background styles, and end-to-end computeDashboard (workday/rest/holiday/no-workday/income/holiday-card).

## 2. Consolidate Local JSON Persistence

- [x] Add a main-process JSON store module for files under Electron `userData`.
  - `src/main/json-store.ts` with `readJson`/`writeJson`/`getUserDataPath`/`getUserDataDir` + `setUserDataResolver` for test injection.
- [x] Refactor `src/main/config.ts` to use the JSON store.
- [x] Refactor `src/main/holidays.ts` to use the JSON store.
- [x] Add tests with a temporary directory adapter or in-memory adapter.
  - `src/main/json-store.test.ts` uses `mkdtempSync` per test; `config.test.ts` / `holidays.test.ts` / `background.test.ts` reuse the resolver.
- [x] Preserve existing recovery behavior for corrupted config and holiday files.
  - Damaged JSON / failed validate → rewrite default + return default copy; partial config still merged with defaults.

## 3. Split IPC Registration by Feature

- [x] Keep app lifecycle and window creation in `src/main/index.ts`.
  - `index.ts` now only owns window/tray lifecycle + `registerAllIpc()` aggregator.
- [x] Add focused registration modules:
  - `registerConfigIpc`
  - `registerHolidayIpc`
  - `registerBackgroundIpc`
  - `registerWindowIpc`
- [x] Keep channel names centralized in `src/shared/types.ts`.
- [x] Add lightweight tests or assertions for channel-to-handler wiring.
  - `src/main/ipc/wiring.test.ts` asserts each register function wires the expected channels via mocked `ipcMain`.

## 4. Expand Non-Shared Test Coverage

- [x] Test config load/save fallback behavior.
  - `src/main/config.test.ts`: first-load, round-trip, corrupted JSON, partial config merge, background sanitize.
- [x] Test holiday add/remove/reset persistence behavior.
  - `src/main/holidays.test.ts`: default load, corrupt fallback, add (dedupe + sort), remove, reset.
- [x] Test background image extension, size, and missing-file handling.
  - `src/main/background.test.ts`: saveCroppedImage (plain/data-url/ext/auto-dir) + readImageAsDataURL (empty/missing/jpeg-mime).
- [x] Test renderer store load failure paths.
  - `src/renderer/src/stores/config.test.ts`: loadConfig success/failure, updateConfig failure, refreshHolidays failure, refreshBackgroundUrl branches.
- [x] Keep existing `src/shared/*.test.ts` coverage as the baseline for pure calculation logic.
  - Untouched; dashboard view-model tests layer on top of the shared pure functions.

## Recommended Order

1. ~~Start with `App.vue` decomposition~~ (done).
2. ~~Consolidate JSON persistence~~ (done).
3. ~~Split IPC registration~~ (done).
4. ~~Add main-process and renderer tests alongside each refactor~~ (done).
