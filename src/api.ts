import { IRequest, json, type ResponseFormatter, Router, text, withParams } from 'itty-router';
import { getAllVersions, getLatestVersion, getVersion } from './utils';

const apiResponse: ResponseFormatter = (body, options) => {
	// @ts-ignore
	if (options?.headers.get('accept') === 'application/json') {
		return json(body, options);
	}
	if (Array.isArray(body)) body = body.join('\n');
	return text(body, options);
};

const apiRouter = Router<IRequest, CFArgs>({
	base: '/api/v1',
	before: [withParams],
	finally: [apiResponse],
})
	.get('/', () => 'API Version 1.0')
	.get('/(latest|/minecraft/latest)', (_req, env) => getLatestVersion(env))
	.get('/(recommended|/minecraft/recommended)', (_req, env) => getLatestVersion(env, 'recommended'))
	.get('/minecraft/:version', ({ version, query }, env) => {
		if ('all' in query) {
			return getAllVersions(env, version);
		}
		return getVersion(env, version, 'latest');
	})
	.get('/minecraft/:version/forge/:tag', ({ version, tag }, env) => getVersion(env, version, tag));

export { apiRouter };
