import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

/** Fonts the first frame actually needs — preloaded to avoid a late swap. */
const PRIORITY_FONTS = [
  /barlow-condensed-latin-800-italic-.*\.woff2$/,
  /barlow-condensed-latin-800-.*\.woff2$/,
  /dm-sans-latin-400-.*\.woff2$/,
];

/** Assets that are never useful offline (social cards, feeds, screenshots). */
const PRECACHE_EXCLUDE =
  /(^|\/)(og-image|screenshots\/|feed\.xml|sitemap\.xml|robots\.txt|404\.html)/;

const walk = (dir: string, files: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
};

const toUrl = (file: string, base: string) =>
  `/${relative(base, file).split(sep).join("/")}`;

const serviceWorker = (
  precache: string[],
  buildId: string,
) => `/* Afterlight Run — generated service worker. Do not edit by hand. */
const CACHE = "afterlight-run-${buildId}";
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network first so a new deploy is picked up, cache as fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html").then((hit) => hit || Response.error())),
    );
    return;
  }

  // Everything else: cache first, because every URL is content-hashed.
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).catch(() => Response.error())),
  );
});
`;

/**
 * Post-build SEO plumbing that Vite cannot express in the entry HTML:
 * font preloads for the first paint and a generated offline service worker.
 */
function seoBuildAssets(): Plugin {
  return {
    name: "afterlight:seo-build-assets",
    apply: "build",
    closeBundle() {
      const dist = resolve(root, "dist");
      const files = walk(dist);
      const urls = files.map((file) => toUrl(file, dist));
      const precache = urls
        .filter((url) => !PRECACHE_EXCLUDE.test(url))
        .filter((url) =>
          /\.(html|js|css|woff2|png|svg|webmanifest|ico)$/.test(url),
        )
        .sort();
      if (!precache.includes("/index.html")) precache.unshift("/index.html");
      const buildId = createHash("sha256")
        .update(precache.join("|"))
        .digest("hex")
        .slice(0, 10);
      writeFileSync(join(dist, "sw.js"), serviceWorker(precache, buildId));

      const preloads = urls
        .filter((url) => PRIORITY_FONTS.some((pattern) => pattern.test(url)))
        .map(
          (url) =>
            `    <link rel="preload" as="font" type="font/woff2" href="${url}" crossorigin="anonymous" />`,
        );
      if (preloads.length) {
        const htmlPath = join(dist, "index.html");
        const html = readFileSync(htmlPath, "utf8");
        const block = `${preloads.join("\n")}\n`;
        // Fonts must be discovered before the stylesheet that references them.
        const next = html.includes('<link rel="stylesheet"')
          ? html.replace(
              '<link rel="stylesheet"',
              `${block}    <link rel="stylesheet"`,
            )
          : html.replace("</head>", `${block}  </head>`);
        writeFileSync(htmlPath, next);
        this.info?.(`preloaded ${preloads.length} font files`);
      }
      this.info?.(
        `service worker precaches ${precache.length} files (${buildId})`,
      );
    },
  };
}

export default defineConfig({
  plugins: [seoBuildAssets()],
  server: { host: "0.0.0.0", allowedHosts: [".e2b.app"] },
  build: { rollupOptions: { output: { manualChunks: { three: ["three"] } } } },
});
