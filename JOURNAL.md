# JOURNAL.md

Working log for the current batch of changes. Read it before starting, and update it after each step. Delete it once every requested feature is done.

- Worktree: `.claude/worktrees/work`, branch `rewrite/wxt`
- Background: see `AGENTS.md`

## Requested features

Full rewrite in TypeScript with WXT. The approved plan is in `PLAN.md`; follow its steps 1-8 and commit after each one.

## Current step

Done: `AGENTS.md` written and reviewed with the user (not committed yet).

Now: step 1 (WXT scaffold).

## Decisions

- Document the existing behaviour first. Decide later whether to keep the online stats server, Dropbox and the Takeout import.
- Ads and hover previews must not count. Embedded players must count.

- WXT, vanilla TS pages, Chart.js instead of amCharts. Keep online sharing, Dropbox, Takeout. Drop the Firefox leftovers. Migrate storage to `day:YYYY-MM-DD` + ms numbers.

## Bugs found, to raise with the user later

- `YTTGetDateString` adds +1 to the day, so the popup start date and the edit page show the next day.
- `options.js`: the debug checkbox is guarded by `hasOwnProperty(YTT_CONFIG_SHARE_ONLINE)`.
- `options.js`: the Dropbox disconnect `YTTRemoveConfig[DROPBOX_API_KEY]` is never called, and uses the wrong key.
- `editHighValues.js`: the "opened" button uses an arrow function with `$(this)`, so it targets the wrong element. Edits don't update `YTT_Total`.
- `deploy/removeUselessFilesForStores.js` calls `require('glob')` as a function, but glob is pinned to `latest`. Packaging probably fails.
- Chrome manifests: the CSP uses `script-src`/`object-src` keys instead of MV3's `extension_pages`.
- `xo` devDependency unused.
- Chrome MV3: `setupExtension()` resets `YTT_Active_Players` on each service-worker wake. It only works because of async ordering.
