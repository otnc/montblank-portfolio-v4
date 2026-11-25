import { CACHE_SECONDS, cached } from '@/lib/cache';
import { getPublicContributions, getPublicStats, getPublicWorks } from '@/lib/github-public';

const GRAPHQL_URL = 'https://api.github.com/graphql';
const USER_AGENT = 'montblank.fun';
const FALLBACK_LANGUAGE_COLOR = '#8b8b8b';

export interface LanguageShare {
	name: string;
	color: string;
	/** 0 to 100, or left out when only the main language is known. */
	percentage?: number;
}

export interface GithubStats {
	totalContributions: number;
	followers: number;
	publicRepos: number;
	totalStars: number;
	languages: LanguageShare[];
	/** Oldest first. */
	recentDays: { date: string; count: number }[];
}

export interface Work {
	name: string;
	owner: string;
	url: string;
	description: string;
	/** The repository's "Website" field on GitHub, if set. */
	homepage?: string;
	stars: number;
	/** Merged pull requests and issues in the whole repository (by anyone), `null` when unknown. */
	mergedCount: number | null;
	issueCount: number | null;
	/** Pinned on the GitHub profile; pinned works come first. */
	pinned: boolean;
	languages: LanguageShare[];
}

export interface Contribution {
	owner: string;
	name: string;
	url: string;
	/** Merged pull requests by the user. */
	mergedCount: number;
	/** Issues opened by the user. */
	issueCount: number;
	/** `null` when the star count could not be read. */
	stars: number | null;
	languages: LanguageShare[];
}

/**
 * The order portfolio-v3 used: biggest projects (by stars) first, unknown star counts last,
 * and ties broken by how much the user contributed (merged pull requests plus issues).
 */
export function sortContributions(contributions: Contribution[]) {
	const total = (c: Contribution) => c.mergedCount + c.issueCount;
	return contributions.sort((a, b) => {
		if (a.stars === null && b.stars === null) return total(b) - total(a);
		if (a.stars === null) return 1;
		if (b.stars === null) return -1;
		return b.stars - a.stars || total(b) - total(a);
	});
}

interface LanguageEdges {
	totalSize?: number;
	edges: { size: number; node: { name: string; color: string | null } }[];
}

const LANGUAGES_FIELD = 'languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { totalSize edges { size node { name color } } }';

async function graphql<T>(token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
	const response = await fetch(GRAPHQL_URL, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
		body: JSON.stringify({ query, variables }),
	});
	if (!response.ok) throw new Error(`GitHub GraphQL responded ${response.status}`);
	const json: { data?: T; errors?: { message: string }[] } = await response.json();
	// Partial data is fine (e.g. one deleted repository among the contributions), so only a missing payload is fatal.
	if (!json.data) throw new Error(`GitHub GraphQL failed: ${json.errors?.map((error) => error.message).join('; ')}`);
	return json.data;
}

function toShares(sizes: Map<string, { size: number; color: string }>): LanguageShare[] {
	const total = [...sizes.values()].reduce((sum, { size }) => sum + size, 0);
	if (total === 0) return [];
	return [...sizes]
		.map(([name, { size, color }]) => ({ name, color, percentage: (size / total) * 100 }))
		.sort((a, b) => b.percentage - a.percentage);
}

function addLanguages(sizes: Map<string, { size: number; color: string }>, languages: LanguageEdges) {
	for (const { size, node } of languages.edges) {
		const previous = sizes.get(node.name)?.size ?? 0;
		sizes.set(node.name, { size: previous + size, color: node.color ?? FALLBACK_LANGUAGE_COLOR });
	}
}

function languageShares(languages: LanguageEdges | undefined) {
	const sizes = new Map<string, { size: number; color: string }>();
	if (languages) addLanguages(sizes, languages);
	return toShares(sizes);
}

// ---- Stats ----

interface ProfilePage {
	user: {
		createdAt: string;
		followers: { totalCount: number };
		contributionsCollection: {
			contributionCalendar: { weeks: { contributionDays: { date: string; contributionCount: number }[] }[] };
		};
	};
}

const PROFILE_QUERY = `
	query ($login: String!, $from: DateTime!, $to: DateTime!) {
		user(login: $login) {
			createdAt
			followers { totalCount }
			contributionsCollection(from: $from, to: $to) {
				contributionCalendar { weeks { contributionDays { date contributionCount } } }
			}
		}
	}
`;

type OwnRepository = { id: string; stargazerCount: number; languages: LanguageEdges };

interface RepositoriesPage {
	user: {
		repositories: {
			totalCount: number;
			pageInfo: { hasNextPage: boolean; endCursor: string | null };
			nodes: OwnRepository[];
		};
	};
}

const REPOSITORIES_QUERY = `
	query ($login: String!, $after: String, $direction: OrderDirection!) {
		user(login: $login) {
			repositories(first: 100, after: $after, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, orderBy: { field: CREATED_AT, direction: $direction }) {
				totalCount
				pageInfo { hasNextPage endCursor }
				nodes { id stargazerCount ${LANGUAGES_FIELD} }
			}
		}
	}
`;

