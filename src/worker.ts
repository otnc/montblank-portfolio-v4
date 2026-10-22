// Redirects alternate hostnames before Astro runs, so prerendered pages are covered too (Astro middleware only sees on-demand routes).
// Which paths reach this Worker is set in public/_routes.json.
import handler from 'astro-adapter-cloudflare-pages/handler';

type FetchArgs = Parameters<typeof handler.fetch>;

const CANONICAL_HOST = 'montblank.fun';
const REDIRECTED_HOSTS = new Set(['www.montblank.fun']);

export default {
	async fetch(request: Request, env: FetchArgs[1], context: FetchArgs[2]) {
		const url = new URL(request.url);
		if (REDIRECTED_HOSTS.has(url.hostname)) {
			return Response.redirect(`https://${CANONICAL_HOST}${url.pathname}${url.search}`, 301);
		}
		return handler.fetch(request, env, context);
	},
};
