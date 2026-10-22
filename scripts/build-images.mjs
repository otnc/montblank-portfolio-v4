// Draws the thumbnail (used as the OGP image), the link banner and the favicon in the site's style, with PixelMplus text taken from the bundled font files.
// Runs before every dev server and build, so the images always match the current profile and avatar.
// The artwork is provisional until the concept in docs/rules.md is settled; only the layout follows otnc-portfolio-v3 so far.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as fontkit from 'fontkit';
import sharp from 'sharp';

// The same avatar the site shows in the profile window.
const AVATAR = new URL('../public/avatar.png', import.meta.url);
const OUT = new URL('../public/', import.meta.url);

// The first-draft palette from docs/rules.md.
const C = {
	dusk: '#f0a57a',
	window: '#fff4e2',
	bar: '#c99a6b',
	barStripe: '#bd8d5f',
	button: '#e8cba3',
	frame: '#4a2c1d',
	cream: '#fff4e2',
	marron: '#c99a6b',
	maple: '#c8442f',
	ink: '#4a2c1d',
};

const fonts = {
	10: fontkit.create(await readFile(new URL('../fonts/pixelmplus/PixelMplus10-Regular.ttf', import.meta.url))),
	12: fontkit.create(await readFile(new URL('../fonts/pixelmplus/PixelMplus12-Regular.ttf', import.meta.url))),
};

/**
 * SVG for `text` set in PixelMplus at `scale` times its native grid (10 or 12 px), with the baseline at `y`.
 * Keep `x`, `y` and the size integral so every font pixel lands on whole device pixels.
 */
function text(content, { grid, scale, x, y, fill }) {
	const font = fonts[grid];
	const size = grid * scale;
	const unit = size / font.unitsPerEm;
	const run = font.layout(content);
	let cursor = x;
	let out = '';
	run.glyphs.forEach((glyph, index) => {
		const d = glyph.path.toSVG();
		if (d) out += `<path transform="translate(${cursor} ${y}) scale(${unit} ${-unit})" d="${d}" fill="${fill}"/>`;
		cursor += run.positions[index].xAdvance * unit;
	});
	return { svg: out, width: cursor - x };
}

/** Rectangles for a grid of colour keys, merging horizontal runs. `cell` is the drawn size of one grid square. */
function grid(rows, colors, { x, y, cell }) {
	let out = '';
	rows.forEach((row, ry) => {
		let rx = 0;
		while (rx < row.length) {
			const key = row[rx];
			let end = rx + 1;
			while (end < row.length && row[end] === key) end += 1;
			if (colors[key]) {
				out += `<rect x="${x + rx * cell}" y="${y + ry * cell}" width="${(end - rx) * cell}" height="${cell}" fill="${colors[key]}"/>`;
			}
			rx = end;
		}
	});
	return out;
}

/**
 * The avatar, dithered: line art goes dark brown and the rest is an ordered (Bayer 4x4) mix of marron and cream.
 * Dark strokes are thickened first so thin lines survive the reduction.
 */
async function ditheredAvatar(avatar, cells) {
	const big = cells * 2;
	const { data } = await sharp(avatar).resize(big, big, { fit: 'cover' }).greyscale().normalise().raw().toBuffer({ resolveWithObject: true });
	const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
	const rows = [];
	for (let y = 0; y < cells; y += 1) {
		let row = '';
		for (let x = 0; x < cells; x += 1) {
			// Minimum over each 2x2 block of the 2x image: shrinks without losing thin dark lines.
			let value = 255;
			for (let dy = 0; dy <= 1; dy += 1) {
				for (let dx = 0; dx <= 1; dx += 1) {
					value = Math.min(value, data[(y * 2 + dy) * big + x * 2 + dx]);
				}
			}
			const v = value / 255;
			if (v < 0.42) row += 'i';
			else row += ((v - 0.42) / 0.58) * 0.55 > (bayer[(y % 4) * 4 + (x % 4)] + 0.5) / 16 ? 'w' : 'c';
		}
		rows.push(row);
	}
	return rows;
}

/**
 * The avatar for the small link banner and the favicon.
 * Dithering turns into noise at this size, so the head is cropped and any cell that touches a line becomes a solid dark dot on plain cream.
 * Resizing first would average the thin strokes away, so each cell counts the dark pixels of its block in the full-size image instead.
 */
async function bannerAvatar(avatar, cells, { inkShare = 0.42, crop = { left: 0.04, top: 0.02, side: 0.8 } } = {}) {
	const { width } = await sharp(avatar).metadata();
	const side = Math.round(width * crop.side);
	const { data } = await sharp(avatar)
		.extract({ left: Math.round(width * crop.left), top: Math.round(width * crop.top), width: side, height: side })
		.greyscale()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const block = side / cells;
	return Array.from({ length: cells }, (_, y) =>
		Array.from({ length: cells }, (_, x) => {
			let dark = 0;
			let total = 0;
			for (let sy = Math.floor(y * block); sy < Math.floor((y + 1) * block); sy += 1) {
				for (let sx = Math.floor(x * block); sx < Math.floor((x + 1) * block); sx += 1) {
					total += 1;
					if (data[sy * side + sx] < 160) dark += 1;
				}
			}
			return dark / total > inkShare ? 'i' : 'c';
		}).join(''),
	);
}

