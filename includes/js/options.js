$(function () {
	$('#backButton').on('click', function () {
		document.location.href = 'chart.html';
	});

	$('#exportButton').on('click', function () {
		YTTGetConfigForExport(function (config) {
			let payload = {};
			payload[YTT_DOWNLOAD_EVENT_DATA_KEY] = config;
			payload[YTT_DOWNLOAD_EVENT_NAME_KEY] = 'YTTExport.json';
			payload[YTT_DOWNLOAD_EVENT_CALLBACK_KEY] = null;
			YTTMessage(YTT_DOWNLOAD_EVENT, payload);
		});
	});

	$('#importFileInput').on('change', function (event) {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function (reader) {
				let importData = function (data) {
					let dataObject;
					try {
						dataObject = JSON.parse(data);
					} catch (err) {
						alert('Corrupted file!');
						return;
					}
					if (!confirm('This action will reset all your current data and replace it with the one in the file!\nAre you sure to continue?'))
						return;
					YTTSetConfig(dataObject, function () {
						location.reload();
					});
				};
				importData(reader.target.result);
			};
			reader.readAsText(file);
		}
	});

	$('#importYoutubeFileInput').on('change', function (event) {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function (reader) {
				let importData = function (data) {
					let dataObject;
					try {
						dataObject = JSON.parse(data);
					} catch (err) {
						alert('Corrupted file!');
						return;
					}
					YTTGetConfig(null, function (config) {
						let foundCount = 0;
						let newConf = {};
						newConf[YTT_CONFIG_TOTAL_STATS_KEY] = new YTTDay(config[YTT_CONFIG_TOTAL_STATS_KEY]);
						if (typeof dataObject === 'object') {
							for (let objKey in dataObject) {
								if (dataObject.hasOwnProperty(objKey)) {
									const obj = dataObject[objKey];
									if (obj['time'] && obj['titleUrl']) {
										const dayKey = YTTGetDayConfigKey(new Date(obj['time']));
										if (!config[dayKey]) {
											if (!newConf[dayKey]) {
												newConf[dayKey] = new YTTDay();
											}
											newConf[dayKey].addCount(1);
											newConf[YTT_CONFIG_TOTAL_STATS_KEY].addCount(1);
											foundCount++;
										}
									}
								}
							}
						}
						if (confirm('Found ' + foundCount + ' days with watch count we can import. Proceed?')) {
							YTTSetConfig(newConf, function(){
								alert("Done");
							});
						}
					});
				};
				importData(reader.target.result);
			};
			reader.readAsText(file);
		}
	});

	$('#resetButton').on('click', function () {
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
		$('#validUsername').on('click', function () {
			let newUsername = $('#username').val();
			if(newUsername === ""){
				newUsername = "Anonymous";
			}
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

		$.ajax({
			url: 'https://yttracker.mrcraftcod.fr/api/v2/' + encodeURI(config[YTT_CONFIG_USERID]) + '/username',
			data: {
			},
			method: 'GET',
			success: function (data) {
				if(data && data.code === 200 && data.username){
					$('#username').val(data.username);
					let newConfig = {};
					newConfig[YTT_CONFIG_USERNAME] = data.username;
					YTTSetConfig(newConfig);
				}
			},
			error: function () {
				console.error('Failed to fetch online username');
			}
		});

		$('#shareStats').on('change', function () {
			const state = document.getElementById('shareStats').checked;
			const newConfig = {};
			newConfig[YTT_CONFIG_SHARE_ONLINE] = state;
			YTTSetConfig(newConfig);
		});

		$('#debug').on('change', function () {
			const state = document.getElementById('debug').checked;
			const newConfig = {};
			newConfig[YTT_CONFIG_DEBUG_KEY] = state;
			YTTSetConfig(newConfig);
		});
	});

	if(typeof browser === 'undefined')
		$('#exportDropboxSection').css('visibility','hidden');

	$('#exportDropboxButton').on('click', function () {
		exportSettingsToDropbox();
	});
});