$(() => {
	const shareStatsCheck = $('#shareStats');
	const debugCheck = $('#debug');

	$('#backButton').on('click', () => {
		document.location.href = 'chart.html';
	});

	$('#exportButton').on('click', () => {
		YTTGetConfigForExport().then(config => {
			let payload = {};
			payload[YTT_DOWNLOAD_EVENT_DATA_KEY] = config;
			payload[YTT_DOWNLOAD_EVENT_NAME_KEY] = 'YTTExport.json';
			payload[YTT_DOWNLOAD_EVENT_CALLBACK_KEY] = null;
			YTTMessage(YTT_DOWNLOAD_EVENT, payload);
		});
	});

	$('#importFileInput').on('change', event => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = reader => YTTImportConfig(reader.target.result);
			reader.readAsText(file);
		}
	});

	$('#importDropboxButton').on('click', () => importSettingsFromDropbox());

	$('#importYoutubeFileInput').on('change', event => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = reader => {
				let importData = data => {
					let dataObject;
					try {
						dataObject = JSON.parse(data);
					} catch (err) {
						alert('Corrupted file!');
						return;
					}
					YTTGetConfig(null).then(config => {
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
						if (confirm(`Found ${foundCount} days with watch count we can import. Proceed?`)) {
							YTTSetConfig(newConf).then(() => alert('Done'));
						}
					});
				};
				importData(reader.target.result);
			};
			reader.readAsText(file);
		}
	});

	$('#resetButton').on('click', () => {
		if (!confirm('This action will wipe all your data!\nAre you sure to continue?')) {
			return;
		}
		YTTGetConfig([YTT_CONFIG_USERID])
			.then(config => YTTClearConfig()
				.then(() => YTTSetConfig(config))
				.then(() => alert('Data cleared'))
				.then(() => location.reload()));
	});

	YTTGetConfig([YTT_CONFIG_VERSION, YTT_CONFIG_USERID, YTT_CONFIG_SHARE_ONLINE, YTT_CONFIG_USERNAME, YTT_CONFIG_DEBUG_KEY]).then(config => {
		$('#validUsername').on('click', () => {
			let newUsername = $('#username').val();
			$.ajax({
				url: `https://yttracker.rakambda.fr/api/v2/${encodeURI(config[YTT_CONFIG_USERID])}/username`,
				data: {
					username: newUsername
				},
				method: 'POST',
				success: () => {
					let newConfig = {};
					newConfig[YTT_CONFIG_USERNAME] = newUsername;
					YTTSetConfig(newConfig);
					alert('Username changed');
				},
				error: () => {
					alert('Failed to change username');
				}
			});
		});

		if (config.hasOwnProperty(YTT_CONFIG_SHARE_ONLINE)) {
			shareStatsCheck.prop('checked', config[YTT_CONFIG_SHARE_ONLINE]);
		}

		if (config.hasOwnProperty(YTT_CONFIG_SHARE_ONLINE)) {
			debugCheck.prop('checked', config[YTT_CONFIG_DEBUG_KEY]);
		}

		$('#versionNumber').text(YTTGetVersion());
		$('#UUID').text(config[YTT_CONFIG_USERID] ? config[YTT_CONFIG_USERID] : 'Unknown');
		$('#username').val(config[YTT_CONFIG_USERNAME] ? config[YTT_CONFIG_USERNAME] : '');

		$.ajax({
			url: `https://yttracker.rakambda.fr/api/v2/${encodeURI(config[YTT_CONFIG_USERID])}/username`,
			data: {},
			method: 'GET',
			success: data => {
				if (data && data.code === 200 && data.username) {
					$('#username').val(data.username);
					let newConfig = {};
					newConfig[YTT_CONFIG_USERNAME] = data.username;
					YTTSetConfig(newConfig);
				}
			},
			error: () => {
				console.error('Failed to fetch online username');
			}
		});

		shareStatsCheck.on('change', () => {
			const state = shareStatsCheck.is(':checked');
			const newConfig = {};
			newConfig[YTT_CONFIG_SHARE_ONLINE] = state;
			YTTSetConfig(newConfig);
		});

		debugCheck.on('change', () => {
			const state = debugCheck.is(':checked');
			const newConfig = {};
			newConfig[YTT_CONFIG_DEBUG_KEY] = state;
			YTTSetConfig(newConfig);
		});
	});

	$('#exportDropboxButton').on('click', () => exportSettingsToDropbox());

	$('#dropboxDisconnect').on('click', () => YTTRemoveConfig[DROPBOX_API_KEY]);
})
;