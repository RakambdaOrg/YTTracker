const DROPBOX_API_KEY = '7zgfd8x5bpf8g7p';
const HTTP_STATUS_CANCEL = 499;

/**
 * Request an access token from the user.
 * @return {Promise<string>} A promise containing a token.
 */
function requestDropboxAccessToken() {
	const client = new Dropbox.Dropbox({
		clientId: DROPBOX_API_KEY,
		fetch
	});
	console.log('Requestion new Dropbox token');
	const authUrl = client.auth.getAuthenticationUrl(YTTGetRedirectURL());
	return YTTLaunchWebAuthFlow({url: authUrl, interactive: true})
		.then(urlReturned => {
			if (urlReturned) {
				const params = new URLSearchParams(new URL(urlReturned).hash.replace('#', ''));
				const conf = {};
				conf[YTT_CONFIG_DROPBOX_ACCESS_TOKEN] = params.get('access_token');
				YTTSetConfig(conf);
				return params.get('access_token');
			} else {
				return Promise.reject('Failed to open authentication page or user closed it');
			}
		});
}

/**
 * @returns {Promise<Dropbox>}
 */
function getDropboxClient() {
	return YTTGetConfig([YTT_CONFIG_DROPBOX_ACCESS_TOKEN])
		.then(config => config[YTT_CONFIG_DROPBOX_ACCESS_TOKEN] ? Promise.resolve(config[YTT_CONFIG_DROPBOX_ACCESS_TOKEN]) : requestDropboxAccessToken())
		.then(token => new Dropbox.Dropbox({
			clientId: DROPBOX_API_KEY,
			accessToken: token
		}));
}

/**
 * Export the extension settings to the user's Dropbox.
 */
function exportSettingsToDropbox() {
	const filePath = `/YTTracker.${new Date().getTime()}.json`;
	getDropboxClient()
		.then(client => {
			return YTTGetConfigForExport()
				.then(content => client.filesUpload({path: filePath, contents: JSON.stringify(content)}))
				.then(() => alert('Exported successfully'))
				.catch(error => {
					if (error.status === HTTP_STATUS_CANCEL) {
						return;
					}
					console.error(typeof error, error);
					alert('Error saving dropbox data');
				});
		})
		.catch(error => {
			console.log(error);
		});
}

/**
 * Fetch file content from the user's Dropbox.
 */
function importSettingsFromDropbox() {
	getDropboxClient()
		.then(client => {
			client.filesListFolder({path: ''})
				.then(files => files.result.entries)
				.then(files => files.sort((a,b) => b.name.localeCompare(a.name))[0])
				.then(file => client.filesDownload({path: file.id}))
				.then(file => file.result.fileBlob.text())
				.then(file => YTTImportConfig(file))
				.catch(error => {
					if (error.status === HTTP_STATUS_CANCEL) {
						return;
					}
					console.error(typeof error, error);
					alert('Error importing dropbox data');
				});
		})
		.catch(error => {
			console.log(error);
		});
}
