# AGENTS.md

YouTube Tracker (YTTracker) is a Manifest V3 browser extension for Chrome and Firefox that tracks time spent watching YouTube. It is written in TypeScript and built with [WXT](https://wxt.dev) (Vite). One codebase builds every browser. Browser differences live only in `wxt.config.ts`.

If `JOURNAL.md` exists, read it first: it tracks the work in progress.

## What it measures

Data is stored per local day, plus a running total:

| Stat | Field | How it is counted |
|------|-------|-------------------|
| Opened time | `openedMs` | The video's full duration, counted once when the video loads, whether or not it is watched. |
| Watched time | `watchedMs` | Wall-clock time between a "play" event and the next "stop" event. Speed is ignored, so 1h of video watched at 2x counts as 30 min. |
| Video count | `count` | +1 per opened video. |

- An opened video is counted at most once per hour per video ID (`openedIds` holds the time of each ID's last count). This keeps reloads from inflating the stats.
- A watched interval that crosses midnight is split on real local midnights, so DST is handled (`splitByDay`).
- Intervals of 500 ms or less are dropped.
- "Stop" means: paused, ended or buffering; a video change in the same player; an ad starting; the page being hidden (`pagehide`); or the tab closing.
- Ads don't count: while `#movie_player` has the `ad-showing` class, play events count as a stop, and video changes are ignored.
- Embedded players (other sites, youtube-nocookie) and music.youtube.com are tracked. Only `#movie_player` is hooked, so homepage hover previews should not count.

## How data flows

```
YouTube page (MAIN world)              content script (isolated)         background
youtube-hook.content.ts  --postMessage-->  youtube.content.ts  --runtime.sendMessage-->  background.ts -> lib/tracker.ts
  polls for #movie_player                  validates (toMessage)                          storage.local / storage.session
  listens to onStateChange/onApiChange     sends "stop" on pagehide                       yttracker.rakambda.fr (opt-in)
```

1. Both content scripts run at `document_start` in every frame of the YouTube domains (`src/lib/youtube.ts`).
2. The hook runs in the page's main world, because the player API is only reachable there. It polls for `#movie_player` every 250 ms until it appears, then posts `HookEvent`s (`opened`, `play`, `stop`) with `window.postMessage`. "Opened" is sent once per video, as soon as its duration is known, or when it plays (live streams).
3. The isolated script checks each event with `toMessage()` (`src/lib/messages.ts`), because the page can forge them, then forwards it to the background.
4. The background identifies the player as `tabId:frameId` and runs each message through `lib/tracker.ts`. All storage updates go through one serial queue (`lib/serial.ts`), so concurrent events never overwrite each other.
5. The start time of each playing player is kept in `storage.session` (`activePlayers`). It survives Chrome service-worker restarts and is cleared with the browser. The badge shows `P` while something plays.

## Storage

Typed items are in `src/lib/storage.ts`, written with `wxt/utils/storage`.

- `storage.local`:
  - `day:YYYY-MM-DD`: one day's `DayStats` `{count, watchedMs, openedMs}`, in plain milliseconds.
  - `total`: an all-time `DayStats`. It is kept up to date separately from the days, not computed from them.
  - `schemaVersion` (currently 2), `userId` (a random UUID), `startTime`, `openedIds`, `shareOnline`, `failedShare` (the retry queue), `debug`, `weirdThreshold` (default 48h), `dismissedWeirdDays` (days marked as correct on the edit page), `username`, `dropboxRefreshToken`.
- `storage.session`: `activePlayers`, `dropboxAccess` (the short-lived Dropbox access token).
- **Migration** (`src/lib/migration.ts`): `migrateStorage()` runs on every background start. When the schema is current, it costs one small read. It converts the v1 format (`day<dayOfYear><YYYY>` keys, `YTTDuration` objects, `YTT_*` keys) and writes `schemaVersion` last, so an interrupted run simply starts over. Any future change to a key or a stored shape needs a new schema version and a step there.
- **Export/import**: an export is `{version: 2, data}`, without the Dropbox token. Import takes v2 files and old v1 files (`parseImport`), validates every value, and replaces all data while keeping the current `userId` when the file has none.

## Pages

Pages are vanilla TypeScript, without a framework. Use `el()`/`byId()` from `src/lib/dom.ts` and never `innerHTML` (ESLint `no-unsanitized` enforces this). The shared styles are in `src/assets/common.css`, with light and dark themes through CSS variables.

- `popup`: the videos playing now (from `activePlayers`, with the title sent by the hook; clicking one focuses its tab), today's stats, the totals and the start date.
- `chart` (unlisted): a Chart.js chart, with totals, averages, a period selector, a vertical line on the hovered day, and an alert for days whose watched time is above `weirdThreshold` (`weirdDays()`; opened time is never flagged, since opening long videos is normal).
- `edit` (unlisted): lowers the watched time of flagged days and adjusts `total` by the same amount, or marks a day as correct so it is not flagged again.
- `options`: export and import (file or Dropbox), the Google Takeout import (counts only, and only for days with no data), a reset that keeps `userId`, the share toggle and username, and debug mode (console logs, plus notifications if the optional permission is granted).

## Online sharing (opt-in)

When `shareOnline` is on (and, on Firefox 140+, the `websiteActivity` data consent is granted: see `canShare()`), each opened or watched duration is POSTed to `https://yttracker.rakambda.fr/api/v2/<uuid>/stats/add` as `{type, stat: ms, date: "Y-M-D H:m:s"}` (`src/lib/api.ts`). Failed requests are queued in `failedShare` and retried on the next send. The username is read and written through `/api/v2/<uuid>/username`.

## Dropbox

`src/lib/dropbox.ts` calls the Dropbox HTTP API directly, without the SDK. It logs in with the OAuth authorization code flow with PKCE and `token_access_type=offline`, through `identity.launchWebAuthFlow`. The refresh token is kept in `storage.local`, so the user logs in once. The redirect URI (`identity.getRedirectURL()`) must be registered in the Dropbox app. A 401 response triggers one token refresh, then a new login if the refresh token was revoked. Each login passes `force_reapprove`, so after "Forget Dropbox login" (which revokes the token at Dropbox) the user sees the Dropbox page again instead of a silent re-login. The old v1 access token is not migrated. Exports are named `YTTracker.<timestamp>.json`, and import takes the newest one.

## Layout

- `wxt.config.ts`: the manifest for every target. Chrome gets its store `key`, and `--mode beta` switches to the beta listing's key and name. Firefox gets its gecko ID and `strict_min_version` 128, the first version that supports MAIN-world content scripts.
- `src/entrypoints/`: the background, the two content scripts and the four pages.
- `src/lib/`: everything else, with a `*.test.ts` next to each file that has logic.
- `public/assets/`: the icons.
- `extras/`: design source files and screenshots, not shipped.

## Build and checks

```
pnpm install
pnpm dev / dev:firefox      # run in a browser with hot reload (needs a desktop browser)
pnpm check                  # tsc, ESLint (strict type-checked) and Vitest
pnpm build / build:firefox / build:beta   # unpacked builds in .output/
pnpm zip / zip:firefox / zip:beta         # store zips (Firefox also gets a sources zip for AMO)
```

- Tests use WXT's fake browser and run in the `Europe/Paris` time zone (set in `vitest.config.ts`), so that DST cases are tested.
- TypeScript is pinned to 6.0 because typescript-eslint does not support TypeScript 7 yet.
- Releases: publishing a GitHub release runs `.github/workflows/release.yml`. Its tag (like `4.0.0`) sets the version (the `package.json` version is only used for local builds), and its notes, generated from merged pull requests by label (`.github/release.yml`), are the changelog: give each pull request a clear title and an `Enhancement` or `Bug` label. Each store has its own job: the Chrome zip is submitted with the service-account secrets, and the Firefox and sources zips go to addons.mozilla.org with the AMO API secrets, with `Mozilla-libs.txt` as the reviewer note and the GitHub release notes as release notes (see README "Technical notes").
- CI (`.github/workflows/ci.yml`) runs `pnpm check` and builds both zips on every pull request and on pushes to `main`. Actions are pinned by commit SHA, like the shared `RakambdaOrg/rakambda-github-workflows`.
- `CODEOWNERS`, `dependabot.yml` and `ISSUE_TEMPLATE/` are synced from `RakambdaOrg/rakambda-github-files` and should not be edited here.

## Commits

- Make one commit per functional change, so each one can be reviewed on its own. When a request lists several changes (for example five UI tweaks), commit each one separately instead of grouping them.
- Each commit must pass `pnpm check`, and include the tests and docs for its own change.
