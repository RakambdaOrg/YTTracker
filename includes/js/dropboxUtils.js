const DROPBOX_API_KEY = '7zgfd8x5bpf8g7p';
const HTTP_STATUS_CANCEL = 499;

function requestDropboxAccessToken() {
	const client = new Dropbox.Dropbox({
		clientId: DROPBOX_API_KEY,
		fetch
	});
	const authUrl = client.getAuthenticationUrl(YTTGetRedirectURL());
	return YTTLaunchWebAuthFlow({url: authUrl, interactive: true})
		.then(urlReturned => {
			if(urlReturned){
				const params = new URLSearchParams(new URL(urlReturned).hash.replace('#', ''));
				const conf = {};
				conf[YTT_CONFIG_DROPBOX_ACCESS_TOKEN] = params.get('access_token');
				YTTSetConfig(conf);
				return params.get('access_token');
			}
			else{
				return Promise.reject("Failed to open authentication page");
			}
		});
}

function exportSettingsToDropbox() {
	const fileName = 'YTTracker.' + new Date().getTime() + '.json';
	const filePath = '/' + fileName;
	YTTGetConfig([YTT_CONFIG_DROPBOX_ACCESS_TOKEN], null)
		.then(config => config[YTT_CONFIG_DROPBOX_ACCESS_TOKEN] || requestDropboxAccessToken())
		.then(token => token || requestDropboxAccessToken())
		.then(token => {
				const client = new Dropbox.Dropbox({
					clientId: DROPBOX_API_KEY,
					accessToken: token,
					fetch
				});
				return YTTGetConfigForExport()
					.then(content => client.filesUpload({path: filePath, contents: JSON.stringify(content)}))
					.then(() => alert('Exported successfully'))
					.catch(error => {
						if (error.status === HTTP_STATUS_CANCEL) {
							return;
						}
						console.error(error);
						alert('Error saving data');
					});
			}
		);
}
