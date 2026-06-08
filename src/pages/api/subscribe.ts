import type { APIRoute } from 'astro';
import { subscribeEmail } from '../../lib/newsletter';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await subscribeEmail(email);

    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[subscribe]', err);
    return new Response(
      JSON.stringify({ error: 'Subscription failed. Please try again later.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
