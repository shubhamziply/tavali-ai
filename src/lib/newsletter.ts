/**
 * Newsletter helpers — subscribe contacts via Resend and send blog notifications.
 * Set RESEND_API_KEY, RESEND_AUDIENCE_ID, and RESEND_FROM_EMAIL in Vercel env vars.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const RESEND_API = 'https://api.resend.com';

function resendHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function saveSubscriberLocally(email: string) {
  const dir = path.join(process.cwd(), 'data');
  const file = path.join(dir, 'subscribers.json');
  await mkdir(dir, { recursive: true });

  let existing: string[] = [];
  try {
    existing = JSON.parse(await readFile(file, 'utf8'));
  } catch {
    existing = [];
  }

  if (!existing.includes(email)) {
    existing.push(email);
    await writeFile(file, JSON.stringify(existing, null, 2));
  }
}

export async function subscribeEmail(email: string) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const audienceId = import.meta.env.RESEND_AUDIENCE_ID;
  const fromEmail =
    import.meta.env.RESEND_FROM_EMAIL || 'Tavali Blog <blog@tavali.com>';

  if (!apiKey || !audienceId) {
    if (import.meta.env.DEV) {
      await saveSubscriberLocally(email);
      return { mode: 'local' as const };
    }
    throw new Error('Newsletter service is not configured');
  }

  const contactRes = await fetch(`${RESEND_API}/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: resendHeaders(apiKey),
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  if (!contactRes.ok && contactRes.status !== 409) {
    const err = await contactRes.text();
    throw new Error(`Failed to save subscriber: ${err}`);
  }

  const welcomeRes = await fetch(`${RESEND_API}/emails`, {
    method: 'POST',
    headers: resendHeaders(apiKey),
    body: JSON.stringify({
      from: fromEmail,
      to: email,
      subject: "You're subscribed to the Tavali blog",
      html: `
        <p>Thanks for subscribing to the Tavali blog.</p>
        <p>You'll receive practical insight on AI in dentistry, revenue, and practice operations whenever we publish a new article.</p>
        <p><a href="https://www.tavali.com/blog/">Browse the latest posts</a></p>
      `,
    }),
  });

  if (!welcomeRes.ok) {
    const err = await welcomeRes.text();
    throw new Error(`Failed to send welcome email: ${err}`);
  }

  return { mode: 'resend' as const };
}

export interface BlogPostNotice {
  title: string;
  description: string;
  url: string;
}

export async function notifySubscribersOfPost(post: BlogPostNotice) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const audienceId = import.meta.env.RESEND_AUDIENCE_ID;
  const fromEmail =
    import.meta.env.RESEND_FROM_EMAIL || 'Tavali Blog <blog@tavali.com>';

  if (!apiKey || !audienceId) {
    if (import.meta.env.DEV) {
      console.info('[newsletter] New post notification (dev):', post);
      return { mode: 'local' as const, sent: 0 };
    }
    throw new Error('Newsletter service is not configured');
  }

  const contactsRes = await fetch(
    `${RESEND_API}/audiences/${audienceId}/contacts`,
    { headers: resendHeaders(apiKey) },
  );

  if (!contactsRes.ok) {
    throw new Error('Failed to load subscribers');
  }

  const { data: contacts } = (await contactsRes.json()) as {
    data: { email: string; unsubscribed: boolean }[];
  };

  const recipients = contacts
    .filter((c) => !c.unsubscribed)
    .map((c) => c.email);

  if (!recipients.length) {
    return { mode: 'resend' as const, sent: 0 };
  }

  const batchRes = await fetch(`${RESEND_API}/emails/batch`, {
    method: 'POST',
    headers: resendHeaders(apiKey),
    body: JSON.stringify(
      recipients.map((to) => ({
        from: fromEmail,
        to,
        subject: `New on the Tavali blog: ${post.title}`,
        html: `
          <p>We just published a new article on the Tavali blog:</p>
          <h2>${post.title}</h2>
          <p>${post.description}</p>
          <p><a href="${post.url}">Read the full article</a></p>
        `,
      })),
    ),
  });

  if (!batchRes.ok) {
    const err = await batchRes.text();
    throw new Error(`Failed to send blog notification: ${err}`);
  }

  return { mode: 'resend' as const, sent: recipients.length };
}
