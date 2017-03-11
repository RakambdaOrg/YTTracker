function YTTGetConfig(values, callback)
{
    chrome.storage.sync.get(values, callback);
}