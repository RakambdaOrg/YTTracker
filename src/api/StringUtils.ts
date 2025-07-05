export class StringUtils {
    public static generateUuid(): string {
        const lut: string[] = [];
        for (let i = 0; i < 256; i++) {
            lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
        }

        function getIndex(idx: number): string {
            return lut[idx] ?? '';
        }

        const d0 = Math.random() * 0xffffffff | 0;
        const d1 = Math.random() * 0xffffffff | 0;
        const d2 = Math.random() * 0xffffffff | 0;
        const d3 = Math.random() * 0xffffffff | 0;
        return getIndex(d0 & 0xff) + getIndex(d0 >> 8 & 0xff) + getIndex(d0 >> 16 & 0xff) + getIndex(d0 >> 24 & 0xff) + '-' +
                getIndex(d1 & 0xff) + getIndex(d1 >> 8 & 0xff) + '-' + getIndex(d1 >> 16 & 0x0f | 0x40) + getIndex(d1 >> 24 & 0xff) + '-' +
                getIndex(d2 & 0x3f | 0x80) + getIndex(d2 >> 8 & 0xff) + '-' + getIndex(d2 >> 16 & 0xff) + getIndex(d2 >> 24 & 0xff) +
                getIndex(d3 & 0xff) + getIndex(d3 >> 8 & 0xff) + getIndex(d3 >> 16 & 0xff) + getIndex(d3 >> 24 & 0xff);
    }
}