# YTTracker rewrite: TypeScript + WXT

## Context

Today the extension is ~2,200 lines of global-function JS, jQuery, no bundler and no tests. The Chrome and Firefox background scripts are hand-copied duplicates, and there are three manifests. An earlier attempt (`origin/typescript`, July 2025) stalled. It hand-built the tooling (webpack + copy plugin + polyfill), only targeted Chrome, never ported the pages, and introduced a bug: a short watch adds the time since midnight instead of the time watched.

Goal: one typed codebase that builds for both browsers, is easy to maintain, and has tests for the counting logic.

Decisions made with the user:
- **WXT** as the framework. It handles the cross-browser layer, manifests, build, zip and submit.
- **Vanilla TypeScript** pages, without jQuery or a framework.
- Keep online sharing, Dropbox and the Takeout import. **Drop** the Firefox leftovers (the content script on `yttracker.rakambda.fr` and `onMessageExternal`).
- **Migrate the storage** to a simple format, with a one-time migration. Old export files can still be imported.

From `origin/typescript`, reuse only the ideas (typed message objects, the class split). Don't reuse its code.

## Approach

Work in `.claude/worktrees/work`. Rename the branch `claude/work` to `rewrite/wxt` and commit after each step. Use pnpm (global via mise). Replace the old `includes/`, `chrome*/`, `firefox/` and `deploy/` folders and the npm scripts once the new build works.

### Layout
```
wxt.config.ts               manifest per browser/mode (Chrome key, gecko id, beta mode = chromeBeta key/name)
entrypoints/
  background.ts             message router, badge, setup + migration on install/update
  youtube.content.ts        isolated world, all_frames, document_start: relays hook events to background, sends stop on pagehide
  youtube-hook.content.ts   world: "MAIN": hooks #movie_player (onStateChange/onApiChange), posts typed events via window.postMessage
  popup/  chart/  options/  edit/    index.html + main.ts each (chart/edit as unlisted pages)
lib/
  storage.ts    typed items (wxt/storage): day:YYYY-MM-DD → {count, watchedMs, openedMs}, total, settings, failed-share queue
  stats.ts      pure logic: dedupe opened (1h per video ID), split a watched interval across days, 500 ms threshold
  migration.ts  old format → new; also used by import for old export files
  messages.ts   discriminated union of messages + type guard (no messaging library)
  api.ts        yttracker.rakambda.fr v2 (add stats, username, retry queue)
  dropbox.ts    reuse the auth flow from includes/js/utils/dropboxUtils.js; replace the SDK with fetch on its 2 file endpoints
  takeout.ts    port of the Takeout import from options.js
  format.ts     duration and date display (fixes the +1 day bug)
public/assets/  current icons
```

### Key design points
- **Hidden divs and 75 ms polling go away.** A main-world content script sends events (`play`, `stop`, `opened {videoId, durationSec}`) through `window.postMessage` with a source tag. The isolated script validates their shape before forwarding them, because the page can forge them, as it can today. This needs Firefox ≥ 128, so `strict_min_version` goes from 109 to 128 (128 is an ESR).
- **Active players go to `storage.session`.** It survives service-worker wake-ups and is cleared when the browser restarts. This removes the "reset on every wake" ordering hack.
- **Counting rules stay exactly as documented in `AGENTS.md`**, with one exception: the active-player key becomes `tabId:frameId`, so embedded players in different frames don't overwrite each other.
- **Storage migration.** A `schemaVersion` item is checked in `runtime.onInstalled`, and on startup as a fallback. The migration converts the `dayNNNYYYY` keys and `YTTDuration` objects to ms numbers and the legacy `YTT_TotalTime`/`YTT_RealTime` keys to the total. It writes the new keys before removing the old ones, so a crash halfway loses nothing and a rerun doesn't double-count.
- **Export and import.** The new export carries `{version: 2, ...}`. Import detects version 1 (no version field) and runs it through `migration.ts`.
- **Chart.** Replace amCharts 4 (huge, committed to the repo, legacy) with Chart.js from npm. It shows the same data: daily bars, totals, averages, and a flag on days above the threshold.
- **Pages.** Plain DOM and one small shared CSS file, without Bootstrap.
- **Ads.** During manual testing, check whether ads count today. If they do, ignore state changes while `#movie_player` has the `ad-showing` class.

### Bugs from JOURNAL.md this removes
The rewrite fixes all 8: the +1 day date, the debug checkbox guard, the Dropbox disconnect, the edit page's `$(this)` and missing `YTT_Total` update, the `glob@latest` packaging, the MV3 CSP keys (WXT generates them), the unused `xo`, and the active-players reset.

### Steps (one commit each)
1. Scaffold WXT + TS strict + Vitest + ESLint (typescript-eslint, no-unsanitized), and `wxt.config.ts` with both browsers and beta mode. Build an empty extension for both browsers.
2. `lib/stats.ts`, `storage.ts`, `migration.ts`, with unit tests (WXT fake browser). Migration fixtures built from the documented old shapes.
3. Main-world hook, content relay, background router and badge. Watch tracking works end-to-end.
4. Popup and edit page.
5. Chart page.
6. Options: export/import (file + Dropbox), Takeout, reset, share toggle, username, debug.
7. `api.ts` online sharing + retry queue.
8. Delete the old code, scripts and deps. Update `AGENTS.md`, `README`, `CHANGELOG` (4.0.0), `Mozilla-libs.txt`. Release scripts: `wxt zip -b chrome|firefox`, `wxt submit` for Chrome (same env vars).

## Verification
- `pnpm test` (Vitest): opened dedupe, midnight split across 1 and several days, threshold, migration of old data (including a rerun after a partial migration), old export import.
- `pnpm compile` (`tsc --noEmit`) and `pnpm lint`.
- `pnpm build -b chrome` and `-b firefox`: check the generated manifests (gecko id, Chrome key, background type, MAIN-world script).
- Manual test, by the user (the container has no browser). Load `.output/chrome-mv3` and `.output/firefox-mv3`, then:
  - Watch, pause and resume. Check the popup numbers.
  - Embedded video on another site, youtube-nocookie and music.youtube.com.
  - An ad must not count, and a homepage hover preview must not count.
  - Migration: load the new build over an install with existing data (or import a real old export). Check that the numbers match.
- Ask the user for a real old export file to use as a migration fixture.
