/**
 * Static HTML checks shared by `npm run seo:audit` (which runs them against the
 * built `dist/index.html`) and `tests/seo.test.ts` (which runs them against the
 * source `index.html`). No DOM required — the checks are deliberately simple
 * string/regex analysis so they can run anywhere.
 */

import { SITE } from "./config";
import {
  JSONLD_END,
  JSONLD_START,
  readJsonLd,
  readLink,
  readMeta,
  readTitle,
} from "./files";

export type Audit = {
  errors: string[];
  warnings: string[];
  stats: Record<string, number | string>;
};

const stripTags = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tags = (html: string, name: string) =>
  html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];

const attr = (tag: string, name: string) =>
  tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1] ?? null;

const REQUIRED_SCHEMA_TYPES = [
  "WebSite",
  "WebPage",
  "VideoGame",
  "HowTo",
  "FAQPage",
  "Person",
  "ImageObject",
];

export function auditHtml(html: string): Audit {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: Record<string, number | string> = {};

  // ---------------------------------------------------------------- document
  const htmlTag = tags(html, "html")[0];
  const lang = htmlTag ? attr(htmlTag, "lang") : null;
  if (!lang) errors.push("The <html> element has no lang attribute.");
  if (!tags(html, "meta").some((tag) => attr(tag, "charset")))
    errors.push("Missing charset meta.");
  if (!tags(html, "meta").some((tag) => attr(tag, "name") === "viewport"))
    errors.push("Missing viewport meta.");

  // --------------------------------------------------------------- headings
  const h1s = tags(html, "h1");
  stats.h1 = h1s.length;
  if (h1s.length !== 1)
    errors.push(`Expected exactly one <h1>, found ${h1s.length}.`);
  const headingOrder = (html.match(/<h([1-4])\b/gi) ?? []).map((tag) =>
    Number(tag[2]),
  );
  let previous = 0;
  headingOrder.forEach((level, index) => {
    if (index === 0 && level !== 1)
      errors.push("The first heading on the page is not an <h1>.");
    if (level > previous + 1 && previous !== 0)
      errors.push(`Heading level jumps from h${previous} to h${level}.`);
    previous = level;
  });

  // ------------------------------------------------------------------ title
  const title = readTitle(html);
  stats.titleLength = title?.length ?? 0;
  if (!title) errors.push("Missing <title>.");
  else if (title.length < 15 || title.length > 65)
    warnings.push(`Title is ${title.length} characters (aim for 15-65).`);
  if (title && !title.includes(SITE.name))
    warnings.push("Title does not contain the site name.");

  const description = readMeta(html, "name", "description");
  stats.descriptionLength = description?.length ?? 0;
  if (!description) errors.push("Missing meta description.");
  else if (description.length < 70 || description.length > 165)
    warnings.push(
      `Meta description is ${description.length} characters (aim for 70-165).`,
    );

  // ---------------------------------------------------------------- canon
  const canonical = readLink(html, "canonical");
  if (!canonical) errors.push("Missing canonical link.");
  else if (canonical !== `${SITE.url}/`)
    warnings.push(`Canonical points at ${canonical}.`);

  const robots = readMeta(html, "name", "robots") ?? "";
  if (!robots.includes("index") || !robots.includes("follow"))
    errors.push("robots meta does not allow indexing and following.");

  for (const key of [
    "og:title",
    "og:description",
    "og:image",
    "og:url",
    "og:type",
  ])
    if (!readMeta(html, "property", key))
      errors.push(`Missing Open Graph tag ${key}.`);
  if (!readMeta(html, "name", "twitter:card"))
    errors.push("Missing twitter:card.");
  if (!readMeta(html, "name", "theme-color"))
    errors.push("Missing theme-color.");

  // ------------------------------------------------------------ structured
  const hasBlock = html.includes(JSONLD_START) && html.includes(JSONLD_END);
  const graph = readJsonLd(html);
  if (!hasBlock) errors.push("No JSON-LD block between the seo markers.");
  if (!graph) errors.push("The JSON-LD block is missing or not valid JSON.");
  else {
    const nodes = ((graph as { "@graph"?: unknown[] })["@graph"] ??
      []) as Array<{
      "@type"?: string;
      "@id"?: string;
    }>;
    stats.schemaNodes = nodes.length;
    const types = nodes
      .map((node) => node["@type"])
      .filter(Boolean) as string[];
    for (const required of REQUIRED_SCHEMA_TYPES)
      if (!types.includes(required))
        errors.push(`Structured data has no ${required} node.`);
    const ids = nodes.map((node) => node["@id"]).filter(Boolean) as string[];
    if (new Set(ids).size !== ids.length)
      errors.push("Structured data has duplicate @id values.");
    if (!/"@type":\s*"(Question|HowToStep)"/.test(JSON.stringify(graph)))
      warnings.push(
        "Structured data contains no repeated entities (questions/steps).",
      );
  }

  // ----------------------------------------------------------------- images
  const images = tags(html, "img");
  stats.images = images.length;
  images.forEach((tag) => {
    const alt = attr(tag, "alt");
    if (alt === null || alt.trim() === "")
      errors.push(`Image without alt text: ${tag}`);
    if (!attr(tag, "width") || !attr(tag, "height"))
      warnings.push(`Image without intrinsic dimensions (CLS risk): ${tag}`);
  });

  // ------------------------------------------------------ internal links
  const ids = new Set(
    (html.match(/\bid="([^"]+)"/g) ?? []).map((match) => match.slice(4, -1)),
  );
  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map(
    (match) => match[1],
  );
  stats.internalAnchors = anchors.length;
  for (const anchor of new Set(anchors))
    if (anchor && !ids.has(anchor) && anchor !== "top")
      errors.push(`Internal link "#${anchor}" has no matching id.`);
  const duplicateIds = (html.match(/\bid="([^"]+)"/g) ?? []).map((m) =>
    m.slice(4, -1),
  );
  const seen = new Set<string>();
  duplicateIds.forEach((id) => {
    if (seen.has(id)) errors.push(`Duplicate id "${id}".`);
    seen.add(id);
  });

  // ------------------------------------------------------------------ text
  const text = stripTags(html);
  stats.words = text.split(" ").filter(Boolean).length;
  if (stats.words < 300)
    warnings.push(
      `Only ${stats.words} words of crawlable text — thin content risk.`,
    );
  const anchorsWithoutText = (html.match(/<a\b[^>]*>\s*<\/a>/gi) ?? []).length;
  if (anchorsWithoutText > 0)
    warnings.push(`${anchorsWithoutText} <a> elements have no text.`);
  if (!/<main\b/i.test(html)) errors.push("No <main> landmark.");

  return { errors, warnings, stats };
}
