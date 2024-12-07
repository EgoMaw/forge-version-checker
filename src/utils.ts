import { StatusError } from 'itty-router';

/**
 * Get all Forge Versions for a specific Minecraft version
 * @param env for KV Store
 * @param version Minecraft version to get
 */
async function getAllVersions(env: Env, version: string) {
	const data = await env.FORGE_VERSIONS.get<ForgeVersion>(version, { type: 'json' });

	if (!data) {
		throw new StatusError(404, 'Failed to get version information');
	}

	return data.versions.map(x => `${version}-${x}`);
}

/**
 * Get Forge version for latest Minecraft version
 * @param env for KV Store
 * @param tag Forge version tag
 */
async function getLatestVersion(env: Env, tag: 'latest' | 'recommended' = 'latest') {
	const data = await env.FORGE_VERSIONS.get<LatestVersion>('latest', { type: 'json' });

	if (!data) {
		throw new StatusError(404, 'Failed to get version information');
	}

	return `${data.minecraft}-${data[`forge-${tag}`]}`;
}
/**
 * Get Forge version for a specific Minecraft version
 * @param env for KV Store
 * @param version Minecraft Version to get
 * @param tag recommended, latest or a specific forge version
 */
async function getVersion(env: Env, version: string, tag?: string) {
	const data = await env.FORGE_VERSIONS.get<ForgeVersion>(version, { type: 'json' });

	if (!data) {
		throw new StatusError(404, 'Failed to get version information');
	}

	switch (tag) {
		case undefined:
		case 'latest':
			return `${version}-${data.latest}`;
		case 'recommended':
			return `${version}-${data.recommended}`;
		default:
			if (!(tag in data.versions)) {
				throw new StatusError(404, "Forge version doesn't exist for supplied Minecraft version");
			}
			return `${version}-${tag}`;
	}
}

export { getLatestVersion, getAllVersions, getVersion };
