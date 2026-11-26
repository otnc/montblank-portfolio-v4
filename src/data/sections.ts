/**
 * The top page's windows, in page order, for the header menu.
 * Each `id` must match the `id` its window passes to `Window`.
 */
export const sections = [
	{ id: 'about', label: 'About' },
	{ id: 'blog', label: 'Blog' },
	{ id: 'github', label: 'GitHub' },
	{ id: 'works', label: 'Works' },
	{ id: 'contributions', label: 'Contributions' },
	{ id: 'career', label: 'Career' },
	{ id: 'links', label: 'Links' },
] as const;

export type SectionId = (typeof sections)[number]['id'];
