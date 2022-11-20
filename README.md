# YTTracker
An extension to track time on YouTube

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/knnlnielflnfhdohmihofhdelgahgjdb?label=Chrome%20version)
![Chrome Web Store](https://img.shields.io/chrome-web-store/users/knnlnielflnfhdohmihofhdelgahgjdb?label=Chrome%20suers)](https://chrome.google.com/webstore/detail/youtube-tracker/knnlnielflnfhdohmihofhdelgahgjdb)

[![Mozilla Add-on](https://img.shields.io/amo/v/youtube-tracker?label=Firefox%20version)
![Mozilla Add-on](https://img.shields.io/amo/users/youtube-tracker?label=Firefox%20users&color=green)](https://addons.mozilla.org/en-US/firefox/addon/youtube-tracker/)

## Description
This application will track your time spent on YouTube. Those datas can be viewed rapidly in the popup icon or in a chart.

The datas tracked are:
* Two kind of time are recorded:
  * The total time of opened videos. This time is counted when the video page have been loaded.
  * The time time of playing videos. This time is counted when a video is playing.
* The number of videos opened.

The count and time of videos opened are counted only one time per each hour maximum. This is to avoid having unintended reloads of the page bringing up the statistics.

You can also choose to send those data to a server to be able to compare yourself with others. The stats are available [here](https://yttracker.rakambda.fr/).

## Screenshots
<div align="center">
    <p>Popup window:</p>
    <img style="width:65%" src="https://github.com/Rakambda/YTTracker/raw/master/extras/screenshots/popup.png"/>
    <hr style="width:85%"/>
    <p>Chart view:</p>
    <img style="width:75%" src="https://github.com/Rakambda/YTTracker/raw/master/extras/screenshots/chart.png"/>
    <hr style="width:85%"/>
</div>

## Libraries
Amcharts - [https://www.amcharts.com](https://www.amcharts.com)

Bootstrap - [https://getbootstrap.com/](https://getbootstrap.com/)

JQuery - [https://github.com/jquery/jquery](https://github.com/jquery/jquery)

Dropbox SDK - [https://www.dropbox.com/developers/documentation/javascript](https://www.dropbox.com/developers/documentation/javascript)

## Other
Compare versions function from [em92's gist](https://gist.github.com/em92/d58944f21c68b69433cefb6c49e0defd).

Deploy config from [paulmolluzzo/test-deploy-chrome](https://github.com/paulmolluzzo/test-deploy-chrome).

## Help
If you have any problems with the extension, you can describe the issue [here](https://github.com/Rakambda/YTTracker/issues).