/**
 * Every public non-fork repository the user owns.
 * The oldest and newest 100 are requested together, which covers up to 200 repositories in the time of one request
 * (each page takes seconds because of the languages); beyond that the oldest end is paged on.
 */
async function fetchOwnRepositories(token: string, login: string) {
	const page = (direction: 'ASC' | 'DESC', after: string | null) =>
		graphql<RepositoriesPage>(token, REPOSITORIES_QUERY, { login, after, direction }).then((data) => data.user.repositories);
	const [oldest, newest] = await Promise.all([page('ASC', null), page('DESC', null)]);
	const byId = new Map<string, OwnRepository>();
	for (const repository of [...oldest.nodes, ...newest.nodes]) byId.set(repository.id, repository);
	let next = oldest.pageInfo;
	while (byId.size < oldest.totalCount && next.hasNextPage) {
		const more = await page('ASC', next.endCursor);
		for (const repository of more.nodes) byId.set(repository.id, repository);
		next = more.pageInfo;
	}
	return [...byId.values()];
}

const RECENT_DAYS = 31;
const DAY_MS = 24 * 60 * 60 * 1000;

/** contributionsCollection covers at most one year per call, so each year gets its own alias in a single query. */
async function fetchAllTimeContributions(token: string, login: string, createdAt: string) {
	const firstYear = new Date(createdAt).getUTCFullYear();
	const lastYear = new Date().getUTCFullYear();
	const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
	const fields = years
		.map(
			(year) =>
				`y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") { contributionCalendar { totalContributions } }`,
		)
		.join('\n');
	const data = await graphql<{ user: Record<string, { contributionCalendar: { totalContributions: number } }> }>(
		token,
		`query ($login: String!) { user(login: $login) { ${fields} } }`,
		{ login },
	);
	return years.reduce((sum, year) => sum + (data.user[`y${year}`]?.contributionCalendar.totalContributions ?? 0), 0);
}

async function fetchStats(token: string, login: string): Promise<GithubStats> {
	const to = new Date();
	const from = new Date(to.getTime() - (RECENT_DAYS - 1) * DAY_MS);
	const profile = graphql<ProfilePage>(token, PROFILE_QUERY, { login, from: from.toISOString(), to: to.toISOString() }).then(
		async ({ user }) => {
			if (!user) throw new Error(`GitHub user ${login} not found`);
			return { user, totalContributions: await fetchAllTimeContributions(token, login, user.createdAt) };
		},
	);
	const [{ user, totalContributions }, repositories] = await Promise.all([profile, fetchOwnRepositories(token, login)]);

	const sizes = new Map<string, { size: number; color: string }>();
	for (const repository of repositories) addLanguages(sizes, repository.languages);

	return {
		totalContributions,
		followers: user.followers.totalCount,
		publicRepos: repositories.length,
		totalStars: repositories.reduce((sum, repository) => sum + repository.stargazerCount, 0),
		languages: toShares(sizes),
		recentDays: user.contributionsCollection.contributionCalendar.weeks
			.flatMap((week) => week.contributionDays)
			.slice(-RECENT_DAYS)
			.map((day) => ({ date: day.date, count: day.contributionCount })),
	};
}

/** Uses GraphQL when a token is set, otherwise the token-less sources in github-public.ts. */
export function getGithubStats(token: string | undefined, login: string) {
	if (!token) return getPublicStats(login);
	return cached(`github-stats:${login}`, CACHE_SECONDS, () => fetchStats(token, login));
}

// ---- Works ----

interface RepositoryNode {
	name: string;
	url: string;
	owner: { login: string };
	description: string | null;
	homepageUrl: string | null;
	stargazerCount: number;
	languages: LanguageEdges;
	pullRequests: { totalCount: number };
	issues: { totalCount: number };
}

const REPOSITORY_FIELDS = `name url owner { login } description homepageUrl stargazerCount ${LANGUAGES_FIELD} pullRequests(states: MERGED) { totalCount } issues { totalCount }`;
// After the pinned ones, as many of the most starred repositories as portfolio-v3 showed.
const OTHER_WORKS = 9;

const toWork = (repository: RepositoryNode, pinned: boolean): Work => ({
	name: repository.name,
	owner: repository.owner.login,
	url: repository.url,
	description: repository.description ?? '',
	homepage: repository.homepageUrl || undefined,
	stars: repository.stargazerCount,
	mergedCount: repository.pullRequests.totalCount,
	issueCount: repository.issues.totalCount,
	pinned,
	languages: languageShares(repository.languages),
});

