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

    $('#backButton').click(function(){
        document.location. href = 'chart.html';
    });

    chrome.storage.sync.get([YTT_CONFIG_THEME, YTT_CONFIG_HANDDRAWN], function (config) {
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