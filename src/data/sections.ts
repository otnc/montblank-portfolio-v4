/** A place on a page that the header menu jumps to with `#id`. */
export interface PageSection {
	id: string;
	label: string;
}

// Each `id` must match the `id` given to the window or heading it points at.
export const topSections: PageSection[] = [
	{ id: 'about', label: 'About' },
	{ id: 'blog', label: 'Blog' },
	{ id: 'github', label: 'GitHub' },
	{ id: 'works', label: 'Works' },
	{ id: 'contributions', label: 'Contributions' },
	{ id: 'career', label: 'Career' },
	{ id: 'links', label: 'Links' },
];

export const linksSections: PageSection[] = [
	{ id: 'cross-links', label: 'Links' },
	{ id: 'linking-info', label: '相互リンクする方へ' },
	{ id: 'icon-and-banners', label: 'アイコン・バナー' },
];
