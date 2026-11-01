/**
 * Pixel fireworks over the page on 2 November (Japan time), the owner's birthday.
 *
 * The motion is modelled on the fireworks-js library (shells rise, then burst into
 * sparks that gravity pulls down), reimplemented here with no dependency so the
 * page stays light. Two choices keep it cheap without thinning the show:
 *
 * - The canvas backing store is one third of the viewport in each axis, stretched
 *   to full size with `image-rendering: pixelated`. Every spark is then exactly one
 *   3px dot on the site grid, and the browser composites a ninth of the pixels.
 * - Sparks live in preallocated typed arrays that are reused every burst, so a
 *   frame allocates nothing, and physics runs on a fixed 30 steps-per-second
 *   clock, which also matches the site's choppy `steps()` motion.
 *
 * Add `?fireworks=1` to the URL to preview the show on any other day.
 */

/** Month (1-12) and day of the birthday, in Japan time. */
const BIRTHDAY_MONTH = 11;
const BIRTHDAY_DAY = 2;

/** Spark colours from the dusk palette, each with the dimmer shade it fades to. */
const PALETTE: ReadonlyArray<readonly [string, string]> = [
	['#fff4e2', '#c99a6b'],
	['#e8b23a', '#a87c22'],
	['#c8442f', '#8f2f1f'],
	['#f0a57a', '#b06a42'],
	['#e8cba3', '#b08c5a'],
];

/** One spark is one dot: the canvas backing store is the viewport divided by this. */
const DOT_SCALE = 3;
/** Fixed physics clock; also the frame budget. */
const STEP_MS = 1000 / 30;
/** Hard caps, sized so the pools below are never outgrown mid-show. */
const MAX_SPARKS = 960;
const MAX_SHELLS = 3;

const GRAVITY = 0.02;
const DRAG = 0.985;

/** True while `now` falls on the birthday in Japan time (UTC+9, no daylight saving). */
export function isBirthdayInJapan(now: Date = new Date()): boolean {
	const japan = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60_000);
	return japan.getMonth() + 1 === BIRTHDAY_MONTH && japan.getDate() === BIRTHDAY_DAY;
}

interface Shell {
	x: number;
	y: number;
	vy: number;
	targetY: number;
	color: number;
}

