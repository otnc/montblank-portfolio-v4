import { XMLParser } from 'fast-xml-parser';
import { CACHE_SECONDS, cached } from '@/lib/cache';

export interface Post {
	title: string;
	url: string;
	description: string;
	/** ISO 8601, or empty when the feed has no usable date. */
	date: string;
	/** Matches a `label` in `writingSites` (src/data/profile.ts). */
	source: string;
}

const FEEDS = [
	{ source: 'Blog', url: 'https://blog.montblank.fun/rss.xml' },
	{ source: 'Zenn', url: 'https://zenn.dev/devuloper/feed' },
	{ source: 'Qiita', url: 'https://qiita.com/devuloper/feed' },
	{ source: 'note', url: 'https://note.com/otoneko1102/rss' },
];

const DESCRIPTION_LENGTH = 140;

type XmlValue = string | number | { '#text'?: unknown; '@_href'?: unknown; '@_rel'?: unknown } | XmlValue[] | undefined;

function text(value: XmlValue): string {
	if (typeof value === 'string' || typeof value === 'number') return String(value);
	if (Array.isArray(value)) return text(value[0]);
	return value && '#text' in value ? String(value['#text'] ?? '') : '';
}

/** RSS has the URL as text; Atom (Qiita) has `<link rel="alternate" href>`. */
function link(value: XmlValue): string {
	if (Array.isArray(value)) return link(value.find((item) => typeof item === 'object' && !Array.isArray(item) && (item['@_rel'] ?? 'alternate') === 'alternate'));
	if (value && typeof value === 'object' && '@_href' in value) return String(value['@_href']);
	return text(value);
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function plain(html: string) {
	const stripped = html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&(#x?[0-9a-f]+|\w+);/gi, (entity, code: string) => {
			if (code.startsWith('#x') || code.startsWith('#X')) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
			if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)));
			return ENTITIES[code] ?? entity;
		})
		.replace(/\s+/g, ' ')
		.trim();
	return stripped.length > DESCRIPTION_LENGTH ? `${stripped.slice(0, DESCRIPTION_LENGTH)}…` : stripped;
}

function isoDate(value: string) {
	const time = Date.parse(value);
	return Number.isNaN(time) ? '' : new Date(time).toISOString();
}

interface FeedItem {
	title?: XmlValue;
	link?: XmlValue;
	description?: XmlValue;
	summary?: XmlValue;
	content?: XmlValue;
	pubDate?: XmlValue;
	published?: XmlValue;
	updated?: XmlValue;
}

async function fetchFeed(source: string, url: string): Promise<Post[]> {
	const response = await fetch(url, { headers: { 'User-Agent': 'montblank.fun' } });
	if (!response.ok) throw new Error(`${source} feed responded ${response.status}`);
	const feed = new XMLParser({ ignoreAttributes: false }).parse(await response.text());
	const raw: FeedItem | FeedItem[] | undefined = feed?.rss?.channel?.item ?? feed?.feed?.entry;
	const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
	return items
		.map((item) => ({
			title: text(item.title),
			url: link(item.link),
			description: plain(text(item.description ?? item.summary ?? item.content)),
			date: isoDate(text(item.pubDate ?? item.published ?? item.updated)),
			source,
		}))
		.filter((post) => post.title && post.url);
}

/**
 * Newest posts across the blog, Zenn, Qiita and note.
 * A feed that fails is skipped; only when every feed fails does this throw.
 */
async function fetchPosts(limit: number) {
	const results = await Promise.allSettled(FEEDS.map(({ source, url }) => fetchFeed(source, url)));
	const posts = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
	if (results.every((result) => result.status === 'rejected')) throw new Error('every feed failed');
	return posts.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export function getPosts(limit = 12) {
	return cached(`posts:${limit}`, CACHE_SECONDS, () => fetchPosts(limit));
}
