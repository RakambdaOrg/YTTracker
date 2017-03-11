function YTTGetConfig(values, callback)
{
    browser.storage.sync.get(values).then(callback);
}