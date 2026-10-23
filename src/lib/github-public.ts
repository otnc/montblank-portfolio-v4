// The token-less way to read GitHub: the unofficial pinned and contributions APIs, the public REST API (60 calls an hour per IP),
// ungh.cc for star counts, and the contribution calendar on github.com as a fallback. Used when GITHUB_TOKEN is not set.
import { CACHE_SECONDS, cached } from '@/lib/cache';
import { sortContributions, type Contribution, type GithubStats, type LanguageShare, type Work } from '@/lib/github';

const API = 'https://api.github.com';
const PINNED_API_URL = 'https://pinned.berrysauce.dev/get';
const UNGH_API_URL = 'https://ungh.cc';
// GitHub Linguist colours, mirrored as JSON; the REST API returns language names without colours.
const COLORS_URL = 'https://raw.githubusercontent.com/ozh/github-colors/master/colors.json';
const FALLBACK_LANGUAGE_COLOR = '#8b8b8b';
const RECENT_DAYS = 31;
// ungh.cc is called once per repository, so cap it to stay well under the Worker's subrequest limit.
const MAX_STAR_LOOKUPS = 20;
const HEADERS = { Accept: 'application/vnd.github+json', 'User-Agent': 'montblank.fun' };

async function getJson<T>(url: string, headers: Record<string, string> = HEADERS): Promise<T> {
	const response = await fetch(url, { headers });
	if (!response.ok) throw new Error(`${url} responded ${response.status}`);
	return response.json() as Promise<T>;
}

function languageColors() {
	return cached('language-colors', 24 * CACHE_SECONDS, async () => {
		const raw = await getJson<Record<string, { color?: string | null }>>(COLORS_URL, { 'User-Agent': 'montblank.fun' });
		return Object.fromEntries(Object.entries(raw).flatMap(([name, entry]) => (entry.color ? [[name, entry.color]] : [])));
	}).catch(() => ({}) as Record<string, string>);
}

function shares(sizes: Record<string, number>, colors: Record<string, string>): LanguageShare[] {
	const total = Object.values(sizes).reduce((sum, size) => sum + size, 0);
	if (total === 0) return [];
	return Object.entries(sizes)
		.map(([name, size]) => ({ name, color: colors[name] ?? FALLBACK_LANGUAGE_COLOR, percentage: (size / total) * 100 }))
		.sort((a, b) => b.percentage - a.percentage);
}

interface RestRepo {
	name: string;
	description: string | null;
	fork: boolean;
	stargazers_count: number;
	language: string | null;
	size: number;
	homepage: string | null;
}

function ownRepos(login: string) {
	return cached(`rest-repos-v2:${login}`, CACHE_SECONDS, async () => {
		const repos: RestRepo[] = [];
		for (let page = 1; page <= 3; page += 1) {
			const batch = await getJson<RestRepo[]>(`${API}/users/${login}/repos?type=owner&per_page=100&page=${page}`);
			repos.push(...batch);
			if (batch.length < 100) break;
		}
		return repos.map(({ name, description, fork, stargazers_count, language, size, homepage }) => ({ name, description, fork, stargazers_count, language, size, homepage }));
	});
}

// ---- Stats ----

/** The unofficial contributions API: every year's total and every day's count in one request. */
const CONTRIBUTIONS_API_URL = 'https://github-contributions-api.jogruber.de/v4';

interface Calendar {
	total: number;
	days: { date: string; count: number }[];
}

async function contributionsFromApi(login: string): Promise<Calendar> {
	const data = await getJson<{ total: Record<string, number>; contributions: { date: string; count: number }[] }>(
		`${CONTRIBUTIONS_API_URL}/${login}?y=all`,
		{ 'User-Agent': 'montblank.fun' },
	);
	return {
		total: Object.values(data.total).reduce((sum, count) => sum + count, 0),
		days: data.contributions.map(({ date, count }) => ({ date, count })),
	};
}

/** Daily counts and the yearly total from the contribution calendar on a profile page; the fallback when the API above is down. */
async function calendarYear(login: string, year: number): Promise<Calendar> {
	const response = await fetch(`https://github.com/users/${login}/contributions?from=${year}-01-01&to=${year}-12-31`, {
		headers: { 'User-Agent': 'Mozilla/5.0 (compatible; montblank.fun)' },
	});
	if (!response.ok) throw new Error(`contribution calendar responded ${response.status}`);
	const html = await response.text();
	const total = Number(html.match(/js-contribution-activity-description[^>]*>\s*([\d,]+)\s*contribution/)?.[1]?.replace(/,/g, '') ?? 0);
	const dates = new Map<string, string>();
	for (const [, date, id] of html.matchAll(/data-date="([\d-]+)" id="([^"]+)"/g)) dates.set(id, date);
	const days: { date: string; count: number }[] = [];
	for (const [, id, label] of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
		const date = dates.get(id);
		if (date) days.push({ date, count: Number(label.match(/^([\d,]+) contribution/)?.[1]?.replace(/,/g, '') ?? 0) });
	}
	return { total, days };
}

