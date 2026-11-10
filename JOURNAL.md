# JOURNAL.md

Working log for the current batch of changes. Read it before starting, and update it after each step. Delete it once every requested feature is done.

- Worktree: `.claude/worktrees/work`, branch `rewrite/wxt`
- Background: see `AGENTS.md`

## Requested features

Full rewrite in TypeScript with WXT. The approved plan is in `PLAN.md`; follow its steps 1-8 and commit after each one.

## Current step

Done: `AGENTS.md` written and reviewed with the user (not committed yet).

Done: step 1 (scaffold builds chrome-mv3, chrome-mv3-beta, firefox-mv3; old `includes/` etc. kept as reference until step 8).

Done: step 2 (`src/lib/stats.ts`, `storage.ts`, `migration.ts`, `format.ts` + tests, `pnpm check` green).

Done: step 3 (hook, relay, background, tracker + tests) and step 7 (`api.ts` online sharing; username calls ready for the options page).

Now: step 4 (popup and edit page).

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

## Notes for later steps

- Export uses `<a download>` + Blob, so the `downloads` permission is dropped.
- Unused icons `barIcon.png` and `icon128mask.png` deleted.
- Check at release: AMO may require `browser_specific_settings.gecko.data_collection_permissions` (online sharing is optional data collection). Ask the user.
- Old chart zoom (amCharts scrollbar, default last 7 days) becomes a period selector (7d/30d/1y/all) that drives the "selected period" card.
- Hook changes vs old code, to check in the manual test:
  - It keeps polling for `#movie_player` (the old code gave up after about 2 minutes).
  - "Opened" is sent once the duration is known, or when the video plays (live streams).
  - `ad-showing` play events count as a stop, and video changes during ads are ignored.
- Background: storage updates go through a serial queue. Active players are keyed `tabId:frameId` in `storage.session`. `tabs.onRemoved` finishes the players of a closed tab.
- Notifications (debug) need the optional permission: request it when debug is enabled in options (step 6).
