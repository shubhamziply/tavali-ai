import type { CollectionEntry } from 'astro:content';

/** Stable hash of published posts — changes when posts are added, removed, or updated. */
export function getBlogFingerprint(posts: CollectionEntry<'blog'>[]) {
  return posts
    .map((p) => {
      const stamp = (p.data.updatedDate ?? p.data.pubDate).valueOf();
      return `${p.id}:${stamp}:${p.data.draft ? 1 : 0}`;
    })
    .join('|');
}