export function getPublicStats(login: string) {
	return cached(`public-stats-v2:${login}`, CACHE_SECONDS, async (): Promise<GithubStats> => {
		const [user, repos, colors] = await Promise.all([
			getJson<{ followers: number; created_at: string }>(`${API}/users/${login}`),
			ownRepos(login),
			languageColors(),
		]);
		const calendar = await contributionsFromApi(login).catch(async () => {
			const firstYear = new Date(user.created_at).getUTCFullYear();
			const lastYear = new Date().getUTCFullYear();
			const years = await Promise.all(
				Array.from({ length: lastYear - firstYear + 1 }, (_, index) => calendarYear(login, firstYear + index)),
			);
			return { total: years.reduce((sum, year) => sum + year.total, 0), days: years.flatMap((year) => year.days) };
		});
		const today = new Date().toISOString().slice(0, 10);
		const sources = repos.filter((repo) => !repo.fork);
		// Without per-repository byte counts, each repository's size is credited to its main language.
		const sizes: Record<string, number> = {};
		for (const repo of sources) if (repo.language) sizes[repo.language] = (sizes[repo.language] ?? 0) + repo.size;
		return {
			totalContributions: calendar.total,
			followers: user.followers,
			publicRepos: sources.length,
			totalStars: sources.reduce((sum, repo) => sum + repo.stargazers_count, 0),
			languages: shares(sizes, colors),
			recentDays: calendar.days
				.filter((day) => day.date <= today)
				.sort((a, b) => a.date.localeCompare(b.date))
				.slice(-RECENT_DAYS),
		};
	});
}

// ---- Works ----

interface PinnedItem {
	author?: string;
	name?: string;
	description?: string;
	language?: string;
	stars?: number;
}

// After the pinned ones, as many of the most starred repositories as portfolio-v3 showed.
const OTHER_WORKS = 9;

/**
 * The pinned repositories, then the most starred of the rest, as portfolio-v3 listed works.
 * Without a token the merged pull request and issue counts are unknown, and the other works only have their main language.
 */
export function getPublicWorks(login: string) {
	return cached(`public-works-v2:${login}`, CACHE_SECONDS, async (): Promise<Work[]> => {
		const [pinned, repos, colors] = await Promise.all([
			getJson<PinnedItem[]>(`${PINNED_API_URL}/${login}`, { 'User-Agent': 'montblank.fun' }),
			ownRepos(login).catch(() => []),
			languageColors(),
		]);
		const homepages = new Map(repos.map((repo) => [repo.name, repo.homepage]));
		const pinnedWorks: Work[] = await Promise.all(
			pinned.map(async (item) => {
				const owner = item.author ?? login;
				const name = item.name ?? '';
				const [homepage, sizes] = await Promise.all([
					owner === login
						? homepages.get(name)
						: getJson<{ homepage: string | null }>(`${API}/repos/${owner}/${name}`).then((repo) => repo.homepage, () => null),
					getJson<Record<string, number>>(`${API}/repos/${owner}/${name}/languages`).catch(() => (item.language ? { [item.language]: 1 } : {})),
				]);
				return {
					name,
					owner,
					url: `https://github.com/${owner}/${name}`,
					description: item.description ?? '',
					homepage: homepage || undefined,
					stars: item.stars ?? 0,
					mergedCount: null,
					issueCount: null,
					pinned: true,
					languages: shares(sizes, colors),
				};
			}),
		);
		const pinnedUrls = new Set(pinnedWorks.map((work) => work.url));
		const others: Work[] = repos
			.filter((repo) => !repo.fork && !pinnedUrls.has(`https://github.com/${login}/${repo.name}`))
			.sort((a, b) => b.stargazers_count - a.stargazers_count)
			.slice(0, OTHER_WORKS)
			.map((repo) => ({
				name: repo.name,
				owner: login,
				url: `https://github.com/${login}/${repo.name}`,
				description: repo.description ?? '',
				homepage: repo.homepage || undefined,
				stars: repo.stargazers_count,
				mergedCount: null,
				issueCount: null,
				pinned: false,
				languages: repo.language ? [{ name: repo.language, color: colors[repo.language] ?? FALLBACK_LANGUAGE_COLOR }] : [],
			}));
		return [...pinnedWorks, ...others];
	});
}

// ---- Contributions ----

// The search API returns at most 1,000 results (10 pages of 100).
const SEARCH_MAX_PAGES = 10;

/** Counts the results of an issue search per repository ("owner/name"). */
async function countByRepository(query: string) {
	const counts = new Map<string, number>();
	for (let page = 1; page <= SEARCH_MAX_PAGES; page += 1) {
		const data = await getJson<{ items: { repository_url: string }[] }>(
			`${API}/search/issues?q=${encodeURIComponent(query)}&per_page=100&page=${page}`,
		);
		for (const item of data.items) {
			const repo = item.repository_url.match(/repos\/([^/]+\/[^/]+)$/)?.[1];
			if (repo) counts.set(repo, (counts.get(repo) ?? 0) + 1);
		}
		if (data.items.length < 100) break;
	}
	return counts;
}

/** Merged pull requests and opened issues in other people's repositories, as portfolio-v3 counted them. Languages are left out without a token. */
export function getPublicContributions(login: string) {
	return cached(`public-contributions-v2:${login}`, CACHE_SECONDS, async (): Promise<Contribution[]> => {
		const [merged, issues] = await Promise.all([
			countByRepository(`type:pr author:${login} is:merged -user:${login}`),
			countByRepository(`type:issue author:${login} -user:${login}`),
		]);
		const repos = [...new Set([...merged.keys(), ...issues.keys()])];
		const contributions = await Promise.all(
			repos.map(async (repo, index) => {
				const [owner, name] = repo.split('/');
				const stars =
					index < MAX_STAR_LOOKUPS
						? await getJson<{ repo?: { stars?: number } }>(`${UNGH_API_URL}/repos/${repo}`, { 'User-Agent': 'montblank.fun' }).then(
								(data) => data.repo?.stars ?? null,
								() => null,
							)
						: null;
				return {
					owner,
					name,
					url: `https://github.com/${repo}`,
					mergedCount: merged.get(repo) ?? 0,
					issueCount: issues.get(repo) ?? 0,
					stars,
					languages: [],
				};
			}),
		);
		return sortContributions(contributions);
	});
}
