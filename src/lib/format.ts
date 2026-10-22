/** 9562 -> "9,562". */
export const formatCount = (value: number) => value.toLocaleString('en-US');

/**
 * Shortens large counts the way GitHub (and portfolio-v3) does: "1.2k", "3.4M".
 * Below 1,000 the number is kept; above, one decimal is kept (rounded down) and a trailing ".0" is dropped.
 * @example
 * formatCompact(76712); // => "76.7k"
 */
export function formatCompact(value: number) {
	if (value < 1000) return formatCount(value);
	const units: [number, string][] = [
		[1_000_000_000, 'b'],
		[1_000_000, 'M'],
		[1_000, 'k'],
	];
	const [divisor, suffix] = units.find(([unit]) => value >= unit) ?? [1, ''];
	const rounded = Math.floor((value / divisor) * 10) / 10;
	return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}${suffix}`;
}

const dateFormat = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'long', day: 'numeric' });

/** "2026-09-25T00:00:00.000Z" -> "2026年9月25日" in Japan time, as portfolio-v3 showed post dates. */
export function formatDate(iso: string) {
	if (!iso) return '';
	return dateFormat.format(new Date(iso));
}
