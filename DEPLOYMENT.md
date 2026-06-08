# Tavali Website — Deployment & CMS Guide

This is the production Astro site for Tavali, with a Markdown blog managed through
**Decap CMS**. This guide covers local development, deploying to Vercel,
custom domains, and day-to-day content editing.

- **Framework:** Astro 5 (static output)
- **Integrations:** `@astrojs/mdx`, `@astrojs/sitemap`
- **Hosting:** Vercel (see `vercel.json`)
- **CMS:** Decap CMS (local proxy in dev; GitHub OAuth in production)
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

## B. Vercel Deployment (recommended)

The repo includes `vercel.json` with the correct Astro build settings. Vercel
auto-detects the framework; no adapter is required for this static site.

### 1. Connect the repository
1. Push this project to a GitHub (or GitLab/Bitbucket) repo.
2. In Vercel: **Add New Project → Import** your repo.
3. Build settings (pre-filled from `vercel.json`):
   - **Framework Preset:** Astro
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install`
4. Under **Environment Variables**, optionally set `NODE_VERSION=22` if you want
   to pin the Node runtime (Vercel defaults are fine for Astro 5).
5. **Deploy.** You'll get a `https://<project>.vercel.app` URL.

Every push to `main` triggers a new production deploy automatically.

### 2. Preview deployments
Vercel creates a unique preview URL for each pull request. Use these to review
content or design changes before merging to `main`.

### 3. Production CMS auth (GitHub OAuth)
```yaml
backend:
  name: github
  repo: your-org/tavali-ai   # your GitHub repo
  branch: main
  base_url: https://your-oauth-proxy.example.com
  auth_endpoint: auth
```

Then run a small OAuth proxy (e.g. [decap-cms-github-backend](https://github.com/vencax/decap-cms-github-backend) or a Cloudflare Worker) and register a GitHub OAuth App with callback URL `https://your-oauth-proxy.example.com/callback`.

**Simpler alternative:** keep editing locally with `npm run cms` + `npm run dev`,
commit the Markdown changes, and let Vercel redeploy from Git — no OAuth setup
needed.

---

## C. Alternative Hosts

The site is plain static output (`dist/`) and deploys anywhere with the same
build command.

| Host | Build command | Output |
|---|---|---|
| Vercel | `npm run build` | `dist` |
| Cloudflare Pages | `npm run build` | `dist` |

On non-Vercel hosts, use the same GitHub OAuth or local-edit workflow for the
CMS (see section B.3).

---

## D. Custom Domain

### On Vercel
1. **Project → Settings → Domains → Add** e.g. `www.tavali.com` and `tavali.com`.
2. Point DNS at Vercel (the dashboard shows the exact records):
   - **Apex (`tavali.com`)**: `A` record → `76.76.21.21`
   - **`www`**: `CNAME` → `cname.vercel-dns.com`
3. Vercel provisions a free **Let's Encrypt HTTPS** certificate automatically.
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
3. **Publish.** Decap commits a new `src/content/blog/<slug>.md`; Vercel detects
   the push, rebuilds, and the post appears at `/blog/<slug>/`.

### Drafts vs published
- Toggle **Draft = true** to keep a post **out of the live site** (it's filtered
  out of `/blog`, the sitemap, and gets no page). Flip it to `false` to publish.
- *(Optional upgrade)* For a review/approval flow with a visual "in review"
  board, add `publish_mode: editorial_workflow` to `config.yml`; with a GitHub
  backend this opens a PR per post instead of committing straight to `main`.

### Upload & use images
- In the **Body** editor, click the image button (or drag-drop) — files save to
  `public/images/uploads/` and are referenced as `/images/uploads/<file>`.
- Set the **Hero Image** field the same way to control the social-share image.

### How the Git workflow works behind the scenes
```
Editor clicks Publish in /admin/
        │
        ▼
Decap CMS  ──(GitHub OAuth, as the logged-in user)──►  commit to `main`
        │
        ▼
Vercel detects the push  ──►  npm run build  ──►  deploy `dist/`
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
