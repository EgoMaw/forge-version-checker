import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				main: './src/index.ts',
				wrangler: { configPath: './wrangler.toml' },
			},
		},
		alias: { worker: new URL('src/index.ts', import.meta.url).pathname },
	},
});
