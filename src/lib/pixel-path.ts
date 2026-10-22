/**
 * Turns a pixel grid into one SVG path per colour, merging horizontal runs.
 * This keeps pixel art to a handful of <path> elements instead of one <rect> per pixel.
 * @example
 * pixelPaths(['0110', '1111'], ['#000']);
 * // => [{ fill: '#000', d: 'M1 0h2v1h-2zM0 1h4v1h-4z' }]
 */
export function pixelPaths(rows: string[], colors: string[]) {
	const paths = new Map<string, string>();
	rows.forEach((row, y) => {
		let x = 0;
		while (x < row.length) {
			const cell = row[x];
			let end = x + 1;
			while (end < row.length && row[end] === cell) end += 1;
			if (cell !== '0') {
				const fill = colors[Number(cell) - 1];
				paths.set(fill, `${paths.get(fill) ?? ''}M${x} ${y}h${end - x}v1h-${end - x}z`);
			}
			x = end;
		}
	});
	return [...paths].map(([fill, d]) => ({ fill, d }));
}
