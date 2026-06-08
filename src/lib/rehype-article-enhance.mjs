// rehype-article-enhance.mjs — Markdown → article HTML enhancer.
// The original hand-coded article markup decorated every list bullet with a
// <span class="bdot"> and styled quotes as .pullquote. Markdown produces plain
// <li>/<blockquote>, so this rehype plugin re-injects that markup, letting the
// existing styles-blog.css rules apply to CMS-authored posts unchanged.
import { visit } from 'unist-util-visit';

export default function rehypeArticleEnhance() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      // Prepend the decorative dot bullet to each list item.
      if (node.tagName === 'li') {
        const hasBdot =
          node.children[0]?.tagName === 'span' &&
          node.children[0]?.properties?.className?.includes('bdot');
        if (!hasBdot) {
          node.children.unshift({
            type: 'element',
            tagName: 'span',
            properties: { className: ['bdot'], 'aria-hidden': 'true' },
            children: [],
          });
        }
      }
      // Style blockquotes as brand pullquotes.
      if (node.tagName === 'blockquote') {
        const classes = node.properties.className || [];
        node.properties.className = Array.isArray(classes)
          ? [...classes, 'pullquote']
          : [classes, 'pullquote'];
      }
      // Normalize CMS image paths (Decap may omit the leading slash).
      if (node.tagName === 'img' && node.properties?.src) {
        const src = String(node.properties.src);
        if (
          !src.startsWith('http://') &&
          !src.startsWith('https://') &&
          !src.startsWith('/')
        ) {
          node.properties.src = `/${src}`;
        }
      }
    });
  };
}
