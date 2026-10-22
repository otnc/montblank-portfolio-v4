/** 9562 -> "9,562". */
export const formatCount = (value: number) => value.toLocaleString('en-US');

/** 76712 -> "76.7k"; small numbers are left as they are. */
export function formatCompact(value: number) {
	if (value < 1000) return String(value);
	return `${(value / 1000).toFixed(value < 100_000 ? 1 : 0).replace(/\.0$/, '')}k`;
}

/** "2026-09-25T00:00:00.000Z" -> "2026/09/25" in Japan time. */
export function formatDate(iso: string) {
	if (!iso) return '';
	return new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
		new Date(iso),
	);
}
