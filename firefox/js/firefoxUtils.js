function YTTGetConfig(values, callback)
{
    browser.storage.sync.get(values).then(callback);
}

function YTTDownload(value, name)
{
    //TODO: Download on firefox
}

function YTTSetConfig(config)
{
    browser.storage.sync.set(config);
}

function YTTClearConfig(callback)
{
    browser.storage.sync.clear();
    if(callback !== null)
        callback();
}