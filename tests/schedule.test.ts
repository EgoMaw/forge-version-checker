import {
	env,
	createScheduledController,
	createExecutionContext,
	waitOnExecutionContext,
} from 'cloudflare:test';
import { describe, it } from 'vitest';
import worker from 'worker';

describe('Schedule Tests', () => {
	it('calls scheduled handler', async () => {
		const ctrl = createScheduledController({
			scheduledTime: new Date(1000),
			cron: '* */12 * * *',
		});
		const ctx = createExecutionContext();
		await worker.scheduled(ctrl, env, ctx);
		await waitOnExecutionContext(ctx);
	});
});
