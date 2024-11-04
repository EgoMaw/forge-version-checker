type CFArgs = [Env, ExecutionContext];

type ForgeVersion = {
	recommended: string;
	latest: string;
	versions: string[];
};

type ForgePromoResponse = {
	homepage: string;
	promos: Record<string, string>;
};

type LatestVersion = {
	'minecraft': string;
	'forge-latest': string;
	'forge-recommended': string | null;
};

type XMLResponse = {
	metadata: {
		groupid: string;
		artifactId: string;
		versioning: {
			release: string;
			latest: string;
			lastUpdated: number;
			versions: {
				version: string[];
			};
		};
	};
};

type KVMeta = {
	min: string;
	max: string;
};