/** Starts the show. Does nothing outside the birthday (unless previewed) or for reduced-motion readers. */
export function setupBirthdayFireworks() {
	const preview = new URLSearchParams(window.location.search).has('fireworks');
	if (!preview && !isBirthdayInJapan()) return;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const canvas = document.createElement('canvas');
	canvas.setAttribute('aria-hidden', 'true');
	canvas.style.cssText =
		'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated;z-index:90';
	const context = canvas.getContext('2d');
	if (!context) return;
	document.body.appendChild(canvas);

	let width = 0;
	let height = 0;
	const resize = () => {
		width = Math.max(1, Math.ceil(window.innerWidth / DOT_SCALE));
		height = Math.max(1, Math.ceil(window.innerHeight / DOT_SCALE));
		canvas.width = width;
		canvas.height = height;
	};
	resize();
	let resizeTimer = 0;
	window.addEventListener('resize', () => {
		window.clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(resize, 150);
	});

	// Spark pool: parallel typed arrays, swapped-down on death so the live range is always [0, sparkCount).
	const px = new Float32Array(MAX_SPARKS);
	const py = new Float32Array(MAX_SPARKS);
	const vx = new Float32Array(MAX_SPARKS);
	const vy = new Float32Array(MAX_SPARKS);
	const life = new Float32Array(MAX_SPARKS);
	const maxLife = new Float32Array(MAX_SPARKS);
	const shade = new Uint8Array(MAX_SPARKS);
	let sparkCount = 0;

	const shells: Shell[] = [];
	let nextLaunchAt = performance.now() + 400;
	let launchStreak = 0;
	let raf = 0;
	let lastTime = performance.now();
	let accumulator = 0;
	let running = true;

	function spawnSpark(x: number, y: number, sx: number, sy: number, ttl: number, color: number) {
		if (sparkCount >= MAX_SPARKS) return;
		const i = sparkCount++;
		px[i] = x;
		py[i] = y;
		vx[i] = sx;
		vy[i] = sy;
		life[i] = ttl;
		maxLife[i] = ttl;
		shade[i] = color;
	}

	function burst(shell: Shell) {
		const count = 64 + Math.floor(Math.random() * 40);
		for (let n = 0; n < count; n++) {
			// Even disc coverage: golden-angle spiral with jittered radius, so bursts stay
			// full and round without clustering on the axes the way pure random angles do.
			const angle = n * 2.39996 + Math.random() * 0.35;
			const speed = (0.35 + 0.65 * Math.sqrt((n + 0.5) / count)) * (1.5 + Math.random() * 0.9);
			spawnSpark(
				shell.x,
				shell.y,
				Math.cos(angle) * speed,
				Math.sin(angle) * speed,
				46 + Math.random() * 54,
				shell.color,
			);
		}
	}

	function launch(now: number) {
		const color = Math.floor(Math.random() * PALETTE.length);
		shells.push({
			x: width * (0.12 + Math.random() * 0.76),
			y: height + 2,
			vy: -(3.4 + Math.random() * 1.1),
			targetY: height * (0.12 + Math.random() * 0.3),
			color,
		});
		launchStreak += 1;
		// Every few launches, fire a pair together so the sky varies without more shells overall.
		const salvo = launchStreak % 4 === 0 && shells.length < MAX_SHELLS;
		nextLaunchAt = now + (salvo ? 120 : 800 + Math.random() * 1100);
	}

	function step(now: number) {
		if ((preview || isBirthdayInJapan()) && now >= nextLaunchAt && shells.length < MAX_SHELLS) launch(now);

		for (let s = shells.length - 1; s >= 0; s--) {
			const shell = shells[s];
			shell.y += shell.vy;
			shell.vy += GRAVITY * 1.6;
			// Rise trail: short-lived dim sparks dropped under the shell.
			if (Math.random() < 0.7) {
				spawnSpark(shell.x, shell.y + 1, (Math.random() - 0.5) * 0.2, 0.35, 12 + Math.random() * 10, shell.color);
			}
			if (shell.vy >= -0.4 || shell.y <= shell.targetY) {
				burst(shell);
				shells.splice(s, 1);
			}
		}

		for (let i = sparkCount - 1; i >= 0; i--) {
			life[i] -= 1;
			if (life[i] <= 0) {
				sparkCount -= 1;
				px[i] = px[sparkCount];
				py[i] = py[sparkCount];
				vx[i] = vx[sparkCount];
				vy[i] = vy[sparkCount];
				life[i] = life[sparkCount];
				maxLife[i] = maxLife[sparkCount];
				shade[i] = shade[sparkCount];
				continue;
			}
			vx[i] *= DRAG;
			vy[i] = vy[i] * DRAG + GRAVITY;
			px[i] += vx[i];
			py[i] += vy[i];
		}
	}

	function draw() {
		// Fade the previous frame toward transparent; at this resolution one fill
		// leaves the short pixel trails fireworks need and costs almost nothing.
		context!.globalCompositeOperation = 'destination-out';
		context!.fillStyle = 'rgba(0, 0, 0, 0.16)';
		context!.fillRect(0, 0, width, height);
		context!.globalCompositeOperation = 'source-over';

		for (let s = 0; s < shells.length; s++) {
			context!.fillStyle = PALETTE[shells[s].color][0];
			context!.fillRect(Math.round(shells[s].x), Math.round(shells[s].y), 1, 1);
		}
		// One fillStyle per colour per frame: sparks are drawn bucket by bucket.
		for (let c = 0; c < PALETTE.length; c++) {
			const [bright, dim] = PALETTE[c];
			let current = '';
			for (let i = 0; i < sparkCount; i++) {
				if (shade[i] !== c) continue;
				const ratio = life[i] / maxLife[i];
				// Dying sparks flicker out on alternate steps instead of fading smoothly.
				if (ratio < 0.22 && life[i] % 2 === 0) continue;
				const style = ratio > 0.55 ? bright : dim;
				if (style !== current) {
					context!.fillStyle = style;
					current = style;
				}
				context!.fillRect(Math.round(px[i]), Math.round(py[i]), 1, 1);
			}
		}
	}

	function frame(now: number) {
		if (!running) return;
		accumulator += Math.min(now - lastTime, 250);
		lastTime = now;
		let stepped = false;
		while (accumulator >= STEP_MS) {
			step(now);
			accumulator -= STEP_MS;
			stepped = true;
		}
		if (stepped) draw();
		// The day is over and the last sparks are gone: take the canvas away.
		if (!preview && !isBirthdayInJapan() && shells.length === 0 && sparkCount === 0) {
			stop();
			canvas.remove();
			return;
		}
		raf = requestAnimationFrame(frame);
	}

	function stop() {
		running = false;
		cancelAnimationFrame(raf);
	}

	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			stop();
		} else if (!running && (preview || isBirthdayInJapan())) {
			running = true;
			lastTime = performance.now();
			accumulator = 0;
			raf = requestAnimationFrame(frame);
		}
	});

	raf = requestAnimationFrame(frame);
}
