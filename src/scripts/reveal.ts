/** Adds `is-visible` to every `[data-reveal]` element the first time it scrolls into view. */
export function setupReveal() {
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			}
		},
		{ rootMargin: '0px 0px -10% 0px' },
	);
	document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
}

/** Toggles `is-paused` while each matched element is off screen; night.css pauses every animation inside it. */
export function pauseWhileOffscreen(selector: string) {
	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) entry.target.classList.toggle('is-paused', !entry.isIntersecting);
	});
	document.querySelectorAll(selector).forEach((element) => observer.observe(element));
}
