import type { APIRoute } from 'astro';
import { notifySubscribersOfPost } from '../../lib/newsletter';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.NOTIFY_SECRET;
  const auth = request.headers.get('authorization');

  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const title = String(body.title ?? '').trim();
    const description = String(body.description ?? '').trim();
    const url = String(body.url ?? '').trim();

    if (!title || !url) {
      return new Response(JSON.stringify({ error: 'title and url are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await notifySubscribersOfPost({ title, description, url });

    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[notify-new-post]', err);
    return new Response(JSON.stringify({ error: 'Notification failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
