# Changelog

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

