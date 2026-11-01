/**
 * The bay area at dusk, along the bottom of the hero: Mt. Hakodate with its ropeway, the roofs of Motomachi
 * at its foot, and the Kanemori red brick warehouses along the water, split by the canal and its bridge.
 * The sky above is transparent so the hero's sky shows through; the water at the bottom carries on as the page background.
 * The art is served as the static file /pixel/bay.svg; BayView.astro places the animated lights from the positions below.
 */
import { scene } from '@/data/scene';
import { Grid, random, wave } from '@/lib/pixel-grid';

export const W = 640;
export const H = 150;
const CX = 320;
const TOWN = 104;
export const QUAY = 130;
export const SUN = { x: CX + 210, y: 96 };
export const bay = new Grid(W, H);
const g = bay;
const rand = random(1102);

g.disc(SUN.x, SUN.y, 13, (dx, dy, d) => (d > 11.6 ? scene.sunRim : scene.sun));

// Mt. Hakodate, "the reclining ox": long and low with a broad, flattish top, the summit left of centre and a lower shoulder
// stepping down to the right. Its right flank is lit by the low sun.
const PEAK = CX - 70;
const mountainTop = (x: number) => {
	const main = 54 * Math.exp(-((Math.abs(x - PEAK) / 150) ** 2.6));
	const shoulder = 14 * Math.exp(-((Math.abs(x - PEAK - 150) / 70) ** 2.6));
	return TOWN - main - shoulder + wave(x, 28, 0.8) * 0.4;
};
for (let x = 0; x < W; x += 1) {
	const top = mountainTop(x);
	if (top >= TOWN - 1) continue;
	g.column(x, top, TOWN, scene.mountain[1]);
	if (x > PEAK) g.column(x, top, top + 2, scene.mountain[2]);
	else g.column(x, top, top + 1, scene.mountain[0]);
}

// The ropeway: a cable from Motomachi up to the summit station.
export const SUMMIT = { x: PEAK + 4, y: Math.round(mountainTop(PEAK + 4)) - 3 };
export const BASE = { x: PEAK + 96, y: TOWN - 6 };
g.rect(SUMMIT.x - 5, SUMMIT.y, 10, 4, scene.ropeway);
const cableSteps = BASE.x - SUMMIT.x;
for (let step = 0; step <= cableSteps; step += 1) {
	g.set(SUMMIT.x + step, SUMMIT.y + Math.round(((BASE.y - SUMMIT.y) * step) / cableSteps), scene.ropeway);
}
g.rect(BASE.x - 2, BASE.y, 6, 6, scene.ropeway);

// Motomachi: rooftops at the foot of the mountain.
export const windows: { x: number; y: number; delay: string }[] = [];
for (let x = 0; x < W; ) {
	const width = 4 + Math.floor(rand() * 8);
	const height = 3 + Math.floor(rand() * 6);
	g.rect(x, TOWN - height, width, H - TOWN + height, scene.town[x % 2]);
	g.rect(x, TOWN - height, width, 1, scene.town[2]);
	for (let wx = x + 1; wx < x + width - 1; wx += 2) if (rand() < 0.3) windows.push({ x: wx, y: TOWN - height + 2, delay: (rand() * 6).toFixed(2) });
	x += width;
}

// The Kanemori warehouses: long brick halls with low gabled roofs and arched doors, the canal and its bridge between them.
const CANAL = { x: CX + 70, w: 24 };
export const doors: { x: number; y: number; delay: string }[] = [];
function warehouse(x: number, width: number) {
	const height = 20 + Math.floor(rand() * 4);
	const top = QUAY - height;
	for (let dx = 0; dx < width; dx += 1) {
		const gable = Math.round(6 * (1 - Math.abs(dx - (width - 1) / 2) / ((width - 1) / 2)));
		g.column(x + dx, top - gable, top + 1, scene.brickRoof);
		for (let y = top + 1; y < QUAY; y += 1) {
			// English bond: a course of headers (joints every 2 dots) above a course of stretchers (every 4).
			const course = (y - top) % 2;
			const joint = course === 0 ? (dx + 1) % 4 === 0 : dx % 2 === 0;
			g.set(x + dx, y, (y - top) % 4 === 0 ? scene.brick[2] : joint && course === 1 ? scene.brick[1] : scene.brick[0]);
		}
	}
	for (let dx = 4; dx < width - 6; dx += 10) {
		g.rect(x + dx + 1, top + 4, 3, 3, '#3a1a18');
		g.rect(x + dx, QUAY - 9, 5, 9, '#2a1416');
		g.rect(x + dx + 1, QUAY - 10, 3, 1, '#2a1416');
		doors.push({ x: x + dx, y: QUAY - 9, delay: (rand() * 4).toFixed(2) });
	}
}
for (let x = -12; x < W; ) {
	const width = 56 + Math.floor(rand() * 20);
	if (x < CANAL.x + CANAL.w && x + width > CANAL.x) {
		if (CANAL.x - x > 12) warehouse(x, CANAL.x - x);
		x = CANAL.x + CANAL.w;
		continue;
	}
	warehouse(x, width);
	x += width + 3;
}
for (let x = CANAL.x; x < CANAL.x + CANAL.w; x += 1) {
	const arch = Math.round(4 * Math.sqrt(Math.max(0, 1 - ((x - CANAL.x - CANAL.w / 2) / (CANAL.w / 2)) ** 2)));
	g.column(x, QUAY - 14, QUAY, scene.water[1]);
	g.column(x, QUAY - 16, QUAY - 12 - arch + 3, '#6a5a60');
	g.set(x, QUAY - 17, '#3e3238');
}

// The water in front: the warehouses mirrored as broken red streaks, then the colour the page continues in.
for (let x = 0; x < W; x += 1) {
	g.set(x, QUAY, scene.stone[0]);
	for (let y = QUAY + 1; y < H; y += 1) {
		const mirror = g.get(x, QUAY - (y - QUAY) * 2) ?? '';
		const red = (scene.brick as readonly string[]).includes(mirror);
		// Every other row, in long dashes, so the reflection reads as calm ripples rather than noise.
		const streak = (y - QUAY) % 2 === 1 && Math.floor((x + (y - QUAY) * 3) / 6) % 2 === 0;
		g.set(x, y, y < QUAY + 10 && red && streak ? '#8a4a5e' : y < QUAY + 10 + wave(x, 60, 1.2) * 0.5 ? scene.water[0] : scene.water[1]);
	}
}
