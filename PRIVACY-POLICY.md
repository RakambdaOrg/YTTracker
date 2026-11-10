# Privacy Policy

_Last updated: November 10, 2026_

This policy explains what data the YouTube Tracker extension ("YTTracker", "the extension") handles, where it goes, and how you control it. YTTracker is a free, open-source extension for Chrome and Firefox, developed by Thomas Couchoud. Its source code is public at [github.com/RakambdaOrg/YTTracker](https://github.com/RakambdaOrg/YTTracker), and the server code at [github.com/RakambdaOrg/YTTrackerWeb](https://github.com/RakambdaOrg/YTTrackerWeb).

**In short:** by default, everything stays in your browser and nothing is sent anywhere. Data leaves your browser only if you turn on online sharing, or if you choose to export to Dropbox. YTTracker keeps no history of which videos you watch, has no ads and no analytics, and never sells or shares data.

## Data stored in your browser

While you use YouTube (youtube.com, music.youtube.com, youtube-nocookie.com and embedded YouTube players), the extension records, for each day:

- **Opened time:** the total length of the videos you opened.
- **Watched time:** how long videos were actually playing.
- **Opened count:** how many videos you opened.

To work, it also stores:
- A random identifier created at installation, which is not linked to your identity.
- The date you started using it, and your settings.
- For one hour, the IDs of the videos you just opened, so that a reload doesn't count them twice. They are then deleted.
- While a video plays, when it started.

This data is kept in your browser's extension storage, on your device only. It is not synced through your browser account and is never sent to the developer. It is kept until you reset it from the options page or uninstall the extension.

The extension doesn't read your YouTube account, comments, searches, video titles or anything else on the page. It only reads the state of the video player: whether it is playing, the video's ID and its length.

## Online sharing (optional, off by default)

If you turn on **Send stats online** in the options, the extension sends your stats to the YTTracker server at `yttracker.rakambda.fr`. The public statistics page there lets users compare themselves with each other. On Firefox 140 and newer, Firefox also asks for your consent.

**What is sent:**
- Each time you open or watch a video: the kind of stat (opened or watched), the duration in milliseconds, and the date and time.
- Your random identifier.
- The username you choose, if you set one. Without one, you are shown as "Anonymous".

**What is not sent:** video IDs, titles, URLs, or anything else from YouTube or your browser.

**What the server keeps:**
- Your random identifier and username.
- The time of your last activity.
- For each day, the summed opened time, watched time and count. The time of day is dropped.

**Who can see it:** shared stats are **public**. Anyone can see the usernames, and the stats linked to each identifier, on the statistics page and through its API. Pick a username you are happy to make public.

Like any web server, the server's host keeps standard access logs, which include your IP address. These logs are not linked to your stats and are not used to identify you.

**Stopping and deletion:** turn the option off to stop sending immediately. On Firefox, you can also withdraw consent in `about:addons`. Data already sent is kept on the server. To have it deleted, email the address below with your identifier, which is shown at the bottom of the options page.

## Dropbox export (optional)

If you use **Export to Dropbox** or **Import from Dropbox**, the extension asks you to log in to Dropbox. It then reads and writes export files in its own app folder in **your** Dropbox account. Exports contain the data described in "Data stored in your browser", but never the Dropbox login itself.

The Dropbox login (a refresh token) is stored in your browser only, so the developer never has access to your Dropbox. **Forget Dropbox login** in the options deletes it from your browser and, when it can, revokes it at Dropbox. Dropbox's own [privacy policy](https://www.dropbox.com/privacy) applies to the files you store there.

## Files you import

Export files, and Google Takeout YouTube history files you import, are read inside your browser. Only the stats they contain are kept: from a Takeout file, the number of videos per day. Nothing from these files is sent anywhere.

## Permissions

| Permission | Why |
|------------|-----|
| Access to the YouTube sites | Read the video player's state to measure time. |
| `storage`, `unlimitedStorage` | Keep your stats in your browser, without a size limit for long histories. |
| `identity` | Log in to Dropbox, only when you use Dropbox export or import. |
| Access to `yttracker.rakambda.fr` | Send stats, only when online sharing is on. |
| `notifications` (optional) | Show debug notifications, only if you turn on debug mode and allow them. |

## Children

The extension is not directed at children and doesn't knowingly collect data from them. Online sharing needs an explicit choice and doesn't collect any identity information.

## Changes

Changes to this policy are published in this file, with its full history visible on GitHub. The date at the top shows the last change. A change that sends more data than described here will be announced in the extension's changelog, and will stay off until you opt in.

## Contact

For questions, or to have your shared data deleted: zerderr@gmail.com
