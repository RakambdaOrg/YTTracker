import "webextension-polyfill-global";
import {ConfigurationManager} from "./storage/ConfigurationManager";
import {ConfigurationKeys} from "./storage/ConfigurationKeys";

export class NotificationManager{
    private readonly configurationManager: ConfigurationManager;

    public constructor(configurationManager: ConfigurationManager) {
        this.configurationManager = configurationManager;
    }

    public async notify(title: string, body: string, force: boolean = false) {
        if(force || (await this.configurationManager.getValue(ConfigurationKeys.DEBUG) ?? false)){
            await browser.notifications.create({
                type: 'basic',
                iconUrl: '/assets/icon128.png',
                title: title,
                message: body
            });
        }
    }
}