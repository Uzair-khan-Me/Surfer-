/**
 * Generators for every crawler-facing file that must not drift from the config:
 * the `<head>` values in `index.html`, the JSON-LD block, the sitemap, the RSS
 * feed, the web app manifest and robots.txt.
 *
 * `npm run seo:sync` writes them to disk and `tests/seo.test.ts` asserts the
 * files on disk still match, so a version bump only needs to touch config.ts.
 */

import { CREATOR, SITE, absoluteUrl } from "./config";
import { RELEASES } from "./content";
import { serializeGraph } from "./schema";

export const JSONLD_START = "<!-- seo:jsonld:start -->";
export const JSONLD_END = "<!-- seo:jsonld:end -->";

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const jsonLdBlock = () =>
  [
    JSONLD_START,
    '    <script type="application/ld+json" data-seo-graph>',
    serializeGraph(),
    "    </script>",
    `    ${JSONLD_END}`,
  ].join("\n");

/* ------------------------------------------------------------------ helpers */

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const metaTag = (attr: "name" | "property", key: string) =>
  new RegExp(`<meta\\s+(?=[^>]*\\b${attr}="${escapeRegex(key)}")[^>]*>`, "i");

/** Read a meta value back out of a document (used by tests and the audit). */
export function readMeta(
  html: string,
  attr: "name" | "property",
  key: string,
): string | null {
  const tag = html.match(metaTag(attr, key))?.[0];
  if (!tag) return null;
  return tag.match(/content="([^"]*)"/i)?.[1] ?? null;
}

export function readTitle(html: string): string | null {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
}

export function readLink(html: string, rel: string): string | null {
  const tag = html.match(
    new RegExp(`<link\\s+(?=[^>]*rel="${escapeRegex(rel)}")[^>]*>`, "i"),
  )?.[0];
  return tag?.match(/href="([^"]*)"/i)?.[1] ?? null;
}

export function readJsonLd(html: string): unknown | null {
  const block = html.split(JSONLD_START)[1]?.split(JSONLD_END)[0];
  const payload = block?.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!payload) return null;
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

const setMeta = (
  html: string,
  attr: "name" | "property",
  key: string,
  content: string,
) =>
  metaTag(attr, key).test(html)
    ? html.replace(
        metaTag(attr, key),
        `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`,
      )
    : html;

const setLink = (html: string, rel: string, href: string) => {
  const pattern = new RegExp(
    `<link\\s+(?=[^>]*rel="${escapeRegex(rel)}")[^>]*>`,
    "i",
  );
  return pattern.test(html)
    ? html.replace(pattern, `<link rel="${rel}" href="${href}" />`)
    : html;
};

/* ---------------------------------------------------------------- index.html */

