// @ts-check
// Inline right after the tagline so it starts typing while the rest of the page is still streaming.
// Re-types the text one character at a time; the full text stays in the HTML for no-JS readers.
(() => {
	const element = document.querySelector('[data-typewriter]');
	if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const text = element.textContent ?? '';
	element.textContent = '';
	let index = 0;
	const timer = window.setInterval(() => {
		index += 1;
		element.textContent = text.slice(0, index);
		if (index >= text.length) window.clearInterval(timer);
	}, 120);
})();
