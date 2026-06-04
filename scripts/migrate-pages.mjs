// migrate-pages.mjs — one-time migration codemod.
// Extracts the <main> body + <head> SEO/JSON-LD from each legacy static HTML
// page and emits an equivalent Astro page that wraps the body in BaseLayout.
// Internal *.html links and asset paths are rewritten to Astro routes.
// Run once from the project root: `node scripts/migrate-pages.mjs`.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const SRC = ".."; // legacy HTML lives one level up from /tavali
const OUT = "src/pages";

// legacy file -> Astro route path (used both for output + link rewriting)
const routes = {
	"Tavali Home.html": "/",
	"Platform.html": "/platform",
	"Solutions.html": "/solutions",
	"Pricing.html": "/pricing",
	"Security.html": "/security",
	"FAQ.html": "/faq",
	"Resources.html": "/resources",
	"About.html": "/about",
	"Team.html": "/team",
	"Contact.html": "/contact",
	"Privacy.html": "/privacy",
	"Terms.html": "/terms",
	"LLM Info.html": "/llm-info",
	"Blog.html": "/blog",
	"Article.html": "/blog/what-is-an-ai-native-dental-operating-system/",
};

// route path -> output .astro file
const outFile = {
	"/": "index.astro",
	"/platform": "platform.astro",
	"/solutions": "solutions.astro",
	"/pricing": "pricing.astro",
	"/security": "security.astro",
	"/faq": "faq.astro",
	"/resources": "resources.astro",
	"/about": "about.astro",
	"/team": "team.astro",
	"/contact": "contact.astro",
	"/privacy": "privacy.astro",
	"/terms": "terms.astro",
	"/llm-info": "llm-info.astro",
};

// page -> { css, thumb, ctaGhostLabel, ctaGhostHref }
const meta = {
	"/": {
		css: null,
		thumb: "Home",
		ghostLabel: "Explore the Platform",
		ghostHref: "/platform",
	},
	"/platform": { css: "styles-platform.css", thumb: "Platform" },
	"/solutions": { css: "styles-solutions.css", thumb: "Solutions" },
	"/pricing": { css: "styles-pricing.css", thumb: "Pricing" },
	"/security": { css: "styles-security.css", thumb: "Security" },
	"/faq": { css: "styles-faq.css", thumb: "FAQ" },
	"/resources": { css: "styles-resources.css", thumb: "Resources" },
	"/about": { css: "styles-about.css", thumb: "About" },
	"/team": { css: "styles-team.css", thumb: "Team" },
	"/contact": { css: "styles-contact.css", thumb: "Contact" },
	"/privacy": { css: "styles-legal.css", thumb: "Privacy" },
	"/terms": { css: "styles-legal.css", thumb: "Terms" },
	"/llm-info": { css: "styles-llms.css", thumb: "Overview" },
};

// Sort legacy names longest-first so "Tavali Home.html" matches before "Home".
const linkPairs = Object.entries(routes).sort(
	(a, b) => b[0].length - a[0].length,
);

function rewriteLinks(html) {
	let out = html;
	for (const [file, route] of linkPairs) {
		// Escape regex special chars (spaces, parens) in the filename.
		const esc = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		// href="File.html#anchor" or href="File.html"  (also handles &amp; etc.)
		out = out.replace(new RegExp(`(href=")${esc}`, "g"), `$1${route}`);
	}
	// Asset paths: assets/foo.png -> /assets/foo.png
	out = out.replace(/(src|href)="assets\//g, '$1="/assets/');
	return out;
}

function attr(html, re) {
	const m = html.match(re);
	return m ? m[1].trim() : undefined;
}

function extractMain(html) {
	const m = html.match(/<main[\s\S]*?<\/main>/i);
	return m ? m[0] : "";
}

function extractJsonLd(head) {
	const blocks = head.match(
		/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi,
	);
	return blocks ? blocks.join("\n  ") : "";
}

function esc(str) {
	return (str ?? "").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

for (const [file, route] of Object.entries(routes)) {
	if (!(route in outFile)) continue; // blog/article handled separately
	const raw = readFileSync(join(SRC, file), "utf8");
	const head = raw.slice(0, raw.indexOf("</head>"));
	const m = meta[route];

	const title = attr(head, /<title>([\s\S]*?)<\/title>/i);
	const description = attr(
		head,
		/<meta name="description" content="([\s\S]*?)"\s*\/?>/i,
	);
	const canonical = attr(
		head,
		/<link rel="canonical" href="([\s\S]*?)"\s*\/?>/i,
	);
	const ogTitle = attr(
		head,
		/<meta property="og:title" content="([\s\S]*?)"\s*\/?>/i,
	);
	const ogDescription = attr(
		head,
		/<meta property="og:description" content="([\s\S]*?)"\s*\/?>/i,
	);
	const ogImage = attr(
		head,
		/<meta property="og:image" content="([\s\S]*?)"\s*\/?>/i,
	);
	const ogImageAlt = attr(
		head,
		/<meta property="og:image:alt" content="([\s\S]*?)"\s*\/?>/i,
	);

	const jsonld = rewriteLinks(extractJsonLd(head));
	const main = rewriteLinks(extractMain(raw));

	// Build BaseLayout prop attributes.
	const props = [
		`title=${JSON.stringify(title)}`,
		`description=${JSON.stringify(description)}`,
		canonical && `canonical=${JSON.stringify(canonical)}`,
		ogTitle && ogTitle !== title && `ogTitle=${JSON.stringify(ogTitle)}`,
		ogDescription &&
			ogDescription !== description &&
			`ogDescription=${JSON.stringify(ogDescription)}`,
		ogImage && `ogImage=${JSON.stringify(ogImage)}`,
		ogImageAlt && `ogImageAlt=${JSON.stringify(ogImageAlt)}`,
		`thumbnailLabel=${JSON.stringify(m.thumb)}`,
		m.ghostLabel && `ctaGhostLabel=${JSON.stringify(m.ghostLabel)}`,
		m.ghostHref && `ctaGhostHref=${JSON.stringify(m.ghostHref)}`,
	].filter(Boolean);

	const importCss = m.css ? `import '../styles/${m.css}';\n` : "";
	const jsonldSlot = jsonld
		? `\n  <Fragment slot="jsonld" set:html={\`${esc(jsonld)}\`} />\n`
		: "";

	const astro = `---
/**
 * ${outFile[route]} — migrated from "${file}".
 * Static marketing/content page. Shared chrome (head, header, nav, footer) is
 * provided by BaseLayout; this file holds the page-unique <main> body and its
 * structured data. Generated by scripts/migrate-pages.mjs, then maintained by
 * hand.
 */
import BaseLayout from '../layouts/BaseLayout.astro';
${importCss}---
<BaseLayout
  ${props.join("\n  ")}
>${jsonldSlot}
${main}
</BaseLayout>
`;

	const dest = join(OUT, outFile[route]);
	mkdirSync(dirname(dest), { recursive: true });
	writeFileSync(dest, astro, "utf8");
	console.log(
		`wrote ${dest}  (${main.length} bytes main, ${jsonld ? "jsonld" : "no jsonld"})`,
	);
}
console.log("done");
