import satisfies from 'version-range';
import { z } from 'zod';
import {
	cors,
	error,
	type IRequest,
	type RequestHandler,
	type ResponseHandler,
	Router,
	text,
} from 'itty-router';

const { preflight, corsify } = cors({
	origin: [
		'https://dedicatedmc.io',
		'https://portal.dedicatedmc.io',
		'https://panel.dedicatedmc.io',
		'https://dedimc.promo',
		'https://partner.dedimc.promo',
	],
	allowMethods: ['GET', 'POST'],
});

const headers: ResponseHandler<IRequest> = response => {
	const resp = new Response(response.body, response);
	resp.headers.set('Cache-Control', 'no-store');
	resp.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
	resp.headers.set('X-Frame-Options', 'DENY');
	return resp;
};

const schema = z.object({
	'minecraft-version': z.string().min(2),
	'forge-version': z.string(),
});

type RequestWithContent = IRequest & {
	content: z.infer<typeof schema>;
};

const withJsonContent: RequestHandler<RequestWithContent, CFArgs> = async request => {
	try {
		let json: any = await request.json();
		request.content = schema.parse(json);
	} catch (err: any) {
		return error(400, 'Invalid JSON payload');
	}
	return undefined;
};

export const router = Router<IRequest, CFArgs>({
	before: [preflight],
	catch: err => {
		console.error(err);
		return error(err);
	},
	finally: [text, corsify, headers],
})
	// index route
	.get('/', () => {
		return Response.redirect('https://dedicatedmc.io', 301);
	})
	.post('/', withJsonContent, async ({ content }, env) => {
		let mcVersion = content['minecraft-version'];
		let forgeVersion = content['forge-version'];

		// Check if the forge version contains a minecraft version prefix (ex. 1.20.1-48.0.5)
		if (forgeVersion.includes('-')) {
			mcVersion = forgeVersion.substring(0, forgeVersion.indexOf('-'));
			forgeVersion = forgeVersion.substring(forgeVersion.indexOf('-') + 1);
		}

		// Handle a special case of both mc and forge version being latest/recommended
		if (mcVersion === 'latest' && (forgeVersion === 'latest' || forgeVersion === 'recommended')) {
			const data = await env.FORGE_VERSIONS.get<LatestVersion>('latest', { type: 'json' });

			if (!data) {
				return error(404, `Failed to get latest version information`);
			}

			return `${data.minecraft}-${forgeVersion === 'recommended' ? data['forge-recommended'] : data['forge-latest']}`;
		}

		// Handle special case of just mc version being latest
		if (mcVersion === 'latest') {
			let isGoin = true;
			let cursor = null;

			while (isGoin) {
				const data = await env.FORGE_VERSIONS.list<KVMeta>({ cursor, prefix: '1.' });
				isGoin = !data.list_complete;
				for (const key of data.keys) {
					if (satisfies(forgeVersion, `>=${key.metadata!.min} <=${key.metadata!.max}`)) {
						mcVersion = key.name;
						break;
					}
				}
			}

			if (mcVersion === 'latest') {
				return error(404, `Forge ${forgeVersion} doesn't exist`);
			}
		}

		const kVal = await env.FORGE_VERSIONS.get<ForgeVersion>(mcVersion, { type: 'json' });
		if (kVal === null) {
			return error(404, `Minecraft Version ${mcVersion} not found`);
		}

		// Handle forge special case versions
		if (forgeVersion === 'recommended') {
			return `${mcVersion}-${kVal.recommended}`;
		} else if (forgeVersion === 'latest') {
			return `${mcVersion}-${kVal.latest}`;
		}

		if (!kVal.versions.includes(forgeVersion)) {
			return error(400, `Forge ${forgeVersion} doesn't exist for Minecraft ${mcVersion}`);
		}

		return `${mcVersion}-${forgeVersion}`;
	})
	.all('*', () => error(404));
