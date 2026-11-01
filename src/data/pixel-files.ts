// Pixel art served as static files under /pixel/, prerendered at build time by src/pages/pixel/[name].svg.ts.
// Like the hand-drawn SVGs in otoneko.cat's public/pixel/, they stay out of the per-request HTML and the browser caches them.
import { bay } from '@/data/bay-view';
import { pixelIcons, type PixelIconName } from '@/data/pixel-icons';
import { gasLamp, harborWaves, issue, merge, pushpin, star, type Sprite } from '@/data/sprites';
import { stonePath } from '@/data/stone-path';
import { tram } from '@/data/tram';
import { gridSvg, spriteSvg, type Grid } from '@/lib/pixel-grid';
import { pixelPaths } from '@/lib/pixel-path';

const standalone = (svg: string) => svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
const grid = (g: Grid) => () => standalone(gridSvg(g));
const sprite = ({ rows, palette }: Sprite) => () => standalone(spriteSvg(rows, palette));
const icon = (name: PixelIconName) => () => {
	const { rows, colors } = pixelIcons[name];
	const body = pixelPaths(rows, colors).map((path) => `<path fill="${path.fill}" d="${path.d}"/>`).join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="48" height="48" shape-rendering="crispEdges">${body}</svg>`;
};

export const pixelFiles: Record<string, () => string> = {
	bay: grid(bay),
	tram: grid(tram),
	'stone-path': grid(stonePath),
	'gas-lamp': sprite(gasLamp),
	'harbor-waves': sprite(harborWaves),
	star: sprite(star),
	merge: sprite(merge),
	issue: sprite(issue),
	pushpin: sprite(pushpin),
	...Object.fromEntries(Object.keys(pixelIcons).map((name) => [`icon-${name}`, icon(name as PixelIconName)])),
};
