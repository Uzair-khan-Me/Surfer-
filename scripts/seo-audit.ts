/**
 * Audits the built site: `npm run build && npm run seo:audit`.
 *
 * Fails (exit code 1) when a required tag, structured-data node or crawler file
 * is missing, and prints warnings for the softer recommendations. Run it in CI
 * after every deploy to keep the technical SEO from regressing.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { auditHtml } from "../src/seo/audit";
import { SITE } from "../src/seo/config";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const target = join(dist, "index.html");
const source = join(root, "index.html");
const path = existsSync(target) ? target : source;
if (!existsSync(dist))
  console.log("dist/ not found — auditing the source index.html instead.");
else console.log(`Auditing ${target}\n`);

const html = readFileSync(path, "utf8");
const { errors, warnings, stats } = auditHtml(html);

const pngSize = (file: string) => {
  const buffer = readFileSync(file);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

const expectFile = (relative: string, minBytes = 1) => {
  const file = join(dist, relative);
  if (!existsSync(file)) errors.push(`Missing built file: ${relative}`);
  else if (statSync(file).size < minBytes)
    errors.push(`Suspiciously small file: ${relative}`);
  return file;
};

if (existsSync(dist)) {
  expectFile("robots.txt", 50);
  expectFile("sitemap.xml", 100);
  expectFile("manifest.webmanifest", 100);
  expectFile("feed.xml", 100);
  expectFile("sw.js", 100);
  expectFile("404.html", 100);
  expectFile("favicon.svg", 50);
  expectFile("favicon.ico", 100);
  expectFile("icon-192.png", 1000);
  expectFile("icon-512.png", 1000);
  expectFile("maskable-512.png", 1000);
  expectFile("apple-touch-icon.png", 1000);
  expectFile("og-image.png", 10000);

  const og = join(dist, "og-image.png");
  if (existsSync(og)) {
    const { width, height } = pngSize(og);
    if (width !== SITE.ogImageWidth || height !== SITE.ogImageHeight)
      errors.push(
        `og-image.png is ${width}x${height}; expected ${SITE.ogImageWidth}x${SITE.ogImageHeight}.`,
      );
  }
  for (const shot of SITE.screenshots) {
    const file = expectFile(shot.path.replace(/^\//, ""), 5000);
    if (!existsSync(file)) continue;
    const { width, height } = pngSize(file);
    if (width !== shot.width || height !== shot.height)
      errors.push(
        `${shot.path} is ${width}x${height}; expected ${shot.width}x${shot.height}.`,
      );
  }

  const manifestPath = join(dist, "manifest.webmanifest");
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      for (const key of [
        "name",
        "short_name",
        "start_url",
        "display",
        "theme_color",
        "icons",
      ])
        if (!manifest[key])
          errors.push(`manifest.webmanifest is missing "${key}".`);
      if (
        !(manifest.icons ?? []).some(
          (icon: { purpose?: string }) => icon.purpose === "maskable",
        )
      )
        warnings.push(
          "manifest.webmanifest has no maskable icon (Android shows a white box).",
        );
      if (!(manifest.screenshots ?? []).length)
        warnings.push(
          "manifest.webmanifest has no screenshots (install prompt stays minimal).",
        );
    } catch {
      errors.push("manifest.webmanifest is not valid JSON.");
    }
  }

  const sitemap = join(dist, "sitemap.xml");
  if (existsSync(sitemap)) {
    const xml = readFileSync(sitemap, "utf8");
    if (!xml.includes("<urlset")) errors.push("sitemap.xml has no <urlset>.");
    if (!xml.includes(`${SITE.url}/</loc>`))
      errors.push("sitemap.xml does not list the canonical URL.");
    if (!xml.includes("<image:image>"))
      warnings.push("sitemap.xml lists no images.");
  }

  const feed = join(dist, "feed.xml");
  if (existsSync(feed)) {
    const xml = readFileSync(feed, "utf8");
    if (!xml.includes("<rss")) errors.push("feed.xml has no <rss> element.");
    if (!xml.includes("<item>")) warnings.push("feed.xml contains no items.");
  }
}

console.log("SEO audit");
console.log("─────────");
for (const [key, value] of Object.entries(stats))
  console.log(`  ${key}: ${value}`);
console.log("");
if (warnings.length) {
  console.log(`Warnings (${warnings.length})`);
  warnings.forEach((warning) => console.log(`  ! ${warning}`));
  console.log("");
}
if (errors.length) {
  console.log(`Errors (${errors.length})`);
  errors.forEach((error) => console.log(`  x ${error}`));
  process.exitCode = 1;
} else {
  console.log("No errors. Every required SEO signal is present.");
}
