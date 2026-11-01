// Writes every entry of src/data/pixel-files.ts to dist/pixel/ at build time; public/_routes.json serves /pixel/* without the Worker.
import type { APIRoute, GetStaticPaths } from 'astro';
import { pixelFiles } from '@/data/pixel-files';

export const prerender = true;

export const getStaticPaths = (() => Object.keys(pixelFiles).map((name) => ({ params: { name } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
	new Response(pixelFiles[params.name as string](), { headers: { 'Content-Type': 'image/svg+xml' } });
