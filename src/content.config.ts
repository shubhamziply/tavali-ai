// content.config.ts — Astro Content Collections.
// Defines the `blog` collection: Markdown/MDX files in src/content/blog/
// (where Decap CMS writes posts), validated against a strict Zod schema.
// Every field here maps to a widget in public/admin/config.yml.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  // Load .md/.mdx files from the blog content folder. The filename (without
  // extension) becomes the entry id / URL slug.
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    // Optional secondary line shown under the H1 on the article page.
    subtitle: z.string().optional(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Tavali Team'),
    // Path under /public (e.g. /images/uploads/...) or external URL.
    heroImage: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return val;
        if (val.startsWith('http://') || val.startsWith('https://')) return val;
        return val.startsWith('/') ? val : `/${val}`;
      }),
    // Editorial category — matches the blog filter chips.
    category: z.enum([
      'AI in Dentistry',
      'Revenue & Billing',
      'Practice Operations',
      'Staffing',
      'Clinical AI',
      'DSO & Multi-Location',
    ]),
    tags: z.array(z.string()).default([]),
    minutesRead: z.string().default('5 min read'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
