import {ConfigurationManager} from "./storage/ConfigurationManager";
import {ConfigurationKeys} from "./storage/ConfigurationKeys";

export class LogManager {
    private readonly configurationManager: ConfigurationManager;

    public constructor(configurationManager: ConfigurationManager) {
        this.configurationManager = configurationManager;
    }

    public async logDebug(content?: any, ...optionalParams: any[]): Promise<void> {
        const debugConfiguration = await this.configurationManager.getValue(ConfigurationKeys.DEBUG);
        if (debugConfiguration) {
            console.log(content, optionalParams);
        }
    }
}