/** Rewrite every config-driven head value plus the JSON-LD block. */
export function syncIndexHtml(html: string): string {
  let next = html;
  const start = next.indexOf(JSONLD_START);
  const end = next.indexOf(JSONLD_END);
  if (start >= 0 && end > start)
    next =
      next.slice(0, start) +
      jsonLdBlock() +
      next.slice(end + JSONLD_END.length);

  next = next.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(SITE.title)}</title>`,
  );
  next = setMeta(next, "name", "description", SITE.description);
  next = setMeta(next, "name", "keywords", SITE.keywords.join(", "));
  next = setMeta(next, "name", "author", CREATOR.name);
  next = setMeta(next, "name", "creator", CREATOR.name);
  next = setMeta(next, "name", "application-name", SITE.name);
  next = setMeta(next, "name", "theme-color", SITE.themeColor);
  next = setMeta(next, "name", "apple-mobile-web-app-title", SITE.shortName);
  next = setLink(next, "canonical", absoluteUrl("/"));
  next = setLink(next, "manifest", "/manifest.webmanifest");

  next = setMeta(next, "property", "og:site_name", SITE.name);
  next = setMeta(next, "property", "og:title", SITE.title);
  next = setMeta(next, "property", "og:description", SITE.description);
  next = setMeta(next, "property", "og:url", absoluteUrl("/"));
  next = setMeta(next, "property", "og:image", absoluteUrl(SITE.ogImage));
  next = setMeta(
    next,
    "property",
    "og:image:secure_url",
    absoluteUrl(SITE.ogImage),
  );
  next = setMeta(next, "property", "og:image:width", String(SITE.ogImageWidth));
  next = setMeta(
    next,
    "property",
    "og:image:height",
    String(SITE.ogImageHeight),
  );
  next = setMeta(next, "property", "og:image:alt", SITE.ogImageAlt);

  next = setMeta(next, "name", "twitter:card", "summary_large_image");
  next = setMeta(next, "name", "twitter:title", SITE.title);
  next = setMeta(next, "name", "twitter:description", SITE.description);
  next = setMeta(next, "name", "twitter:image", absoluteUrl(SITE.ogImage));
  next = setMeta(next, "name", "twitter:image:alt", SITE.ogImageAlt);

  return next;
}

/* ----------------------------------------------------------------- sitemap */

export function buildSitemap(): string {
  const images = [SITE.ogImage, ...SITE.screenshots.map((shot) => shot.path)]
    .map((path, index) => {
      const shot = SITE.screenshots.find(
        (candidate) => candidate.path === path,
      );
      const caption = shot?.caption ?? SITE.ogImageAlt;
      const title = index === 0 ? SITE.title : (caption ?? SITE.name);
      return `    <image:image>\n      <image:loc>${absoluteUrl(path)}</image:loc>\n      <image:title>${escapeHtml(title)}</image:title>\n      <image:caption>${escapeHtml(caption)}</image:caption>\n    </image:image>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${absoluteUrl("/")}</loc>
    <lastmod>${SITE.updated}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${images}
  </url>
</urlset>
`;
}

/* -------------------------------------------------------------------- feed */

const rfc822 = (date: string) => new Date(`${date}T09:00:00Z`).toUTCString();

export function buildFeed(): string {
  const items = RELEASES.map((release) => {
    const url = `${absoluteUrl("/")}#changelog`;
    return `    <item>
      <title>${escapeHtml(`${SITE.name} ${release.version}`)}</title>
      <link>${url}</link>
      <guid isPermaLink="false">${escapeHtml(`${SITE.name.toLowerCase().replace(/\s+/g, "-")}-${release.version}`)}</guid>${
        release.date ? `\n      <pubDate>${rfc822(release.date)}</pubDate>` : ""
      }
      <description>${escapeHtml(release.items.join(" "))}</description>
    </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(`${SITE.name} — what's new`)}</title>
    <link>${absoluteUrl("/")}</link>
    <description>${escapeHtml(SITE.description)}</description>
    <language>${SITE.language}</language>
    <lastBuildDate>${rfc822(SITE.updated)}</lastBuildDate>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

/* ---------------------------------------------------------------- manifest */

export function buildManifest(): string {
  const manifest = {
    id: "/",
    name: `${SITE.name} — neon city endless runner`,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    display_override: ["fullscreen", "standalone", "minimal-ui"],
    orientation: "any",
    background_color: SITE.themeColor,
    theme_color: SITE.themeColor,
    lang: SITE.language,
    dir: "ltr",
    categories: ["games", "entertainment"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: SITE.screenshots.map((shot) => ({
      src: shot.path,
      sizes: `${shot.width}x${shot.height}`,
      type: "image/png",
      form_factor: shot.width >= shot.height ? "wide" : "narrow",
      label: shot.caption,
    })),
    shortcuts: [
      { name: "How to play", short_name: "Play", url: "/#how-to-play" },
      { name: "Frequently asked questions", short_name: "FAQ", url: "/#faq" },
    ],
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/* ------------------------------------------------------------------ robots */

export function buildRobots(): string {
  return `# ${absoluteUrl("/")}robots.txt — every crawler is welcome.
User-agent: *
Allow: /
# Internal page-search URLs are duplicates of the home page.
Disallow: /*?q=

User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Bingbot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Applebot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: ${absoluteUrl("/sitemap.xml")}
`;
}

export function buildBrowserConfig(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/icon-192.png"/>
      <TileColor>${SITE.themeColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`;
}
