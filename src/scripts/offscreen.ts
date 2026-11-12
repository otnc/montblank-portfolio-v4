/** Toggles `is-paused` while each matched element is off screen; night.css pauses every animation inside it. */
export function pauseWhileOffscreen(selector: string) {
	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) entry.target.classList.toggle('is-paused', !entry.isIntersecting);
	});
	document.querySelectorAll(selector).forEach((element) => observer.observe(element));
}
