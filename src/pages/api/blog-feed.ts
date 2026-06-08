import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getBlogFingerprint } from '../../lib/blog-feed';

export const prerender = false;

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const featured = posts.find((p) => p.data.featured) ?? posts[0];

  return new Response(
    JSON.stringify({
      count: posts.length,
      fingerprint: getBlogFingerprint(posts),
      featuredId: featured?.id ?? null,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
};
