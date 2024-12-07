import { XMLParser } from 'fast-xml-parser';
import { fetcher } from 'itty-fetcher';
import versionCompare from 'version-compare';
import { router } from './router';

const api = fetcher({
	headers: {
		'User-Agent':
			'Forge Version Checker / v2.0.0 (https://github.com/EgoMaw/forge-version-checker)',
	},
});

export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(_event, env, _ctx): Promise<void> {
		const { promos } = await api.get<ForgePromoResponse>(env.FORGE_PROMO_URL);

		/* Minecraft versions, unique from all promo versions */
		const minecraftVersions = [
			...new Set(
				Object.keys(promos)
					.map(x => x.split('-')[0]!)
					.sort(versionCompare)
			),
		];

		const latestMinecraftVersion = minecraftVersions[minecraftVersions.length - 1];

		// Hot Link latest minecraft version
		await env.FORGE_VERSIONS.put(
			'latest',
			JSON.stringify({
				'minecraft': latestMinecraftVersion,
				'forge-latest': promos[`${latestMinecraftVersion}-latest`],
				'forge-recommended':
					promos[`${latestMinecraftVersion}-recommended`] ??
					promos[`${latestMinecraftVersion}-latest`],
			})
		);

		const xml = await api.get<string>(env.FORGE_MAVEN_URL);
		const parser = new XMLParser();
		const xmlVersions = (parser.parse(xml, true) as XMLResponse).metadata.versioning.versions
			.version;

		for (const version of minecraftVersions) {
			const forgeVersions = xmlVersions
				.filter(x => x.startsWith(`${version}-`))
				.map(x => x.split('-')[1]!)
				.sort(versionCompare);

			await env.FORGE_VERSIONS.put(
				version,
				JSON.stringify({
					recommended: promos[`${version}-recommended`] ?? promos[`${version}-latest`],
					latest: promos[`${version}-latest`],
					versions: forgeVersions,
				}),
				{
					metadata: {
						min: forgeVersions[0],
						max: forgeVersions[forgeVersions.length - 1],
					},
				}
			);
		}
	},
	...router,
} satisfies ExportedHandler<Env>;
