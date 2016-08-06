$(document).ready(function () {
    function addTooltip(id, text) {
        $('#' + id + '>div>.optionDesc').tipsy({
            gravity: 'n', html: true, title: function () {
                return text;
            }
        });
    }

    addTooltip('optionHandDrawn', 'Draw the chart lines with an hand drawn style');
    addTooltip('optionTheme', 'Choose the theme to apply<hr/><div align="center">Dark:<img style="width:100%;" src="https://raw.githubusercontent.com/MrCraftCod/YTTracker/master/extras/screenshots/chartDark.png"/></div><br/><div align="center">Light:<img style="width:100%;" src="https://raw.githubusercontent.com/MrCraftCod/YTTracker/master/extras/screenshots/chartLight.png"/></div>');
    addTooltip('optionExport', 'Export your datas in a JSON file that you can download');
    addTooltip('optionImport', 'Import a JSON file (!! HIS WILL RESET EVERYTHING AND CAN\'T BE UNDONE !!)');
    addTooltip('optionReset', 'Reset all your current data (!! THIS WILL RESET EVERYTHING AND CAN\'T BE UNDONE !!)');

    $('#backButton').click(function () {
        document.location.href = 'chart.html';
    });

    $('#exportButton').click(function () {
        chrome.storage.sync.get(null, function (config) {
            chrome.downloads.download({
                url: 'data:application/json;base64,' + btoa(JSON.stringify(config)),
                filename: 'YTTExport.json'
            });
        });
    });

    $('#importButton').click(function () {
        $('#importFileInput').click();
    });

    $('#importFileInput').change(function (event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function (reader) {
                var importData = function (data) {
                    var dataObject;
                    try {
                        dataObject = JSON.parse(data);
                    }
                    catch (err) {
                        alert("Corrupted file!");
                        return;
                    }
                    if (!confirm("This action will reset all your current data and replace it with the one in the file!\nAre you sure to continue?")) {
                        return;
                    }
                    chrome.storage.sync.set(dataObject);
                    location.reload();
                };
                importData(reader.target.result);
            };
            reader.readAsText(file);
        }
    });

    $('#resetButton').click(function () {
        if (!confirm("This action will wipe all your data!\nAre you sure to continue?")) {
            return;
        }
        chrome.storage.sync.clear(function () {
            location.reload();
        });
    });

    chrome.storage.sync.get([YTT_CONFIG_THEME, YTT_CONFIG_HANDDRAWN, YTT_CONFIG_VERSION], function (config) {
        function setSelectedTheme(theme) {
            $('#darkTheme').prop('selected', false);
            $('#lightTheme').prop('selected', false);
            $('#' + theme).prop('selected', true);
        }

        function setSelectedHandDrawn(state) {
            $('#handDrawnFalse').prop('selected', false);
            $('#handDrawnTrue').prop('selected', false);
            $('#handDrawn' + state.charAt(0).toUpperCase() + state.slice(1)).prop('selected', true);
        }

        YTTApplyThemeCSS(config[YTT_CONFIG_THEME]);

        switch (config[YTT_CONFIG_THEME]) {
            case 'light':
                setSelectedTheme('lightTheme');
                break;
            case 'dark':
            default:
                setSelectedTheme('darkTheme');
        }

        switch (config[YTT_CONFIG_HANDDRAWN]) {
            case 'true':
                setSelectedHandDrawn('true');
                break;
            case 'false':
            default:
                setSelectedHandDrawn('false');
        }

        $('#versionNumber').text(config[YTT_CONFIG_VERSION] ? config[YTT_CONFIG_VERSION] : 'Unknown');

        $('#themeSelect').change(function () {
            var theme = $('#themeSelect').find(":selected").val();
            YTTApplyThemeCSS(theme);
            var newConfig = {};
            newConfig[YTT_CONFIG_THEME] = theme;
            chrome.storage.sync.set(newConfig);
        });

        $('#handDrawnSelect').change(function () {
            var state = $('#handDrawnSelect').find(":selected").val();
            var newConfig = {};
            newConfig[YTT_CONFIG_HANDDRAWN] = state;
            chrome.storage.sync.set(newConfig);
        });
    });
});