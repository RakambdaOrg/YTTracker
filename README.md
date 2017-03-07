<p align="center">
    <img alt="YTTracker logo" src="https://rawgit.com/MrCraftCod/YTTracker/master/extras/timer.svg" height="175"/>
</p>
<p>
    <h1 align="center">YTTracker</h1>
    <h3 align="center">An extension to track time on YouTube</h3>
</p>
<p align="center">
    <a alt="Chrome extension" href="https://chrome.google.com/webstore/detail/youtube-tracker/knnlnielflnfhdohmihofhdelgahgjdb"><img alt="Chrome extension" src="https://img.shields.io/chrome-web-store/v/knnlnielflnfhdohmihofhdelgahgjdb.svg?maxAge=2592000&style=flat" /></a>
    <a alt="Firefox Addon" href="https://addons.mozilla.org/en-US/firefox/addon/youtube-tracker/"><img alt="Firefox Addon" src="https://img.shields.io/amo/v/youtube-tracker.svg?maxAge=2592000&style=flat" /></a>
    <a alt="Build Status" href="https://travis-ci.org/MrCraftCod/YTTracker"><img alt="Build status" src="https://img.shields.io/travis/MrCraftCod/YTTracker/master.svg?maxAge=2592000&style=flat"/></a>
    <a alt="GitHub issues" href="https://github.com/mrcraftcod/yttracker/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/mrcraftcod/yttracker.svg?style=flat"/></a>
    <a alt="GitHub Release" href="https://github.com/mrcraftcod/yttracker/releases"><img alt="GitHub Release" src="https://img.shields.io/github/tag/mrcraftcod/yttracker.svg?label=%20tag%20&style=flat"/></a>
</p>

## Description
This application will track your time spent on YouTube. Those datas can be viewed rapidly in the popup icon or in a chart.

The datas tracked are:
* Two kind of time are recorded:
  * The total time of opened videos. This time is counted when the video page have been loaded.
  * The time time of playing videos. This time is counted when a video is playing.
* The number of videos opened.

The count and time of videos opened are counted only one time per each hour maximum. This is to avoid having unintended reloads of the page bringing up the statistics.

You can also choose to send those data to a server to be able to compare your self with others. The stats are available [here](https://yttracker.mrcraftcod.fr/).

## Screenshots
<div align="center">
    <p>Popup window:</p>
    <img style="width:65%" src="https://github.com/MrCraftCod/YTTracker/raw/master/extras/screenshots/popup.png"/>
    <hr style="width:85%"/>
    <p>Chart view (dark theme):</p>
    <img style="width:75%" src="https://github.com/MrCraftCod/YTTracker/raw/master/extras/screenshots/chartDark.png"/>
    <hr style="width:85%"/>
    <p>Chart view (light theme):</p>
    <img style="width:75%" src="https://github.com/MrCraftCod/YTTracker/raw/master/extras/screenshots/chartLight.png"/>
</div>


## Development/Beta releases
[Chrome beta version](https://chrome.google.com/webstore/detail/youtube-tracker/moboafdnejnjnppicfiadaalobjeemec): <a alt="Chrome extension" href="https://chrome.google.com/webstore/detail/youtube-tracker/moboafdnejnjnppicfiadaalobjeemec"><img alt="Chrome extension" src="https://img.shields.io/chrome-web-store/v/moboafdnejnjnppicfiadaalobjeemec.svg?maxAge=2592000&style=flat" /></a>

## Libraries
Amcharts - [https://www.amcharts.com](https://www.amcharts.com)

CSS Element Queries - [https://github.com/marcj/css-element-queries](https://github.com/marcj/css-element-queries)

JQuery - [https://github.com/jquery/jquery](https://github.com/jquery/jquery)

JQuery tipsy - [https://github.com/jaz303/tipsy](https://github.com/jaz303/tipsy)

Moment JS - [https://github.com/moment/moment](https://github.com/moment/moment)

Tipsy - [https://github.com/jaz303/tipsy](https://github.com/jaz303/tipsy)

##Other
Compare versions function from [em92's gist](https://gist.github.com/em92/d58944f21c68b69433cefb6c49e0defd).

Deploy config from [paulmolluzzo/test-deploy-chrome](https://github.com/paulmolluzzo/test-deploy-chrome).

## Help
If you have any problems with the extension, you can describe the issue [here](https://github.com/MrCraftCod/YTTracker/issues).
