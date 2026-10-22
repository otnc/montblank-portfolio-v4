// Colours of the pixel-art scenery. The water colours must match the bands in src/layouts/DuskLayout.astro
// so the hero, the page and the footer join without seams; scripts/build-images.mjs keeps its own copy.
export const scene = {
	sun: '#fff1c4',
	sunRim: '#ffd88a',
	mountain: ['#5d3556', '#4a2b4c', '#ee9a5e'],
	ropeway: '#2a1a2a',
	town: ['#4a2f40', '#3b2738', '#5a3448'],
	light: '#ffd27a',
	// Motomachi landmarks at the foot of the mountain.
	church: { wall: '#e8dcc8', dome: '#5a8a7a', roof: '#4a3040' },
	brick: ['#b4503a', '#9a3a2a', '#7a2c20'],
	brickRoof: '#3a2a30',
	water: ['#9a6a8e', '#7d5c88', '#6c5888', '#56497a', '#423a68', '#2e2a50'],
	glint: '#ffe2a0',
	stone: ['#6a5a60', '#5a4a50', '#3e3238'],
	tram: { upper: '#e6e2c4', lower: '#4f8a5a', band: '#3a6a46', ink: '#2b1d1d', glass: '#ffd27a' },
} as const;
