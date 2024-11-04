import { XMLParser } from 'fast-xml-parser';
import { fetcher } from 'itty-fetcher';
import { coerce, sort } from 'semver';
import { router } from './router';

const api = fetcher({
	headers: {
		'User-Agent': 'Forge Version Checker Worker',
	},
});

export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(_event, env): Promise<void> {
		const { promos } = await api.get<ForgePromoResponse>(env.FORGE_PROMO_URL);

		const versions = Object.keys(promos).map(x => x.split('-')[0]!);
		const sortedVersions = sort(
			versions.map(x => {
				const coercion = coerce(x, { includePrerelease: true });
				return coercion ? coercion.toString() : x;
			}),
			{ loose: true }
		);
		const latestVersion = sortedVersions[sortedVersions.length - 1];

		// Hot Link latest version
		await env.FORGE_VERSIONS.put(
			'latest',
			JSON.stringify({
				'minecraft': latestVersion,
				'forge-latest': promos[`${latestVersion}-latest`],
				'forge-recommended':
					promos[`${latestVersion}-recommended`] ?? promos[`${latestVersion}-latest`],
			})
		);

		const xml = await api.get<string>(env.FORGE_MAVEN_URL);
		const parser = new XMLParser();
		const xmlVersions = (parser.parse(xml, true) as XMLResponse).metadata.versioning.versions
			.version;

		for (const version of versions) {
			const forgeVersions = xmlVersions
				.filter(x => x.startsWith(`${version}-`))
				.map(x => x.split('-')[1]!);

			const forgeCoers = sort(
				forgeVersions.map(x => {
					const coercion = coerce(x, { includePrerelease: true });
					return coercion ? coercion.toString() : x;
				}),
				{ loose: true }
			);

			await env.FORGE_VERSIONS.put(
				version,
				JSON.stringify({
					recommended: promos[`${version}-recommended`] ?? promos[`${version}-latest`],
					latest: promos[`${version}-latest`],
					versions: forgeVersions,
				}),
				{
					metadata: {
						min: forgeCoers[0],
						max: forgeCoers[forgeCoers.length - 1],
					},
				}
			);
		}
	},
	...router,
} satisfies ExportedHandler<Env>;
