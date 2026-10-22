export const CACHE_SECONDS = 60 * 60;

const memory = new Map<string, { expires: number; value: unknown }>();

/** The Workers edge cache; absent in Node (astro dev without the Cloudflare proxy) and a no-op on *.pages.dev. */
function edgeCache(): Cache | undefined {
	const storage = globalThis.caches as (CacheStorage & { default?: Cache }) | undefined;
	return storage?.default;
}

/**
 * Returns the value stored under `key`, or computes it with `load` and keeps it for `seconds`.
 * The value lives in the Cloudflare cache, so the GitHub and feed APIs are hit at most once an hour per data centre.
 * A failed `load` is not cached and its error is passed on.
 * @example
 * const stats = await cached('github-stats', CACHE_SECONDS, () => fetchStats(token));
 */
export async function cached<T>(key: string, seconds: number, load: () => Promise<T>): Promise<T> {
	const now = Date.now();
	const remembered = memory.get(key);
	if (remembered && remembered.expires > now) return remembered.value as T;

	const cache = edgeCache();
	const request = new Request(`https://cache.montblank.fun/${encodeURIComponent(key)}`);
	const hit = await cache?.match(request).catch(() => undefined);
	if (hit) return hit.json() as Promise<T>;

	const value = await load();
	memory.set(key, { expires: now + seconds * 1000, value });
	await cache
		?.put(
			request,
			new Response(JSON.stringify(value), {
				headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${seconds}` },
			}),
		)
		.catch(() => undefined);
	return value;
}

/** Turns a failure into `null` so one broken section never takes the whole page down. */
export async function orNull<T>(promise: Promise<T>): Promise<T | null> {
	try {
		return await promise;
	} catch (error) {
		console.error(error);
		return null;
	}
}
