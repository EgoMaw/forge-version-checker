import { beforeAll, describe, expect, it } from 'vitest';
import { createExecutionContext, createScheduledController, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import worker from 'worker';

beforeAll(async () => {
	const ctrl = createScheduledController({
		scheduledTime: new Date(1000),
		cron: "* */12 * * *"
	});
	const ctx = createExecutionContext();
	await worker.scheduled(ctrl, env, ctx);
	await waitOnExecutionContext(ctx);
})

describe('Basic Requests', () => {
	it('index redirects to main site', async () => {
		const response = await SELF.fetch('http://localhost', {
			redirect: 'manual',
		});

		expect(response.status).toBe(301);
		expect(response.headers.get('Location')).toBe('https://dedicatedmc.io/');
	});

	it('Valid version when specific versions specified', async () => {
		const response = await SELF.fetch('http://localhost', {
			method: 'POST',
			body: JSON.stringify({
				'minecraft-version': '1.16.5',
				'forge-version': '36.2.33',
			}),
		});

		expect(response.status).toBe(200);
		expect(await response.text()).toMatch('1.16.5-36.2.33');
	})

	it('Correctly parses a forge version with a prefix regardless of the minecraft version', async () => {
		const response = await SELF.fetch('http://localhost', {
			method: 'POST',
			body: JSON.stringify({
				'minecraft-version': '1.20.1',
				'forge-version': '1.16.5-36.2.33',
			}),
		});

		expect(response.status).toBe(200);
		expect(await response.text()).toMatch('1.16.5-36.2.33');
	})

	it('Correct version when latest specified', async () => {
		const response = await SELF.fetch('http://localhost', {
			method: 'POST',
			body: JSON.stringify({
				'minecraft-version': 'latest',
				'forge-version': 'latest',
			}),
		});

		expect(response.status).toBe(200);
		expect(await response.text()).toMatch('1.21.3-53.0.7');
	})

	it('Correct version when only forge version specified', async () => {
		const response = await SELF.fetch('http://localhost', {
			method: 'POST',
			body: JSON.stringify({
				'minecraft-version': 'latest',
				'forge-version': '35.0.7',
			}),
		});

		expect(response.status).toBe(200);
		expect(await response.text()).toMatch('1.16.4-35.0.7');
	})


	it('Correct version when forge version is recommended', async () => {
		const response = await SELF.fetch('http://localhost', {
			method: 'POST',
			body: JSON.stringify({
				'minecraft-version': '1.20.6',
				'forge-version': 'recommended',
			}),
		});

		expect(response.status).toBe(200);
		expect(await response.text()).toMatch('1.20.6-50.1.0');
	})

	it('Error when forge version doesnt exist', async () => {
		const response = await SELF.fetch('http://localhost', {
			method: 'POST',
			body: JSON.stringify({
				'minecraft-version': 'latest',
				'forge-version': '87.0.7',
			}),
		});

		expect(response.status).toBe(404);
		expect(await response.json()).toStrictEqual({status:404,error:"Forge 87.0.7 doesn't exist"});
	})

	it('Error when Minecraft version doesnt exist', async () => {
		const response = await SELF.fetch('http://localhost', {
			method: 'POST',
			body: JSON.stringify({
				'minecraft-version': '1.96.1',
				'forge-version': 'latest',
			}),
		});

		expect(response.status).toBe(404);
		expect(await response.json()).toStrictEqual({status:404,error:"Minecraft Version 1.96.1 not found"});
	})



	it('Error when both versions dont exist', async () => {
		const response = await SELF.fetch('http://localhost', {
			method: 'POST',
			body: JSON.stringify({
				'minecraft-version': '2.51',
				'forge-version': '26.2.33',
			}),
		});

		expect(response.status).toBe(404);
		expect(await response.json()).toStrictEqual({status: 404, error: `Minecraft Version 2.51 not found`});
	})

	it('Error when body is malformed', async () => {
		const response = await SELF.fetch('http://localhost', {
			method: 'POST',
			body: JSON.stringify({
				'minecraft-version': '2.51',
				'im-invalid': '123'
			}),
		});
		expect(response.status).toBe(400);
		expect(await response.json()).toStrictEqual({status: 400, error: `Invalid JSON payload`});
	})
});
