// @ts-check
// Inline right after the marquee, so it starts while the rest of the page is still streaming (module scripts wait for all of it).
// Fills the track edge to edge with copies of its first `.marquee__group`, starts with the first message centred, and scrolls it at a constant speed.
// Re-measures after web fonts load and on resize. Relies on the keyframes in Marquee.astro.
(() => {
	const PIXELS_PER_SECOND = 60;
	const track = document.querySelector('[data-marquee]');
	if (!(track instanceof HTMLElement)) return;
	const group = track.querySelector('.marquee__group');
	if (!(group instanceof HTMLElement)) return;
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const layout = () => {
		track.querySelectorAll('[data-marquee-copy]').forEach((copy) => copy.remove());
		const groupWidth = group.getBoundingClientRect().width;
		if (groupWidth === 0) return;

		// One extra copy so the gap left by sliding one group width is always covered.
		const copies = Math.ceil(window.innerWidth / groupWidth) + 1;
		for (let index = 0; index < copies; index += 1) {
			const copy = /** @type {HTMLElement} */ (group.cloneNode(true));
			copy.dataset.marqueeCopy = '';
			track.append(copy);
		}

		// Copies are identical, so shifting by (centre offset - one group) still shows the first message centred and stays inside the looped range.
		const firstMessage = group.firstElementChild;
		const firstMessageWidth = firstMessage
			? firstMessage.getBoundingClientRect().width - parseFloat(getComputedStyle(firstMessage).paddingRight)
			: 0;
		const centreOffset = (window.innerWidth - firstMessageWidth) / 2;
		const startShift = (centreOffset % groupWidth) - groupWidth;
		const duration = groupWidth / PIXELS_PER_SECOND;

		track.style.setProperty('--marquee-shift', `-${groupWidth}px`);
		track.style.setProperty('--marquee-duration', `${duration}s`);
		track.style.setProperty('--marquee-delay', `${(startShift / groupWidth) * duration}s`);
		track.style.setProperty('--marquee-start', `${startShift}px`);
		// Restart rather than edit the running animation, otherwise the new delay adds to the time already played.
		track.classList.remove('is-running');
		void track.offsetWidth;
		track.classList.toggle('is-running', !reduceMotion);
		track.classList.add('is-ready');
	};

	document.fonts.ready.then(layout);
	/** @type {number | undefined} */
	let resizeTimer;
	window.addEventListener('resize', () => {
		window.clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(layout, 200);
	});
})();
