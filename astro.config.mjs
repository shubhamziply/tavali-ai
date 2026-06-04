// @ts-check
// astro.config.mjs — Astro project configuration for the Tavali website.
// Registers MDX (rich blog content) and Sitemap (SEO) integrations and sets
// the canonical production site URL used for sitemap + absolute URLs.
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeArticleEnhance from './src/lib/rehype-article-enhance.mjs';

// https://astro.build/config
export default defineConfig({
  // Production URL — drives sitemap.xml and any Astro.site usage.
  // Update this to the live domain at launch.
  site: 'https://www.tavali.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    // Re-inject the brand's .bdot bullets and .pullquote styling so
    // CMS-authored Markdown matches the original hand-coded article markup.
    rehypePlugins: [rehypeArticleEnhance],
  },
});
