/**
 * Tiny client-side search for the page content. It powers two SEO-visible
 * things: the on-page "Search this page" box and the `?q=` deep link that backs
 * the WebSite `SearchAction` declared in structured data.
 *
 * The scoring half of this file is pure so it can be unit tested in Node.
 */

export type SearchEntry = {
  id: string;
  /** Nearest heading, used as the result title. */
  title: string;
  /** Body text of the block. */
  text: string;
  /** Section label, e.g. "Frequently asked questions". */
  section: string;
  /** `#fragment` to jump to. */
  anchor: string;
};

type Indexable = SearchEntry & { anchor: string };

export type SearchHit = {
  entry: SearchEntry;
  score: number;
  titleHtml: string;
  textHtml: string;
};

export const MAX_QUERY_LENGTH = 80;

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+#-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(query: string): string[] {
  const tokens = normalize(query.slice(0, MAX_QUERY_LENGTH))
    .split(" ")
    .filter((token) => token.length > 1);
  return [...new Set(tokens)];
}

/** How well a single entry matches. Title hits count for more than body hits. */
export function scoreEntry(
  entry: SearchEntry,
  tokens: string[],
  phrase: string,
): number {
  if (tokens.length === 0) return 0;
  const title = normalize(entry.title);
  const text = normalize(`${entry.text} ${entry.section}`);
  let score = 0;
  for (const token of tokens) {
    const inTitle = title.includes(token);
    const inText = text.includes(token);
    if (!inTitle && !inText) return 0;
    score += inTitle ? 6 : 0;
    score += inText ? 2 : 0;
    if (title.startsWith(token)) score += 3;
  }
  if (phrase.length > 3 && (title.includes(phrase) || text.includes(phrase)))
    score += 8;
  return score;
}

export function searchIndex(
  entries: SearchEntry[],
  query: string,
  limit = 8,
): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const phrase = normalize(query.slice(0, MAX_QUERY_LENGTH));
  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens, phrase) }))
    .filter((hit) => hit.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title),
    )
    .slice(0, limit)
    .map((hit) => ({
      ...hit,
      titleHtml: highlight(hit.entry.title, tokens),
      textHtml: highlight(snippet(hit.entry.text, tokens), tokens),
    }));
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape first, then wrap matched tokens in <mark> so output is safe to inject. */
export function highlight(value: string, tokens: string[]): string {
  let html = escapeHtml(value);
  for (const token of tokens) {
    if (token.length < 2) continue;
    const pattern = new RegExp(
      `(${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    html = html.replace(pattern, "<mark>$1</mark>");
  }
  return html;
}

/** Keep results readable: centre the snippet on the first matching token. */
export function snippet(text: string, tokens: string[], radius = 110): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= radius * 2) return flat;
  const lower = flat.toLowerCase();
  const at = tokens
    .map((token) => lower.indexOf(token))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  if (at === undefined) return `${flat.slice(0, radius * 2)}…`;
  const start = Math.max(0, at - radius);
  const end = Math.min(flat.length, start + radius * 2);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
}

/** Read `?q=` without throwing on malformed input. */
export function readQueryParam(search: string): string {
  try {
    return (
      new URLSearchParams(search).get("q")?.slice(0, MAX_QUERY_LENGTH) ?? ""
    );
  } catch {
    return "";
  }
}

/**
 * Walk the rendered content and build a flat index. Blocks with an `id` anchor
 * directly; everything else points at the surrounding section (and, for FAQ
 * items, at the shared `#faq` heading).
 */
export function buildIndex(root: ParentNode = document): SearchEntry[] {
  const entries: SearchEntry[] = [];
  const sections = root.querySelectorAll<HTMLElement>(
    "main#main-content section[id]",
  );
  const seen = new Set<string>();
  sections.forEach((section) => {
    const sectionTitle =
      section
        .querySelector("h2, h1")
        ?.textContent?.replace(/\s+/g, " ")
        .trim() ?? section.id;
    const blocks = section.querySelectorAll<HTMLElement>(
      "details.faq-item, article.feature-card, li.step, li.tip, li.audience, p.lead, p.prose",
    );
    if (blocks.length === 0) {
      const text = section.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (text)
        entries.push({
          id: section.id,
          title: sectionTitle,
          text,
          section: sectionTitle,
          anchor: `#${section.id}`,
        });
      return;
    }
    blocks.forEach((block, index) => {
      const id = block.id || `${section.id}-item-${index + 1}`;
      if (seen.has(id)) return;
      seen.add(id);
      block.id = id;
      const heading = block
        .querySelector("h3, summary, strong")
        ?.textContent?.replace(/\s+/g, " ")
        .trim();
      const text = block.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const title =
        heading ||
        (text.length > 70 ? `${text.slice(0, 70)}…` : text) ||
        sectionTitle;
      entries.push({
        id,
        title,
        text,
        section: sectionTitle,
        anchor: `#${id}`,
      });
    });
  });
  return entries.filter((entry) => entry.text.length > 0);
}

export type { Indexable };
