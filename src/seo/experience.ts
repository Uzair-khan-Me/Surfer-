/**
 * Progressive enhancement for the crawlable content that sits underneath the
 * game canvas: scroll state, the "back to the game" flow, section highlighting,
 * the on-page search box and `?q=` deep links.
 *
 * Everything here is optional: with JavaScript disabled the page is a plain,
 * complete document that crawlers and readers can use on their own.
 */

import type { Game } from "../game/Game";
import { syncStructuredData } from "./schema";
import {
  buildIndex,
  readQueryParam,
  searchIndex,
  type SearchEntry,
} from "./search";

/** How much of the content layer must be visible before the hero goes dormant. */
const CONTENT_VISIBLE_RATIO = 0.5;

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
};

export function initExperience(game: Game): void {
  const html = document.documentElement;
  let contentOnScreen = false;
  let scheduled = 0;
  let index: SearchEntry[] | null = null;

  const setContentOnScreen = (next: boolean) => {
    if (next === contentOnScreen) return;
    contentOnScreen = next;
    html.classList.toggle("view-content", next);
    // While the article is on screen the keyboard belongs to the page.
    game.input.active = !next;
  };

  const measure = () => {
    scheduled = 0;
    const y = window.scrollY || html.scrollTop;
    html.classList.toggle("is-scrolled", y > 8);
    setContentOnScreen(
      y + window.innerHeight * CONTENT_VISIBLE_RATIO > window.innerHeight,
    );
  };

  const schedule = () => {
    if (!scheduled) scheduled = requestAnimationFrame(measure);
  };

  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  measure();

  /** Keep the page-scroll lock and canvas touch behaviour in sync with the run. */
  const syncPlaying = () =>
    html.classList.toggle("is-playing", game.state === "PLAYING");
  setInterval(syncPlaying, 250);
  syncPlaying();

  const returnToGame = (start: boolean) => {
    setContentOnScreen(false);
    html.classList.remove("view-content");
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      if (start) game.start();
      game.input.active = true;
    }, 260);
  };

  document.querySelectorAll<HTMLElement>("[data-play]").forEach((control) => {
    control.addEventListener("click", (event) => {
      event.preventDefault();
      returnToGame(true);
    });
  });

  // Space and Enter are always routed to the game by the input manager (that is
  // how a run starts), and it calls preventDefault on them. Capture the event
  // first and hand those keys back to the page whenever they belong to it:
  // form fields, links, buttons and FAQ disclosures in the content layer.
  const interactiveTarget = (target: EventTarget | null): HTMLElement | null =>
    target instanceof HTMLElement
      ? target.closest<HTMLElement>(
          "a[href], button, summary, input, textarea, select, [tabindex]",
        )
      : null;

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.code !== "Enter" && event.code !== "Space") return;
      if (isEditableTarget(event.target)) {
        event.stopPropagation();
        return;
      }
      const control = interactiveTarget(event.target);
      if (control && !control.closest("#ui")) {
        // Let the browser activate the link, submit the form or open the FAQ item.
        // Controls inside the game interface keep the game's own key handling.
        event.stopPropagation();
        return;
      }
      if (!contentOnScreen) return;
      returnToGame(false);
    },
    true,
  );

  // ---------------------------------------------------------------- sections
  const navLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"),
  );
  const targets = navLinks
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter((element): element is HTMLElement => Boolean(element));
  if (targets.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = navLinks.find(
            (candidate) => candidate.hash === `#${entry.target.id}`,
          );
          if (link) link.toggleAttribute("aria-current", entry.isIntersecting);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
  }

  // -------------------------------------------------------------- deep links
  const openHashTarget = () => {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!id) return;
    const element = document.getElementById(id);
    if (element instanceof HTMLDetailsElement) element.open = true;
    else element?.closest("details")?.setAttribute("open", "");
  };
  openHashTarget();
  addEventListener("hashchange", openHashTarget);

  document
    .querySelectorAll<HTMLElement>("[data-current-year]")
    .forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });

  // ------------------------------------------------------------------ search
  const form = document.getElementById("site-search") as HTMLFormElement | null;
  const input = document.getElementById(
    "site-search-input",
  ) as HTMLInputElement | null;
  const results = document.getElementById("site-search-results");
  const status = document.getElementById("site-search-status");

  const render = (query: string) => {
    if (!form || !input || !results || !status) return;
    index ??= buildIndex();
    const hits = searchIndex(index, query);
    results.replaceChildren();
    if (!query.trim()) {
      results.hidden = true;
      status.textContent = "";
      return;
    }
    if (hits.length === 0) {
      results.hidden = true;
      status.textContent = `No matches for “${query.trim()}”. Try “controls”, “coins”, “offline” or “traffic”.`;
      return;
    }
    hits.forEach((hit) => {
      const item = document.createElement("li");
      item.className = "search-hit";
      const link = document.createElement("a");
      link.href = hit.entry.anchor;
      link.innerHTML = `<span class="search-hit-title">${hit.titleHtml}</span><span class="search-hit-section">${hit.entry.section}</span><span class="search-hit-text">${hit.textHtml}</span>`;
      item.append(link);
      results.append(item);
    });
    results.hidden = false;
    status.textContent = `${hits.length} result${hits.length === 1 ? "" : "s"} for “${query.trim()}”.`;
  };

  if (form && input) {
    let debounce = 0;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      window.clearTimeout(debounce);
      const query = input.value.trim();
      const url = new URL(location.href);
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      history.replaceState(null, "", url);
      render(query);
    });
    input.addEventListener("input", () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        const query = input.value.trim();
        const url = new URL(location.href);
        if (query.length > 1) url.searchParams.set("q", query);
        else url.searchParams.delete("q");
        history.replaceState(null, "", url);
        render(query);
      }, 140);
    });
    const initial = readQueryParam(location.search);
    if (initial) {
      input.value = initial;
      render(initial);
      window.requestAnimationFrame(() =>
        document
          .getElementById("search")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }

  syncStructuredData(document);
}
