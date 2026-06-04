# Tavali Website — Deployment & CMS Guide

This is the production Astro site for Tavali, with a Markdown blog managed through
**Decap CMS**. This guide covers local development, deploying to Netlify
(recommended), alternative hosts, custom domains, and day-to-day content editing.

- **Framework:** Astro 5 (static output)
- **Integrations:** `@astrojs/mdx`, `@astrojs/sitemap`
- **CMS:** Decap CMS (Git Gateway + Netlify Identity in production)
- **Content:** Markdown in `src/content/blog/` (Content Collection, Zod-validated)

---

## A. Local Development

### Prerequisites
- **Node.js ≥ 18.20** (built and tested on Node 22).
- **npm** (ships with Node). pnpm/yarn also work.

### Install & run
```bash
npm install
npm run dev
```
The site runs at **http://localhost:4321**.

Useful scripts:
| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (hot reload). |
| `npm run build` | Production build to `dist/`. Run before deploying. |
| `npm run preview` | Serve the built `dist/` locally. |
| `npm run cms` | Start the local Decap CMS proxy (`decap-server`). |

### Editing blog posts locally (no login required)
Decap can talk to your local Git working copy via a small proxy. Run **two
terminals**:

**Terminal 1 — the CMS proxy** (config has `local_backend: true`):
```bash
npm run cms        # = npx decap-server, listens on :8081
```

**Terminal 2 — the site:**
```bash
npm run dev
```

Then open **http://localhost:4321/admin/**. Because `local_backend` is enabled,
the CMS reads/writes the Markdown files in `src/content/blog/` directly — no
authentication needed. Create or edit a post, hit **Publish**, and the `.md`
file appears/updates in `src/content/blog/`. The dev server hot-reloads it.

> Images you upload locally land in `public/images/uploads/`.

---

## B. Netlify Deployment (recommended for Decap CMS)

Netlify is the smoothest path because Decap's default auth (Git Gateway +
Identity) is a Netlify feature.

### 1. Connect the repository
1. Push this project to a GitHub (or GitLab) repo.
2. In Netlify: **Add new site → Import an existing project →** pick the repo.
3. Build settings (Netlify usually auto-detects Astro):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** set env var `NODE_VERSION=22` (Site settings → Environment).
4. **Deploy site.** You'll get a `https://<random-name>.netlify.app` URL.

### 2. Enable Netlify Identity (CMS login)
1. **Site settings → Identity → Enable Identity.**
2. **Registration → Registration preferences → Invite only**
   (so random visitors can't sign up to edit content).
3. *(Optional)* **External providers** → add Google/GitHub login.

### 3. Enable Git Gateway (lets the CMS commit to your repo)
1. **Site settings → Identity → Services → Git Gateway → Enable Git Gateway.**
   This authorizes the CMS to push commits on an editor's behalf.

### 4. Invite yourself as a CMS user
1. **Identity tab → Invite users →** enter your email.
2. Accept the email invite, set a password.

### 5. Log in and edit
- Go to **`https://<your-site>.netlify.app/admin/`**.
- Log in with your Identity credentials.
- Create/edit posts. **Publishing commits to `main`**, which **auto-triggers a
  Netlify rebuild** — your post is live in ~1 minute.

> The `public/admin/index.html` already includes the Netlify Identity widget and
> the post-login redirect, so steps 2–5 work with no code changes.

---

## C. Alternative Hosts: Cloudflare Pages / Vercel

The site itself is plain static output and deploys anywhere.

**Build settings (both):**
- Build command: `npm run build`
- Output directory: `dist`
- `NODE_VERSION=22`

**⚠️ CMS caveat:** Netlify Identity & Git Gateway are **Netlify-only**. On
Cloudflare/Vercel the `/admin/` UI will load but **won't authenticate**. Options:

1. **GitHub OAuth backend** — register an OAuth app and run a small OAuth proxy
   (e.g. Cloudflare Worker), then switch `public/admin/config.yml`:
   ```yaml
   backend:
     name: github
     repo: your-org/your-repo
     branch: main
     base_url: https://your-oauth-proxy.example.com
   ```
2. **Sveltia CMS** — a drop-in Decap-compatible CMS with built-in GitHub/GitLab
   auth (no proxy). Replace the Decap script in `public/admin/index.html` with
   the Sveltia bundle; `config.yml` is reused as-is.
3. **Keep CMS on Netlify, host pages elsewhere** — point the CMS at the same
   Git repo; deploys can run on any host watching that branch.

---

## D. Custom Domain

### On Netlify
1. **Domain settings → Add a custom domain →** e.g. `www.tavali.com`.
2. Point DNS at Netlify:
   - **Apex (`tavali.com`)**: `A` record → Netlify load balancer `75.2.60.5`,
     or use Netlify DNS / an `ALIAS`/`ANAME` to `<site>.netlify.app`.
   - **`www`**: `CNAME` → `<your-site>.netlify.app`.
3. Set the primary domain and let Netlify provision the free **Let's Encrypt
   HTTPS** certificate.
4. Update **`site`** in `astro.config.mjs` to the final URL (drives the sitemap
   and canonical/OG absolute URLs), then redeploy.

> Also update `site_url` / `display_url` in `public/admin/config.yml` if the
> domain changes.

---

## E. Post-launch CMS Usage Guide

### Create a new blog post
1. Open `/admin/` → **Blog Posts → New Blog Post**.
2. Fill the fields (these map 1:1 to the post's front-matter / Zod schema):
   - **Title**, **Subtitle** (optional), **Description / Standfirst**
   - **Publish Date** (and optional **Last Updated**)
   - **Author** (defaults to "Tavali Team")
   - **Hero Image** (optional — used for the social/OG image)
   - **Category** (pick from the fixed list — must match the blog filters)
   - **Tags**, **Read Time** (e.g. "6 min read")
   - **Featured** — show as the big featured card on `/blog`
   - **Draft** — see below
   - **Body** — the article, in the rich Markdown editor
3. **Publish.** Decap commits a new `src/content/blog/<slug>.md`; the host
   rebuilds and the post appears at `/blog/<slug>/`.

### Drafts vs published
- Toggle **Draft = true** to keep a post **out of the live site** (it's filtered
  out of `/blog`, the sitemap, and gets no page). Flip it to `false` to publish.
- *(Optional upgrade)* For a review/approval flow with a visual "in review"
  board, add `publish_mode: editorial_workflow` to `config.yml`; with Git
  Gateway this opens a PR per post instead of committing straight to `main`.

### Upload & use images
- In the **Body** editor, click the image button (or drag-drop) — files save to
  `public/images/uploads/` and are referenced as `/images/uploads/<file>`.
- Set the **Hero Image** field the same way to control the social-share image.

### How the Git workflow works behind the scenes
```
Editor clicks Publish in /admin/
        │
        ▼
Decap CMS  ──(Git Gateway, as the Identity user)──►  commit to `main`
        │
        ▼
Host (Netlify) detects the push  ──►  npm run build  ──►  deploy `dist/`
        │
        ▼
New/updated post is live at /blog/<slug>/   (~1 minute)
```
No FTP, no manual deploys — **content changes are just Git commits**, fully
versioned and revertible.

---

## Keeping the schema and CMS in sync
If you add a field, change it in **both** places:
1. `src/content.config.ts` — the Zod schema (validation + types).
2. `public/admin/config.yml` — the matching CMS widget.

A required Zod field with no CMS widget will break the build when a new post
omits it; a CMS widget with no schema entry is silently ignored.
