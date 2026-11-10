# YTTracker
An extension to track time on YouTube

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/knnlnielflnfhdohmihofhdelgahgjdb?label=Chrome%20version)
![Chrome Web Store](https://img.shields.io/chrome-web-store/users/knnlnielflnfhdohmihofhdelgahgjdb?label=Chrome%20suers)](https://chrome.google.com/webstore/detail/youtube-tracker/knnlnielflnfhdohmihofhdelgahgjdb)

[![Mozilla Add-on](https://img.shields.io/amo/v/youtube-tracker?label=Firefox%20version)
![Mozilla Add-on](https://img.shields.io/amo/users/youtube-tracker?label=Firefox%20users&color=green)](https://addons.mozilla.org/en-US/firefox/addon/youtube-tracker/)

## Description
This application will track your time spent on YouTube. This data can be viewed rapidly in the popup icon or in a chart.

The data tracked is:
* Two kind of time are recorded:
  * The total time of opened videos. This time is counted when the video page have been loaded.
  * The total time of playing videos. This time is counted when a video is playing.
* The number of videos opened.

The count and time of videos opened are counted only one time per each hour maximum. This is to avoid having unintended reloads of the page bringing up the statistics.

You can also choose to send those data to a server to be able to compare yourself with others. The stats are available [here](https://yttracker.rakambda.fr/).

## Screenshots
<div align="center">
    <p>Popup window:</p>
    <img style="width:65%" src="https://github.com/RakambdaOrg/YTTracker/raw/main/extras/screenshots/popup.png"/>
    <hr style="width:85%"/>
    <p>Chart view:</p>
    <img style="width:75%" src="https://github.com/RakambdaOrg/YTTracker/raw/main/extras/screenshots/chart.png"/>
    <hr style="width:85%"/>
</div>

## Development
Built with [WXT](https://wxt.dev) and TypeScript. See [AGENTS.md](AGENTS.md) for how the code works.

```
pnpm install
pnpm dev            # Chrome with hot reload (pnpm dev:firefox for Firefox)
pnpm check          # type check, lint and tests
pnpm zip            # store zip in .output/ (pnpm zip:firefox, pnpm zip:beta)
```

## Libraries
Chart.js - [https://www.chartjs.org](https://www.chartjs.org)

## Help
If you have any problems with the extension, you can describe the issue [here](https://github.com/RakambdaOrg/YTTracker/issues).
