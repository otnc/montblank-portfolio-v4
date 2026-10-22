import type { PixelIconName } from '@/data/pixel-icons';

export const SITE_ORIGIN = 'https://montblank.fun';

export const profile = {
	name: 'まろん｡',
	handle: 'otnc',
	twitter: '@rin_montblank',
	avatar: '/avatar.png',
	bio: 'JavaScript / TypeScript / Web を触っている大学生の個人開発勢です。主にOSS開発とネタ開発をしています。フロントエンドよりもバックエンドのほうが得意です。最近は開発バイトしてます。',
	birthday: '2006/11/02',
	location: 'Hakodate, Hokkaido, Japan',
	catchphrases: ['便利とロマンをシェアしよう', '思い立ったが吉日'],
	// Scrolled across the banner at the top.
	messages: ['montblank.fun へようこそ', '便利とロマンをシェアしよう', '思い立ったが吉日', 'ゆっくりしていってね'],
	email: 'contact@montblank.fun',
	since: 2022,
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
	{ label: 'X', handle: '@rin_montblank', url: 'https://twitter.com/rin_montblank', icon: 'twitter' },
	{ label: 'WakaTime', handle: '@otnc', url: 'https://wakatime.com/@otnc', icon: 'wakatime' },
	{ label: 'Discord', url: 'https://discord.com/users/236727759672442880', icon: 'discord' },
	{ label: 'Misskey', handle: '@m@misskey.otnc.dev', url: 'https://misskey.otnc.dev/@m', icon: 'misskey' },
	{ label: 'mixi2', handle: '@rin_montblank', url: 'https://mixi.social/@rin_montblank', icon: 'mixi2' },
	{ label: 'Instagram', handle: 'rin_montblank', url: 'https://www.instagram.com/rin_montblank/', icon: 'instagram' },
	{ label: 'SoundCloud', handle: 'marronium', url: 'https://soundcloud.com/marronium', icon: 'soundcloud' },
	{ label: 'Spotify', url: 'https://open.spotify.com/user/31ichihsves6wrs7th6eoufpmuua', icon: 'spotify' },
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
	{ date: '2025/04', category: 'work', lines: ['公立はこだて未来大学 入学'] },
	{ date: '2025/03', category: 'work', lines: ['北海道岩見沢東高等学校 卒業'] },
	{ date: '2023/07', category: 'project', lines: ['OSS活動 開始'] },
	{ date: '2022/12', category: 'project', lines: ['Web開発 開始 (JavaScript / HTML / CSS)'] },
];

export interface CrossLink {
	author: string;
	url: string;
}

// Sites that link back here.
export const crossLinks: CrossLink[] = [
	{ author: 'キノえもん', url: 'https://kinoemon.com' },
	{ author: 'shikoshib', url: 'https://shikoshib.ru' },
	{ author: 'ActiveTK.', url: 'https://profile.activetk.jp' },
	{ author: 'sugimoto', url: 'https://sugimoto.fun' },
	{ author: 'Np', url: 'https://negapainter.work' },
];

const crossLinkRequestMessage = [
	'相互リンクしませんか！',
	'',
	'URL:',
	'あなたの名前:',
	'紹介文:(任意)',
	'サイト名:(任意)',
	'サムネイルURL:(任意)',
	'',
	'※OGPから取得できるのであれば任意の部分は不要',
].join('\n');

export const crossLinkRequest = {
	url: `https://twitter.com/messages/compose?recipient_id=1517667933291704320&text=${encodeURIComponent(crossLinkRequestMessage)}`,
	requirements: [
		'上のボタンからTwitterのDMにアクセスし、そこで申請すること',
		'あなたのサイトが常時アクセス可能であること',
		'あなたのサイトのURL、サイト名、名義の掲載を許可すること',
		'あなたのサイトにこのサイトのURLとサイト名を掲載すること',
	],
};

// The way back to otoneko.cat, which links here from its bottle mail (otnc-portfolio-v3: src/data/profile.ts `altPersona`).
export const otherSelf = {
	name: 'otoneko.',
	summary: 'ネタ駆動で開発しています。便利なものから、使い道のないただの一発ネタまで。',
	twitter: { handle: '@rin_pineapple', url: 'https://twitter.com/rin_pineapple' },
	site: { label: 'otoneko.cat', url: 'https://otoneko.cat' },
};
