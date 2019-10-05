$(function () {
	$('#backButton').on("click",function () {
		document.location.href = 'chart.html';
	});

	$('#exportButton').on("click",function () {
		YTTGetConfig(null, function (config) {
			let payload = {};
			payload[YTT_DOWNLOAD_EVENT_DATA_KEY] = config;
			payload[YTT_DOWNLOAD_EVENT_NAME_KEY] = 'YTTExport.json';
			payload[YTT_DOWNLOAD_EVENT_CALLBACK_KEY] = null;
			YTTMessage(YTT_DOWNLOAD_EVENT, payload);
		});
	});

	$('#importButton').on("click",function () {
		$('#importFileInput').trigger("click");
	});

	$('#settingsButton').on("click",function () {
		YTTGetConfig(null, function(conf){
			console.log(conf);
		});
	});

	$('#importFileInput').on("change",function (event) {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function (reader) {
				let importData = function (data) {
					let dataObject;
					try {
						dataObject = JSON.parse(data);
					}
					catch (err) {
						alert('Corrupted file!');
						return;
					}
					if (!confirm('This action will reset all your current data and replace it with the one in the file!\nAre you sure to continue?'))
						return;
					YTTSetConfig(dataObject);
					location.reload();
				};
				importData(reader.target.result);
			};
			reader.readAsText(file);
		}
	});

	$('#resetButton').on("click",function () {
		if (!confirm('This action will wipe all your data!\nAre you sure to continue?'))
			return;
		YTTGetConfig([YTT_CONFIG_USERID], function (config) {
			YTTClearConfig(function () {
				YTTSetConfig(config, function () {
					location.reload();
				});
			});
		});
	});

	YTTGetConfig([YTT_CONFIG_VERSION, YTT_CONFIG_USERID, YTT_CONFIG_SHARE_ONLINE, YTT_CONFIG_USERNAME, YTT_CONFIG_DEBUG_KEY], function (config) {
		$('#validUsername').on("click",function () {
			const newUsername = $('#username').val();
			$.ajax({
				url: 'https://yttracker.mrcraftcod.fr/api/v2/' + encodeURI(config[YTT_CONFIG_USERID]) + '/username',
				data: {
					username: newUsername
				},
				method: 'POST',
				success: function () {
					let newConfig = {};
					newConfig[YTT_CONFIG_USERNAME] = newUsername;
					YTTSetConfig(newConfig);
					alert('Username changed');
				},
				error: function () {
					alert('Failed to change username');
				}
			});
		});

		if (config.hasOwnProperty(YTT_CONFIG_SHARE_ONLINE)) {
			$('#shareStats').prop('checked', config[YTT_CONFIG_SHARE_ONLINE]);
		}

		if (config.hasOwnProperty(YTT_CONFIG_SHARE_ONLINE)) {
			$('#debug').prop('checked', config[YTT_CONFIG_DEBUG_KEY]);
		}

		$('#versionNumber').text(YTTGetVersion());
		$('#UUID').text(config[YTT_CONFIG_USERID] ? config[YTT_CONFIG_USERID] : 'Unknown');
		$('#username').val(config[YTT_CONFIG_USERNAME] ? config[YTT_CONFIG_USERNAME] : '');

		$('#shareStats').on("change",function () {
			const state = document.getElementById('shareStats').checked;
			const newConfig = {};
			newConfig[YTT_CONFIG_SHARE_ONLINE] = state;
			YTTSetConfig(newConfig);
		});

		$('#debug').on("change",function () {
			const state = document.getElementById('debug').checked;
			const newConfig = {};
			newConfig[YTT_CONFIG_DEBUG_KEY] = state;
			YTTSetConfig(newConfig);
		});
	});
});