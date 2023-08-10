import "webextension-polyfill-global";

export class ConfigurationManager {
    public async getValues(keys: string | Array<string> | null): Promise<Record<string, any>> {
        return await browser.storage.local.get(keys);
    }

    public async getValue(key: string): Promise<any | null> {
        const result = await this.getValues(key);
        if (key in result) {
            return result[key];
        }
        return null;
    }

    public async setValues(keys: Record<string, any>): Promise<void> {
        return await browser.storage.local.set(keys);
    }

    public async setValue(key: string, value: any): Promise<void> {
        let newConfig: Record<string, any> = {};
        newConfig[key] = value;
        return await this.setValues(newConfig);
    }

    public async appendArray(key: string, appendData: [any]): Promise<void> {
        const values = await (this.getValues(key) || []) as [any];
        const newValues = values.concat(appendData);

        let newKeys = {} as Record<string, any>;
        newKeys[key] = newValues;
        return await this.setValues(newKeys);
    }

    public getTodayKey(): string {
        return this.getDayKey(new Date());
    }

    public getDayKey(day: Date): string {
        return `day${this.getDayOfYear(day)}${day.getFullYear()}`;
    }

    private getDayOfYear(date: Date): number {
        const dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        const mn = date.getMonth();
        const dn = date.getDate();
        let dayOfYear = dayCount[mn] + dn;
        if (mn > 1 && this.isLeapYear(date)) {
            dayOfYear++;
        }
        return dayOfYear;
    }

    private isLeapYear(date: Date): boolean {
        const year = date.getFullYear();
        if ((year & 3) !== 0) {
            return false;
        }
        return ((year % 100) !== 0 || (year % 400) === 0);
    }
}