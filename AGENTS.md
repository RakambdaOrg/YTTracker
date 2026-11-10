# AGENTS.md

YouTube Tracker (YTTracker) is a Manifest V3 browser extension for Chrome and Firefox that tracks time spent watching YouTube. It is old code: plain ES6 scripts loaded through `<script>` tags, global functions, jQuery, and no bundler, modules or tests. Don't copy its patterns into new code without checking first.

If `JOURNAL.md` exists, read it first: it tracks the work in progress.

## What it measures

Data is stored per local day, plus a running total:

| Stat | Storage field | How it is counted |
|------|---------------|-------------------|
| Opened time | `total` | The video's full duration, counted once when the video loads, whether or not it is watched. |
| Watched time | `real` | Wall-clock time between a "playing" event and the next "stopped" event. Speed is ignored, so 1h of video watched at 2x counts as 30 min. |
| Video count | `count` | +1 per opened video. |

- An opened video is counted at most once per hour per video ID (`YTT_IDS` holds the timestamp of each video ID's last count). This keeps page reloads from inflating the stats.
- A watched interval that crosses midnight is split across days, going backwards from the stop time (`onVideoStop`).
- Intervals of 500 ms or less are dropped (`YTT_MINIMUM_WATCH_THRESHOLD`).
- Stopped means paused (2), ended (0), buffering (3), a video change (-5, synthetic) or the page unloading (`beforeunload`).
- Intended scope: embedded players (other sites, youtube-nocookie) are tracked. Ads and homepage hover previews must not count. Only `#movie_player` is hooked. How ads are kept out of the count has not been checked.

## How data flows

```
YouTube page (page context)            content script (isolated)          background
hooker.js + hookerUtils.js  --DOM-->   content.js  --runtime.sendMessage-->  service_worker.js --> storage.local
  hooks #movie_player API               watches hidden divs with                                --> yttracker.rakambda.fr (opt-in)
  writes into hidden divs               MutationObserver
```

1. `content.js` runs at `document_start` in every frame on youtube.com, music.youtube.com and youtube-nocookie.com. It appends four hidden divs to `<body>` (`YTTPlayerState`, `YTTPlayerInfos`, `YTTPlayerTime1/2`). It then injects `YTTUtils.js`, `hookerUtils.js` and `hooker.js` as page scripts (web-accessible resources), because the player API is only reachable from the page context.
2. `hooker.js` polls for `#movie_player`, every 250 ms for up to 500 attempts. Once found, it registers `onStateChange` and `onApiChange` listeners. It also writes `getCurrentTime()` into the time divs every 75 ms. `TIME_2` holds the previous tick and is used as the time at stop. Writes go through a Trusted Types policy (`ytTrackerPolicy`) when available.
3. Data goes into the divs as strings separated by `@` (`YTT_DOM_SPLITTER`): `state@time` and `videoId@duration`.
4. `content.js` turns DOM mutations into messages:
   - `playerStateChange` carries state `opened` (it means *playing*, despite the name) or `watched` (it means *stopped*).
   - `playerDuration` fires when a video loads.
5. The background script (`onVideoPlay`, `onVideoStop`, `onVideoOpened`) keeps the start time of each tab that is playing in `YTT_Active_Players`, keyed by tab ID. It updates the day and total records and sets the badge to `P` while something plays.

## Storage (`storage.local`)

- `day<dayOfYear><YYYY>` (e.g. `day3142026`): one day's record, a serialized `YTTDay` `{count, real, total}`. `real` and `total` are serialized `YTTDuration` objects `{milliseconds, seconds, minutes, hours, days, type}`, not plain numbers. Keys are parsed by taking the last 4 characters as the year.
- `YTT_Total`: an all-time `YTTDay`. It is kept up to date separately from the day records, not computed from them.
- Other keys: `YTT_User_ID` (a random UUID), `YTT_Start`, `YTT_IDS`, `YTT_Active_Players`, `YTT_Share_Stats`, `YTT_Failed_Share` (the retry queue), `YTT_Debug`, `YTT_Weird_Data_Threshold` (default 48h), `YTT_Username`, `YTT_Dropbox_Access_Token`, `YTT_Version`.
- `setupExtension()` runs every time the background script starts, including each time Chrome wakes the service worker. It clears `YTT_Active_Players`. In Chrome this happens on every wake-up, and wake-ups happen while a video is playing. A stop that wakes the worker still gets its start time only because the `get` in `onVideoStop` resolves before the reset's `set` runs. Keep that ordering in mind when touching either function. `setupExtension()` also rebuilds `YTT_Total` from the legacy `YTT_TotalTime`/`YTT_RealTime` keys if they exist, and removes keys that are no longer used.
- Renaming any key or changing any stored shape breaks existing users' data and exported files. Any such change needs a migration in `setupExtension()`.

## Pages

- `popup.html`: today's stats, the totals and the start date.
- `chart.html`: an amCharts 4 chart of every day, with totals and averages. It flags days above the weird-data threshold.
- `editHighValues.html`: manual correction of days above that threshold.
- `options.html`: export and import as JSON (file or Dropbox), import of a Google Takeout watch history (counts only), a reset, the share-online toggle, the username shown on the server, and the debug toggle (logs and notifications).

## Online sharing (opt-in)

When `YTT_Share_Stats` is on, each opened or watched duration is POSTed to `https://yttracker.rakambda.fr/api/v2/<uuid>/stats/add`. Requests that fail are queued in `YTT_Failed_Share` and retried on the next send. The username is read and written through `/api/v2/<uuid>/username`.

## Layout

- `includes/`: code shared by both browsers. `js/YTTUtils.js` holds the constants, the `YTTDay`/`YTTDuration` classes and the `chrome.*`/`browser.*` wrappers. It is loaded everywhere, including the page context.
- `includes/service_worker.js`: the Chrome background service worker (`importScripts('js/YTTUtils.js')`).
- `firefox/js/service_worker.js`: the Firefox background script. Firefox loads it through `background.scripts`, not as a service worker. It is a copy of the Chrome file without the `importScripts` line. **Any change to one must be made in the other.**
- `chrome/`, `chromeBeta/`, `firefox/`: one manifest per target. The build copies them over `includes/`. The manifests differ, for example in content-script matches and CSP syntax. `chromeBeta/` is a separate Chrome listing the owner uses for testing.
- Firefox-only leftovers whose purpose is unknown: the content script also runs on `yttracker.rakambda.fr`, and the background script listens to `runtime.onMessageExternal`. Ask before removing them.
- `includes/lib/amcharts4/`: amCharts, committed to the repo. jQuery, Bootstrap 4, Popper and the Dropbox SDK come from `node_modules` and are copied into `temp/lib/` at build time.
- `deploy/`: small Node helper scripts used by the npm scripts.
- `extras/`: design source files (PSD/EPS), not shipped.

## Build and checks

```
npm ci
npm test                 # ESLint only (ES6, tabs, single quotes, semicolons). No unit tests.
npm run chromeBuild      # unpacked build in temp/ (load it via chrome://extensions)
npm run firefoxBuild     # unpacked build in temp/ (load it via about:debugging)
npm run chromePackage    # chromeExtension.zip
npm run firefoxPackage   # firefoxExtension.xpi
npm run chromeRelease    # package + upload to the Chrome Web Store (needs CLIENT_ID/CLIENT_SECRET/REFRESH_TOKEN)
```

- Firefox releases are uploaded by hand to addons.mozilla.org.
- At build time, `!!!VERSION!!!` in the manifest is replaced with the `version` from `package.json`.
- There is no CI workflow. The `.github/` files are synced from `RakambdaOrg/rakambda-github-files` and should not be edited here.
- Each release needs a matching `CHANGELOG.md` entry.
