import {YttDuration} from "./YttDuration";

export class YttDay {
    count: number;
    real: YttDuration;
    total: YttDuration;

    public constructor() {
        this.count = 0;
        this.real = YttDuration.getWatched({});
        this.total = YttDuration.getOpened({});
    }

    public load(data: { count?: number, real?: YttDuration, total?: YttDuration } = {}): void {
        this.count = data?.count ?? 0;
        this.real = YttDuration.getWatched(data?.real ?? {});
        this.total = YttDuration.getOpened(data?.total ?? {});
    }

    public addCount(number: number): void {
        this.count += number;
    }
}