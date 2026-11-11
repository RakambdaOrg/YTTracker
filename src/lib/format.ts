/** Formats a duration like the old extension did: "1D 2H 3M 4S". */
export function formatDuration(ms: number, showMs = false): string {
	const total = Math.max(0, Math.round(ms));
	const parts: [number, string][] = [
		[Math.floor(total / 86_400_000), 'D'],
		[Math.floor(total / 3_600_000) % 24, 'H'],
		[Math.floor(total / 60_000) % 60, 'M'],
		[Math.floor(total / 1000) % 60, 'S'],
	];
	const text = parts.filter(([value]) => value > 0).map(([value, unit]) => `${value}${unit}`);
	if (showMs) {
		text.push(`${total % 1000}MS`);
	}
	return text.length > 0 ? text.join(' ') : '0S';
}

export function formatDate(time: number | undefined | null): string {
	if (!time) {
		return '';
	}
	const d = new Date(time);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
