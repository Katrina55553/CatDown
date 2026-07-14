# CatDown Optimization TODO

## 1. Deepen the Renderer Shell

- [ ] Extract a dashboard view-model module from `src/renderer/src/App.vue`.
  - Move countdown, income, payday, Friday, and next-holiday calculation orchestration out of the Vue file.
  - Keep the interface small: input is config, holidays, and current time; output is display-ready state.
- [ ] Split the preview area into `PreviewPanel.vue`.
  - Own countdown text, background style, font color style, cat illustration, and info cards.
- [ ] Split the settings area into `SettingsPanel.vue`.
  - Own workday, time, salary, payday, card visibility, minimal mode, and autostart controls.
- [ ] Move large style blocks into focused files or scoped module styles.
- [ ] Add tests for the dashboard view-model, especially date and visibility edge cases.

## 2. Consolidate Local JSON Persistence

- [ ] Add a main-process JSON store module for files under Electron `userData`.
  - Handle directory creation, JSON parsing, fallback defaults, write errors, and optional sanitizers in one place.
- [ ] Refactor `src/main/config.ts` to use the JSON store.
- [ ] Refactor `src/main/holidays.ts` to use the JSON store.
- [ ] Add tests with a temporary directory adapter or in-memory adapter.
- [ ] Preserve existing recovery behavior for corrupted config and holiday files.

## 3. Split IPC Registration by Feature

- [ ] Keep app lifecycle and window creation in `src/main/index.ts`.
- [ ] Add focused registration modules:
  - `registerConfigIpc`
  - `registerHolidayIpc`
  - `registerBackgroundIpc`
  - `registerWindowIpc`
- [ ] Keep channel names centralized in `src/shared/types.ts`.
- [ ] Add lightweight tests or assertions for channel-to-handler wiring.

## 4. Expand Non-Shared Test Coverage

- [ ] Test config load/save fallback behavior.
- [ ] Test holiday add/remove/reset persistence behavior.
- [ ] Test background image extension, size, and missing-file handling.
- [ ] Test renderer store load failure paths.
- [ ] Keep existing `src/shared/*.test.ts` coverage as the baseline for pure calculation logic.

## Recommended Order

1. Start with `App.vue` decomposition; it has the highest locality gain and the most visible regression risk.
2. Consolidate JSON persistence before adding more config-like features.
3. Split IPC registration once persistence modules are stable.
4. Add main-process and renderer tests alongside each refactor.
