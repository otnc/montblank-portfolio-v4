/** Re-types the element's text one character at a time. The full text stays in the HTML for no-JS readers. */
export function typewrite(element: HTMLElement, intervalMs = 120) {
	const text = element.textContent ?? '';
	element.textContent = '';
	let index = 0;
	const timer = window.setInterval(() => {
		index += 1;
		element.textContent = text.slice(0, index);
		if (index >= text.length) window.clearInterval(timer);
	}, intervalMs);
}
