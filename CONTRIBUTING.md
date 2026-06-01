# Contributing to TabsBroadcast

Thanks for your interest in improving TabsBroadcast! This guide covers local setup and the
project conventions.

## Prerequisites

- Node.js **>= 18**
- npm (the repo ships a `package-lock.json`)

## Setup

```bash
git clone https://github.com/Rovniy/tabs-broadcast.git
cd tabs-broadcast
npm install
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server serving `index.html` (the live demo / manual test page). |
| `npm run build` | Build `dist/` (ESM + UMD + source maps), emit `.d.ts`/`.d.cts`, then type-check. |
| `npm test` | Run the unit tests (Vitest + happy-dom). |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run test:coverage` | Run tests with a V8 coverage report. |
| `npm run test:types` | Type-level tests for the typed-events generic (`tsc` on `tsconfig.typecheck.json`). |
| `npm run lint` / `lint:fix` | Lint (ESLint, flat config + typescript-eslint). |
| `npm run format` / `format:check` | Format / check formatting (Prettier). |
| `npm run check:pkg` | Validate the published package shape (publint). |

## Project layout

```
src/
  index.ts                 # entry: default + named exports, public type re-exports
  types.ts                 # shared types (TPayload, TEventMap, config types, …)
  core/
    config.ts              # default config + namespaced key dictionary + timing
    tabsBroadcast.ts        # public API (on/once/emit/off/use, dispatch, singleton)
    tabsWorker.ts           # election facade — picks a strategy and delegates
    election/
      types.ts             # PrimaryElector interface
      baseElector.ts        # shared tabId/state/transition handling
      webLocksElector.ts    # Web Locks strategy (preferred)
      storageElector.ts     # localStorage heartbeat fallback
      tabId.ts             # collision-resistant id generation
tests/                      # Vitest suites + helpers + type-level tests
```

The central design fact: **the election worker decides who is primary; `BroadcastChannel` carries the
events.** Election bugs live under `core/election/`; message-delivery bugs live in `tabsBroadcast.ts`.

## Testing notes

- Tests run under **happy-dom**. It exposes `navigator.locks` with a `null` `request`, so the default
  suites exercise the **localStorage fallback** elector. The Web Locks path is covered separately by
  mocking `navigator.locks.request` (see `tests/election.weblocks.test.ts`).
- Cross-tab delivery is tested by posting from a second raw `BroadcastChannel` with the same name.
- `TabsBroadcast` is a singleton; use the `useTabsBroadcast()` helper (`tests/helpers.ts`) so each test
  is torn down and `localStorage` is cleared between tests.

## Before opening a PR

1. `npm run lint && npm run format:check`
2. `npm test && npm run test:types`
3. `npm run build` (commit the regenerated `dist/` — the live demo is served from it)
4. Update `README.md` and `CHANGELOG.md` when the public API changes.

## Releasing

Releases are automated: publishing a GitHub Release runs `.github/workflows/publish.yml`, which sets the
version from the tag, builds, and `npm publish`es. Do not bump `version` manually for a release.
