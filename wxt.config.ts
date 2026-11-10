import {defineConfig} from 'wxt';

const CHROME_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArlHZIpWVXeiGgvlg/O1XIOvR4wJfm4UVgjlq2YjMQZjPsH/ETsy18topZnnYjrszs7cdKdNP3Nx9t+n50lmQMHsw+BYfWJ4w4ydCQCxC6YD+ce//kOOQF3JFHyfNwka0/AGGa0MUkDXEAvG0qkFFe0ahfZ8UCTssXU8suPKN6PFQcGeOQ0JTCyd/J/a+uCybBagusBnpKloEMCdSFMNpvul5iv2Jo374e0KNFnxehS0BdKf6R2QVyVlg1ju10I5Pcmgrq9Y1qhBGa5Fs/DUs51tjiQF7ThUTZLeU1kL2Silo1I9DTHX820zhwLm+XGlstZIUS2gUMKeGUNb9Fca+hQIDAQAB';
const CHROME_BETA_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgQG3/oewtkQuMHOb6RKaEYtGWgd4Iv7tYZnO/cdr8/FoBg26DpRM0tTBI1KDeF8I30yVpsKcNjWh6t86iL3P0yROKGuEyhUZIrJIitoROzxyiowscYtfAJFlzwo/dbGr4eEPMuOdzMvl5J7bNPaZGJoXAHYt5auAjJzI7ZQtSxRA+iv3PWFsR1nmNcIhRmV0wP2W43OtFAKclmXuB3YAbzCf42Mtb2oD8FjHpmLWcnHrYggMWr0CQidphB5b9xtx6kgTCSb2LaNfOv1Q9L9MVQbhWw+NPLMves4OltwK3D+0gPbI2ulizSo6CLEPLTGcpn8JE/Xuc/9cRR7q5Kf3WQIDAQAB';

export default defineConfig({
	srcDir: 'src',
	imports: false,
	manifestVersion: 3,
	targetBrowsers: ['chrome', 'firefox'],
	// The AMO sources zip only needs what builds the extension.
	zip: {excludeSources: ['extras/**', 'JOURNAL.md', 'PLAN.md']},
	manifest: ({browser, mode}) => {
		const beta = mode === 'beta';
		return {
			name: beta ? 'YouTube Tracker Beta' : 'YouTube Tracker',
			short_name: 'YTTracker',
			description: 'This extension will track your time on YouTube',
			homepage_url: 'https://github.com/RakambdaOrg/YTTracker',
			icons: {16: 'assets/icon16.png', 48: 'assets/icon48.png', 128: 'assets/icon128.png'},
			action: {
				default_icon: {16: 'assets/icon16.png', 24: 'assets/icon48.png', 32: 'assets/icon128.png'},
				default_title: 'YouTube Tracker',
			},
			permissions: ['storage', 'unlimitedStorage', 'identity'],
			optional_permissions: ['notifications'],
			host_permissions: ['https://yttracker.rakambda.fr/*'],
			...(browser === 'firefox'
				? {browser_specific_settings: {gecko: {id: 'yttracker@mrcraftcod.fr', strict_min_version: '128.0'}}}
				: {key: beta ? CHROME_BETA_KEY : CHROME_KEY}),
		};
	},
});
