# Tavali Website

The Tavali marketing site + blog, built with [Astro](https://astro.build) and
managed with [Decap CMS](https://decapcms.org).

## Quick start
```bash
npm install
npm run dev            # http://localhost:4321
# in a second terminal, to use the CMS locally:
npm run cms            # http://localhost:4321/admin/
```

## Project layout
```
src/
  components/   Reusable UI (Header, Footer, nav, blog cards, …)
  layouts/      BaseLayout (site shell) + BlogLayout (article template)
  pages/        File-based routes; blog/[slug].astro is the dynamic post route
  content/      blog/*.md posts + content.config.ts (collection + Zod schema)
  scripts/      app.js (shared interactions) + per-page scripts
  styles/       Global + page CSS (migrated verbatim from the original site)
  lib/          rehype-article-enhance.mjs (Markdown → article markup)
public/
  admin/        Decap CMS (index.html + config.yml)
  assets/       Logo lockups
  images/       Blog media uploads (Decap media_folder)
```

## Editing content
See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full local-CMS, Vercel,
custom-domain, and editor workflow guides.

## Notes
- Nav/footer links were normalized from the legacy `*.html` filenames to Astro
  routes (`/`, `/platform`, `/blog`, …). Styling is unchanged from the original.
- Update `site` in `astro.config.mjs` when the production domain is finalized.
