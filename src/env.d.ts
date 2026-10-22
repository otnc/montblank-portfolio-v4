/// <reference types="astro/client" />

/** Bindings and secrets configured on the Cloudflare Pages project. */
interface Env {
	/** Required. A read-only fine-grained token; the GitHub GraphQL API rejects anonymous calls. */
	GITHUB_TOKEN?: string;
}

type Runtime = import('astro-adapter-cloudflare-pages').Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}