/** An old-OS window: dark frame, striped title bar with icon, title and the three buttons, and a body slot. */
function windowFrame({ x, y, width, bodyHeight, title, dot, titleScale }) {
	const bar = 6 * dot;
	const border = dot;
	const height = bar + bodyHeight + border * 3;
	let out = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${C.frame}"/>`;
	out += `<rect x="${x + border}" y="${y + border}" width="${width - border * 2}" height="${bar}" fill="${C.bar}"/>`;
	for (let sy = y + border + dot; sy < y + border + bar; sy += dot * 2) {
		out += `<rect x="${x + border}" y="${sy}" width="${width - border * 2}" height="${dot / 2}" fill="${C.barStripe}"/>`;
	}
	out += `<rect x="${x + border * 3}" y="${y + border + 2 * dot}" width="${2 * dot}" height="${2 * dot}" fill="${C.maple}"/>`;
	out += text(title, { grid: 10, scale: titleScale, x: x + border * 3 + 4 * dot, y: y + border + bar - dot - Math.round(titleScale), fill: C.ink }).svg;
	for (let index = 0; index < 3; index += 1) {
		const bx = x + width - border * 3 - (3 - index) * 4 * dot;
		out += `<rect x="${bx}" y="${y + border + dot}" width="${3 * dot}" height="${4 * dot}" fill="${C.button}"/>`;
		out += `<rect x="${bx + dot}" y="${y + border + 3 * dot}" width="${dot}" height="${dot}" fill="${C.ink}"/>`;
	}
	out += `<rect x="${x + border}" y="${y + border * 2 + bar}" width="${width - border * 2}" height="${bodyHeight}" fill="${C.window}"/>`;
	return { svg: out, bodyX: x + border, bodyY: y + border * 2 + bar, height };
}

function svgDocument(width, height, body) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${body}</svg>`;
}

async function writePng(path, svg) {
	await mkdir(new URL('.', new URL(path, OUT)), { recursive: true });
	await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(new URL(path, OUT).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
	console.log(`wrote public/${path}`);
}

async function writeSvg(path, svg) {
	await writeFile(new URL(path, OUT), svg);
	console.log(`wrote public/${path}`);
}

const avatar = await readFile(AVATAR);

// ---- Thumbnail: 1200x630, 6px dots ----
{
	const dot = 6;
	const W = 1200;
	const H = 630;
	let body = `<rect width="${W}" height="${H}" fill="${C.dusk}"/>`;

	const avatarCells = 100;
	const cell = 3;
	const frame = windowFrame({ x: 90, y: 120, width: avatarCells * cell + dot * 2, bodyHeight: avatarCells * cell, title: 'marron.png', dot, titleScale: 3 });
	body += `<rect x="${90 + 12}" y="${120 + 12}" width="${avatarCells * cell + dot * 2}" height="${frame.height}" fill="#000" opacity="0.25"/>`;
	body += frame.svg;
	body += grid(await ditheredAvatar(avatar, avatarCells), { i: C.ink, c: C.marron, w: C.cream }, { x: frame.bodyX, y: frame.bodyY, cell });

	const left = 486;
	body += text('まろん｡', { grid: 12, scale: 8, x: left + 6, y: 256, fill: C.ink }).svg;
	body += text('まろん｡', { grid: 12, scale: 8, x: left, y: 250, fill: C.cream }).svg;
	body += text('便利とロマンをシェアしよう', { grid: 10, scale: 3, x: left, y: 340, fill: C.ink }).svg;
	body += text('思い立ったが吉日', { grid: 10, scale: 3, x: left, y: 390, fill: C.ink }).svg;
	body += text('montblank.fun', { grid: 10, scale: 4, x: left, y: 520, fill: C.maple }).svg;

	await writePng('thumbnail.png', svgDocument(W, H, body));
}

// ---- Link banner: 200x40 ----
{
	const width = 200;
	const height = 40;
	const avatarCells = 32;
	const pad = 4;
	let body = `<rect width="${width}" height="${height}" fill="${C.dusk}"/>`;
	body += `<rect x="${pad - 1}" y="${pad - 1}" width="${avatarCells + 2}" height="${avatarCells + 2}" fill="${C.frame}"/>`;
	body += grid(await bannerAvatar(avatar, avatarCells), { i: C.ink, c: C.cream }, { x: pad, y: pad, cell: 1 });
	const left = pad + avatarCells + 6;
	body += text('まろん｡', { grid: 12, scale: 2, x: left + 1, y: 21, fill: C.ink }).svg;
	body += text('まろん｡', { grid: 12, scale: 2, x: left, y: 20, fill: C.cream }).svg;
	body += text('montblank.fun', { grid: 10, scale: 1, x: left, y: 34, fill: C.ink }).svg;
	// One-pixel dark border, like the window frames.
	body += `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" fill="none" stroke="${C.frame}" stroke-width="1"/>`;
	await writePng('banners/normal.png', svgDocument(width, height, body));
}

// ---- Favicon: the banner avatar inside a round frame, transparent outside ----
{
	const size = 32;
	const inner = 26;
	// The whole head turns into specks at this size, so the favicon zooms in on the face.
	const face = await bannerAvatar(avatar, inner, { inkShare: 0.65, crop: { left: 0.22, top: 0.33, side: 0.42 } });
	const offset = (size - inner) / 2;
	const rows = Array.from({ length: size }, (_, y) =>
		Array.from({ length: size }, (_, x) => {
			const distance = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2);
			if (distance > size / 2 - 0.5) return '.';
			if (distance > size / 2 - 2.5) return 'm';
			return face[y - offset]?.[x - offset] ?? 'c';
		}).join(''),
	);
	const svg = svgDocument(size, size, grid(rows, { m: C.marron, i: C.ink, c: C.cream }, { x: 0, y: 0, cell: 1 }));
	await writeSvg('favicon.svg', svg);
	await writePng('favicon.png', svg);
}
