# Changelog

## [4.0.0] - Unreleased

- Rewrite in TypeScript with WXT: one codebase for Chrome and Firefox
- Stored data moves to a simpler format; it is migrated automatically and old export files can still be imported
- Fix the start date shown one day late
- Fix "Forget Dropbox login" and expired Dropbox logins
- Fix editing high values: the total now follows the edit
- Fix watch time that could be lost when the Chrome background restarts, or when several embedded players play in one tab
- Ads no longer count as watched time
- The player is found even when a video is opened long after the page loaded
- Chart page uses Chart.js, with a period selector; pages follow the system dark mode
- Firefox 128 or newer is required
- The downloads permission is no longer needed

## [3.1.3] - 2025-07-05

- Add support for youtube music

## [3.1.2] - 2024-08-28

- Add support for youtube-nocookie

## [3.1.1] - 2023-08-10

- Fix chrome untrusted html

## [3.1.0] - 2022-12-29

- Firefox manifest V3

## [3.0.3] - 2022-12-29

- Fix chrome export to file

## [3.0.2] - 2022-11-20

- Domain name change

## [3.0.1] - 2022-04-03

- Update dependencies

## [3.0.0] - 2021-11-24

- Use manifest V3 for chrome

## [2.3.0] - 2020-10-24

- Update dependencies
- Exporting config asks where to save it
- Import data from Dropbox

## [2.2.6] - 2020-08-01

- Update dependencies

## [2.2.4] - 2019-12-13

- Update Amcharts to 4.7.14.
- Update libraries to those from their respective GitHub repositories.

## [2.2.3] - 2019-11-16

- Update Amcharts to 4.7.10.
- Do not count play time if less than 500ms.

## [2.2.2] - 2019-11-09

- Try to avoid sending watched time twice when switching video.
- Do not attempt to hook forever.
- If username is empty, send null to the server instead of `Anonymous`.

## [2.2.1] - 2019-11-08

- Update Amcharts to 4.7.8.
- Improve player detection.

## [2.2.0] - 2019-11-07

- Update Amcharts to 4.7.7.
- When watching a video across several days the time is split between these days instead of all being on the last day  (#15).
- Added a button in the settings to export the data directly on Dropbox (#10).

## [2.1.3] - 2019-10-08

- Change the way tabs are opened from the popup.

## [2.1.2] - 2019-10-08

- Added the option to edit data that is rather high. This is a way to avoid having very high values from bugs that pollute the stats and chart (#11).

## [2.1.1] - 2019-10-07

This update is only for firefox and doesn't bring any changes for the user.

- Chnaged the file of library jQuery to match original SHA256 and avoid having its line endings going from `LF` to `CRLF`.

## [2.1.0] - 2019-10-07

- Added more detains in the option page to describe what the buttons do (#7).
- Added the option to import the YouTube watch history (#5).

## [2.0.2] - 2019-10-07

- Fixed #3, chrome popup being higher than it should.

## [2.0.1] - 2019-10-05

This update is only for firefox and doesn't bring any changes for the user.

- Removed unused library files in release file.

## [2.0.0] - 2019-10-05

- Major rework of the UI using Bootstrap 4.
- Fixed #1, stats having too many decimal places in the chart view.
- Fixed #2, firefox users not able to export data.
- Updated AmCharts
- Removed some libraries.

