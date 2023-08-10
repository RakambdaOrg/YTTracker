export class YttDuration {
    private static readonly OPENED = "total";
    private static readonly WATCHED = "real";

    readonly type: string;
    milliseconds: number;
    seconds: number;
    minutes: number;
    hours: number;
    days: number;

    private constructor(data: { type: string, milliseconds?: number, seconds?: number, minutes?: number, hours?: number, days?: number }) {
        this.type = data.type;
        this.milliseconds = data.milliseconds ?? 0;
        this.seconds = data.seconds ?? 0;
        this.minutes = data.minutes ?? 0;
        this.hours = data.hours ?? 0;
        this.days = data.days ?? 0;
    }

    public static getOpened(data: { milliseconds?: number, seconds?: number, minutes?: number, hours?: number, days?: number } = {}): YttDuration {
        return new YttDuration({
            type: this.OPENED,
            ...data
        });
    }

    public static getWatched(data: { milliseconds?: number, seconds?: number, minutes?: number, hours?: number, days?: number } = {}): YttDuration {
        return new YttDuration({
            type: this.WATCHED,
            ...data
        });
    }

    public addDuration(duration: YttDuration): void {
        this.milliseconds = this.milliseconds + duration.milliseconds;
        this.seconds = this.seconds + duration.seconds + Math.floor(this.milliseconds / 1000.0);
        this.milliseconds %= 1000;
        this.minutes = this.minutes + duration.minutes + Math.floor(this.seconds / 60.0);
        this.seconds %= 60;
        this.hours = this.hours + duration.hours + Math.floor(this.minutes / 60.0);
        this.minutes %= 60;
        this.days = this.days + duration.days + Math.floor(this.hours / 24.0);
        this.hours %= 24;
    }

    public getAsString(showMillisec: boolean = false): string {
        this.normalize();

        let text = '';
        if (this.days) {
            text += `${this.days}D `;
        }
        if (this.hours) {
            text += `${this.hours}H `;
        }
        if (this.minutes) {
            text += `${this.minutes}M `;
        }
        if (this.seconds) {
            text += `${this.seconds}S `;
        }
        if (showMillisec) {
            text += `${this.milliseconds}MS `;
        }
        if (text === '') {
            return '0S';
        }
        return text;
    }

    private normalize(): void {
        if (this.getAsMilliseconds() <= 0) {
            this.milliseconds = 0;
            this.seconds = 0;
            this.minutes = 0;
            this.hours = 0;
            this.days = 0;
            return;
        }
        this.addDuration(new YttDuration({type: 'FAKE'}));
    }

    public getAsMilliseconds(): number {
        let total = this.milliseconds;
        total += this.seconds * 1000;
        total += this.minutes * 60 * 1000;
        total += this.hours * 60 * 60 * 1000;
        total += this.days * 24 * 60 * 60 * 1000;
        return total;
    }
}