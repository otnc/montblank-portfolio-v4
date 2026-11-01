/**
 * A Hakodate city tram, modelled on car 812 of the 800 series, the one kept in the old standard "sasa-iro two-tone" livery:
 * ivory above, bamboo green below, two-leaf doors at the front and in the middle. Served as the static file /pixel/tram.svg.
 */
import { scene } from '@/data/scene';
import { Grid } from '@/lib/pixel-grid';

export const W = 96;
export const H = 40;
export const tram = new Grid(W, H);
const g = tram;
const { upper, lower, band, ink, glass } = scene.tram;

// The pantograph in the middle of the roof.
for (let index = 0; index < 4; index += 1) {
	g.set(30 + index, 7 - index, ink);
	g.set(40 - index, 7 - index, ink);
}
g.rect(32, 3, 7, 1, ink);
g.rect(4, 9, 88, 2, ink);
// Body: ivory upper half, bamboo green lower half, a darker line between.
g.rect(1, 10, 94, 25, ink);
g.rect(2, 11, 92, 12, upper);
g.rect(2, 23, 92, 11, lower);
g.rect(2, 22, 92, 1, band);
// Two-leaf doors in the middle and at the front, side windows, and the front end's window and headlight.
for (const doorX of [40, 78]) {
	g.rect(doorX, 13, 11, 21, ink);
	g.rect(doorX + 1, 14, 4, 7, glass);
	g.rect(doorX + 6, 14, 4, 7, glass);
	g.rect(doorX + 1, 22, 4, 12, band);
	g.rect(doorX + 6, 22, 4, 12, band);
}
for (const x of [4, 13, 22, 31, 53, 62]) {
	g.rect(x, 13, 8, 8, ink);
	g.rect(x + 1, 14, 6, 6, glass);
	g.rect(x + 1, 14, 6, 1, '#e8b860');
}
g.rect(91, 12, 3, 10, ink);
g.rect(92, 13, 2, 8, glass);
g.rect(91, 26, 3, 3, '#fff1c4');
// Bogies and wheels.
for (const bx of [10, 66]) {
	g.rect(bx, 34, 18, 2, ink);
	g.disc(bx + 4, 37, 3, (dx, dy, d) => (d < 1 ? '#5a4a4a' : '#1a1212'));
	g.disc(bx + 14, 37, 3, (dx, dy, d) => (d < 1 ? '#5a4a4a' : '#1a1212'));
}