/** The pinned repositories in profile order, then the most starred of the rest, as portfolio-v3 listed works. */
async function fetchWorks(token: string, login: string): Promise<Work[]> {
	const data = await graphql<{ user: { pinnedItems: { nodes: RepositoryNode[] }; repositories: { nodes: RepositoryNode[] } } }>(
		token,
		`query ($login: String!) {
			user(login: $login) {
				pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { ${REPOSITORY_FIELDS} } } }
				repositories(first: 20, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
					nodes { ${REPOSITORY_FIELDS} }
				}
			}
		}`,
		{ login },
	);
	const pinned = data.user.pinnedItems.nodes.map((repository) => toWork(repository, true));
	const pinnedUrls = new Set(pinned.map((work) => work.url));
	const others = data.user.repositories.nodes
		.filter((repository) => !pinnedUrls.has(repository.url))
		.slice(0, OTHER_WORKS)
		.map((repository) => toWork(repository, false));
	return [...pinned, ...others];
}

export function getWorks(token: string | undefined, login: string) {
	if (!token) return getPublicWorks(login);
	return cached(`github-works-v2:${login}`, CACHE_SECONDS, () => fetchWorks(token, login));
}

// ---- Contributions ----

type SearchRepository = { name: string; url: string; owner: { login: string }; stargazerCount: number; languages: LanguageEdges };

interface SearchPage {
	search: {
		pageInfo: { hasNextPage: boolean; endCursor: string | null };
		nodes: { repository?: SearchRepository }[];
	};
}

const SEARCH_PAGE_SIZE = 100;
const SEARCH_RESULT_LIMIT = 1000;

const CONTRIBUTIONS_QUERY = `
	query ($query: String!, $after: String) {
		search(query: $query, type: ISSUE, first: ${SEARCH_PAGE_SIZE}, after: $after) {
			pageInfo { hasNextPage endCursor }
			nodes {
				... on PullRequest { repository { name url owner { login } stargazerCount ${LANGUAGES_FIELD} } }
				... on Issue { repository { name url owner { login } stargazerCount ${LANGUAGES_FIELD} } }
			}
		}
	}
`;

const SEARCH_COUNT_QUERY = 'query ($query: String!) { search(query: $query, type: ISSUE, first: 0) { issueCount } }';

const offsetCursor = (offset: number) => btoa(`cursor:${offset}`);

/**
 * Every result of a search, up to the 1,000 GitHub returns, as the repositories they belong to.
 * Search cursors are currently base64 of `cursor:<offset>`, so after a quick count every page is requested at once
 * instead of one after another (each page takes one to four seconds).
 * If the first page shows GitHub has changed the format, the pages are followed one by one instead.
 */
async function searchRepositories(token: string, query: string) {
	const page = (after: string | null) => graphql<SearchPage>(token, CONTRIBUTIONS_QUERY, { query, after }).then((data) => data.search);
	const count = await graphql<{ search: { issueCount: number } }>(token, SEARCH_COUNT_QUERY, { query });
	const last = Math.min(count.search.issueCount, SEARCH_RESULT_LIMIT);
	const offsets: number[] = [];
	for (let offset = SEARCH_PAGE_SIZE; offset < last; offset += SEARCH_PAGE_SIZE) offsets.push(offset);
	// Settled rather than all: with a changed cursor format these requests may fail, and are then not needed.
	const [first, rest] = await Promise.all([page(null), Promise.allSettled(offsets.map((offset) => page(offsetCursor(offset))))]);

	const pages = [first];
	if (!first.pageInfo.hasNextPage || first.pageInfo.endCursor === offsetCursor(SEARCH_PAGE_SIZE)) {
		for (const result of rest) {
			if (result.status === 'rejected') throw result.reason;
			pages.push(result.value);
		}
	} else {
		let next = first.pageInfo;
		while (next.hasNextPage) {
			const more = await page(next.endCursor);
			pages.push(more);
			next = more.pageInfo;
		}
	}
	return pages.flatMap((result) => result.nodes.flatMap(({ repository }) => (repository ? [repository] : [])));
}

/**
 * Pull requests merged into other people's repositories and issues opened there, counted per repository, as portfolio-v3 did.
 * GraphQL search returns the repository with each result, so stars and languages need no extra requests.
 */
async function fetchContributions(token: string, login: string): Promise<Contribution[]> {
	const [merged, issues] = await Promise.all([
		searchRepositories(token, `type:pr author:${login} is:merged -user:${login}`),
		searchRepositories(token, `type:issue author:${login} -user:${login}`),
	]);
	const byRepo = new Map<string, Contribution>();
	const entry = (repository: SearchRepository) => {
		const key = `${repository.owner.login}/${repository.name}`;
		let contribution = byRepo.get(key);
		if (!contribution) {
			contribution = {
				owner: repository.owner.login,
				name: repository.name,
				url: repository.url,
				mergedCount: 0,
				issueCount: 0,
				stars: repository.stargazerCount,
				languages: languageShares(repository.languages),
			};
			byRepo.set(key, contribution);
		}
		return contribution;
	};
	for (const repository of merged) entry(repository).mergedCount += 1;
	for (const repository of issues) entry(repository).issueCount += 1;
	return sortContributions([...byRepo.values()]);
}

export function getContributions(token: string | undefined, login: string) {
	if (!token) return getPublicContributions(login);
	return cached(`github-contributions-v2:${login}`, CACHE_SECONDS, () => fetchContributions(token, login));
}
