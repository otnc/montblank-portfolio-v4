import type { PixelIconName } from '@/data/pixel-icons';

export const SITE_ORIGIN = 'https://montblank.fun';

export const profile = {
	name: 'まろん｡',
	siteName: 'まろん｡のポートフォリオ',
	handle: 'otnc',
	twitter: '@rin_montblank',
	icon: '/icon.png',
	bio: 'JavaScript / TypeScript / Web を触っている大学生の個人開発勢です。主にOSS開発とネタ開発をしています。フロントエンドよりもバックエンドのほうが得意です。最近は開発バイトしてます。',
	birthday: '2006/11/02',
	location: 'Hakodate, Hokkaido, Japan',
	catchphrases: ['便利とロマンをシェアしよう', '思い立ったが吉日'],
	// Typed out under the name in the hero.
	tagline: 'くそざこ園児にゃー',
	// Scrolled across the banner at the top.
	messages: ['montblank.fun へようこそ', '便利とロマンをシェアしよう', '思い立ったが吉日', 'ゆっくりしていってね'],
	email: 'contact@montblank.fun',
};

export interface TagGroup {
	heading: string;
	items: string[];
}

export const tagGroups: TagGroup[] = [
	{ heading: '趣味', items: ['プログラミング', 'OSS', '温泉', '旅行', '散策', 'カフェ巡り'] },
	{
		heading: '所属',
		items: ["公立はこだて未来大学 '25 (B1)", '株式会社函館ラボラトリ (バイト)', 'Oto Home', 'もふもふぽっぷ'],
	},
	{ heading: 'サークル', items: ["Mariners' conference", 'Sound Create', '温泉同好会'] },
	{ heading: '実績', items: ['P2HACKS 2025 Pre-PBL部門 最優秀賞', 'P2HACKS 2025 Pre-PBL部門 Fenrir賞'] },
];

export interface LinkItem {
	label: string;
	url: string;
}

export interface Account extends LinkItem {
	handle?: string;
	icon: PixelIconName;
}

export const accounts: Account[] = [
	{ label: 'GitHub', handle: 'otnc', url: 'https://github.com/otnc', icon: 'github' },
	{ label: 'GitHub', handle: 'oto-lab', url: 'https://github.com/oto-lab', icon: 'github' },
	{ label: 'Twitter', handle: '@rin_montblank', url: 'https://twitter.com/rin_montblank', icon: 'twitter' },
	{ label: 'Misskey', handle: '@m@misskey.otnc.dev', url: 'https://misskey.otnc.dev/@m', icon: 'misskey' },
	{ label: 'mixi2', handle: '@rin_montblank', url: 'https://mixi.social/@rin_montblank', icon: 'mixi2' },
	{ label: 'Instagram', handle: 'rin_montblank', url: 'https://www.instagram.com/rin_montblank/', icon: 'instagram' },
];

export interface WritingSite extends LinkItem {
	icon: PixelIconName;
}

// Shown in the header and used to label posts in the blog section; `label` must match `source` in src/lib/feeds.ts.
export const writingSites: WritingSite[] = [
	{ label: 'Blog', url: 'https://blog.montblank.fun/', icon: 'blog' },
	{ label: 'Zenn', url: 'https://zenn.dev/devuloper', icon: 'zenn' },
	{ label: 'Qiita', url: 'https://qiita.com/devuloper', icon: 'qiita' },
	{ label: 'note', url: 'https://note.com/otoneko1102', icon: 'note' },
];

export type CareerCategory = 'work' | 'project' | 'award';

export interface CareerItem {
	date: string;
	category: CareerCategory;
	/** Each entry is shown on its own line. */
	lines: string[];
	url?: string;
}

export const careerCategoryLabels: Record<CareerCategory, string> = {
	work: '学歴・職歴',
	project: '開発',
	award: '受賞',
};

// Newest first.
export const career: CareerItem[] = [
	{
		date: '2026/10',
		category: 'project',
		lines: ['JPHACKS 2026 札幌予選', '参加'],
		url: 'https://fllooat.mfmf.moe',
	},
	{
		date: '2026/09',
		category: 'work',
		lines: ['フェンリル株式会社', '2026年度サマーインターンシップ 参加'],
		url: 'https://fenrir-inc.com',
	},
	{
		date: '2026/04',
		category: 'project',
		lines: ['RubyKaigi 2026', 'スタッフとして参加'],
		url: 'https://rubykaigi.org/2026/about/',
	},
	{
		date: '2025/12',
		category: 'award',
		lines: ['P2HACKS 2025', 'Pre-PBL部門 最優秀賞・Fenrir賞 受賞'],
		url: 'https://universe.mfmf.moe',
	},
	{ date: '2025/11', category: 'work', lines: ['株式会社函館ラボラトリ', '開発バイト開始'] },
	{ date: '2025/09', category: 'project', lines: ['Engineer Guild Hackathon', '参加'] },
	{ date: '2025/04', category: 'work', lines: ['公立はこだて未来大学 入学'] },
	{ date: '2025/03', category: 'work', lines: ['北海道岩見沢東高等学校 卒業'] },
	{ date: '2023/07', category: 'project', lines: ['OSS活動 開始'] },
	{ date: '2022/12', category: 'project', lines: ['Web開発 開始 (JavaScript / HTML / CSS)'] },
];

export interface CrossLink {
	author: string;
	url: string;
	/**
	 * Their banner if they offer one, loaded straight from their site so it follows their updates.
	 * Left out, /links shows the OGP image their page points to, or its favicon; `false` shows no image.
	 * Its size is not written down: /links tells a wide banner from an icon once it has loaded.
	 */
	image?: string | false;
}

// Sites that link back here, listed on /links. None of them forbids hotlinking (checked 2026/11).
export const crossLinks: CrossLink[] = [
	{ author: 'キノえもん', url: 'https://kinoemon.com', image: 'https://kinoemon.com/icon.webp' },
	{ author: 'shikoshib', url: 'https://shikoshib.ru', image: 'https://shikoshib.ru/assets/logo-ja.png' },
	{ author: 'ActiveTK.', url: 'https://profile.activetk.jp', image: 'https://profile.activetk.jp/avatar.png' },
	{ author: 'sugimoto', url: 'https://sugimoto.fun', image: 'https://sugimoto.fun/icon6.png' },
	{ author: 'Np', url: 'https://negapainter.work', image: 'https://negapainter.work/ogp.png' },
	{ author: 'トラマト', url: 'https://toramutton.me', image: 'https://toramutton.me/icon.png' },
	{ author: 'yonu', url: 'https://yonu.work', image: 'https://yonu.work/favicon.png' },
	{ author: 'Sata', url: 'https://about.satacloud.net', image: 'https://about.satacloud.net/icon.webp' },
	{ author: 'Shiba', url: 'https://shibadogcap.com' },
	{ author: 'iMac G3', url: 'https://imacg3.xblog.jp' }
];

// The way back to otoneko.cat, which links here from its bottle mail (otnc-portfolio-v3: src/data/profile.ts `altPersona`).
export const otherSelf = {
	name: 'otoneko.',
	site: { label: 'otoneko.cat', url: 'https://otoneko.cat' },
};
