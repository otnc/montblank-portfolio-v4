const PIXELS_PER_SECOND = 60;

/**
 * Fills a marquee track edge to edge with copies of its first `.marquee__group`, starts with the first message centred, and scrolls it at a constant speed.
 * Re-measures after web fonts load and on resize. Relies on the keyframes in Marquee.astro.
 */
export function setupMarquee(track: HTMLElement, reduceMotion: boolean) {
	const group = track.querySelector<HTMLElement>('.marquee__group');
	if (!group) return;

	const layout = () => {
		track.querySelectorAll('[data-marquee-copy]').forEach((copy) => copy.remove());
		const groupWidth = group.getBoundingClientRect().width;
		if (groupWidth === 0) return;

		// One extra copy so the gap left by sliding one group width is always covered.
		const copies = Math.ceil(window.innerWidth / groupWidth) + 1;
		for (let index = 0; index < copies; index += 1) {
			const copy = group.cloneNode(true) as HTMLElement;
			copy.dataset.marqueeCopy = '';
			track.append(copy);
		}

		// Copies are identical, so shifting by (centre offset - one group) still shows the first message centred and stays inside the looped range.
		const firstMessage = group.firstElementChild as HTMLElement | null;
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
	let resizeTimer: number | undefined;
	window.addEventListener('resize', () => {
		window.clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(layout, 200);
	});
}
