function YTTGetConfig(values, callback)
{
    chrome.storage.sync.get(values, callback);
}

function YTTDownload(value, name)
{
    chrome.downloads.download({
        url: value,
        filename: name
    });
}

function YTTSetConfig(config)
{
    chrome.storage.sync.set(config);
}

function YTTClearConfig(callback)
{
    chrome.storage.sync.clear(callback);
}