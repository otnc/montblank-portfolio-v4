// @ts-check
// Inline classic script at the top of <body>: module scripts wait for the whole streamed page (every data fetch),
// so the windows that arrive first would stay hidden. This watches elements as the parser adds them instead.
(() => {
	const selector = '[data-reveal], [data-light]';
	const reveal = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add('is-visible');
				reveal.unobserve(entry.target);
			}
		},
		{ rootMargin: '0px 0px -10% 0px' },
	);
	const watch = (/** @type {Node} */ node) => {
		if (node instanceof Element && node.matches(selector)) reveal.observe(node);
	};
	const parsing = new MutationObserver((records) => {
		for (const record of records) record.addedNodes.forEach(watch);
	});
	document.querySelectorAll(selector).forEach(watch);
	parsing.observe(document.body, { childList: true, subtree: true });
	document.addEventListener('DOMContentLoaded', () => parsing.disconnect(), { once: true });
})();
