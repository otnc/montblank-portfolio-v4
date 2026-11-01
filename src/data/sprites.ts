// Small sprites that repeat across the page. They are served as static files under /pixel/ (see src/data/pixel-files.ts)
// so the browser caches them once instead of receiving a copy inside every row of the HTML.

export interface Sprite {
	/** One string per row of dots; a key missing from `palette` (such as '.') is transparent. */
	rows: string[];
	palette: Record<string, string>;
}

// A black post with a lantern: finial, roof, four-sided glass (lit separately), collar, post, and a stepped base.
export const gasLamp: Sprite = {
	rows: [
		'....k....',
		'...kkk...',
		'..kkkkk..',
		'.kkkkkkk.',
		'.k.....k.',
		'.k.....k.',
		'.k.....k.',
		'.k.....k.',
		'..kkkkk..',
		'...kkk...',
		'....k....',
		'...kkk...',
		'....k....',
		'....k....',
		'....k....',
		'....k....',
		'....k....',
		'....k....',
		'....k....',
		'....k....',
		'....k....',
		'....k....',
		'....k....',
		'....k....',
		'...kkk...',
		'...kkk...',
		'..kkkkk..',
		'.kkkkkkk.',
	],
	palette: { k: '#1e1820' },
};

// A tile of small wave marks scattered over the water, drifted slowly by CSS.
export const harborWaves: Sprite = {
	rows: [
		'................................',
		'...ww.................ww........',
		'..w..w...............w..w.......',
		'................................',
		'................................',
		'..........ww....................',
		'.........w..w...................',
		'................................',
	],
	palette: { w: '#ffffff' },
};

export const star: Sprite = {
	rows: ['...s...', '...s...', 'sssssss', '.sssss.', '..sss..', '.ss.ss.', 's.....s'],
	palette: { s: '#e8b23a' },
};

// Two branches joining: the git-merge mark.
export const merge: Sprite = {
	rows: ['.o.......', 'ooo......', '.o.......', '.o...o...', '.ooooooo.', '.o...o...', '.o.......', 'ooo......', '.o.......'],
	palette: { o: '#7a5ad0' },
};

export const issue: Sprite = {
	rows: ['..ggg..', '.g...g.', 'g.....g', 'g..g..g', 'g.....g', '.g...g.', '..ggg..'],
	palette: { g: '#4f9a5a' },
};

// The 📌 on pinned works.
export const pushpin: Sprite = {
	rows: ['..ppp..', '..ppp..', '..ppp..', '.ppppp.', '...p...', '...p...', '...p...'],
	palette: { p: '#c8442f' },
};
