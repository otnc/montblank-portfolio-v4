import type { CrossLink } from '@/data/profile';

// Tried in order: the OGP image first, then the favicon.
const imageTagPatterns = [
	/<meta[^>]+(?:property|name)=["']og:image(?::url)?["'][^>]*>/i,
	/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>/i,
	/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/i,
];

const attribute = (tag: string, name: string) => tag.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'))?.[1];

async function findPageImage(pageUrl: string): Promise<string | undefined> {
	try {
		const response = await fetch(pageUrl, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10_000) });
		if (!response.ok) return undefined;
		const html = await response.text();
		for (const pattern of imageTagPatterns) {
			const tag = html.match(pattern)?.[0];
			const src = tag && (attribute(tag, 'content') ?? attribute(tag, 'href'));
			if (src) return new URL(src.replaceAll('&amp;', '&'), response.url).href;
		}
	} catch {
		// An unreachable site is listed without an image rather than failing the build.
	}
	return undefined;
}

/**
 * Picks the image /links shows for a cross link: the one written in the data, nothing when it is `false`,
 * and otherwise the OGP image (or favicon) their page points to, looked up when the page is built.
 * The image itself is still loaded from their site, so it follows their updates.
 *
 * @example
 * await crossLinkImage({ author: 'Shiba', url: 'https://shibadogcap.com' }) // => 'https://shibadogcap.com/og.png'
 */
export async function crossLinkImage(link: CrossLink): Promise<string | undefined> {
	if (link.image === false) return undefined;
	return link.image ?? findPageImage(link.url);
}
