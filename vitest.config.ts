import {defineConfig} from 'vitest/config';
import {WxtVitest} from 'wxt/testing/vitest-plugin';

// Fixed time zone with DST so day splitting is tested on real local midnights.
process.env.TZ = 'Europe/Paris';

export default defineConfig({plugins: [WxtVitest()]});
