import "@fontsource/barlow-condensed/latin-800-italic.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-700.css";
import "./style.css";
import { normalizeTVKey } from "./input/tvKey";
import type { Game } from "./game/Game";

const el = (id: string) => document.getElementById(id);

// Hydrate stored personal best synchronously onto pre-rendered Menu HTML.
try {
  const saved = Number(localStorage.getItem("afterlight.best")) || 0;
  const bestEl = el("menu-best");
  if (bestEl) bestEl.textContent = String(saved).padStart(6, "0");
} catch {
  // Ignore storage restrictions.
}

export let game: Game | undefined;
let booting: Promise<Game> | null = null;
let earlyMuted = false;
let earlyNavActive = false;
let earlyNavIndex = 0;
let gameModulePromise: Promise<typeof import("./game/Game")> | null = null;

const MENU_NAV_IDS = ["play", "sound", "about-button", "help-button"] as const;

const loadModule = () => {
  if (!gameModulePromise) gameModulePromise = import("./game/Game");
  return gameModulePromise;
};

const modalOpen = () =>
  Boolean(
    (el("help") && !el("help")!.hidden) ||
    (el("about") && !el("about")!.hidden),
  );

// Wire lightweight Menu controls immediately before Three.js initializes.
const helpBtn = el("help-button");
const closeHelpBtn = el("close-help");
const aboutBtn = el("about-button");
const closeAboutBtn = el("close-about");
const aboutOverlay = el("about");
const soundBtn = el("sound");
const playBtn = el("play");
const brandLink = document.querySelector<HTMLAnchorElement>("a.brand");

if (brandLink) brandLink.onclick = (e) => e.preventDefault();
if (helpBtn) {
  helpBtn.onclick = () => {
    if (el("about")) el("about")!.hidden = true;
    if (el("help")) el("help")!.hidden = false;
    closeHelpBtn?.focus();
  };
}
if (closeHelpBtn) {
  closeHelpBtn.onclick = () => {
    if (el("help")) el("help")!.hidden = true;
    helpBtn?.focus();
  };
}
if (aboutBtn) {
  aboutBtn.onclick = () => {
    if (el("help")) el("help")!.hidden = true;
    if (el("about")) el("about")!.hidden = false;
    closeAboutBtn?.focus();
  };
}
if (closeAboutBtn) {
  closeAboutBtn.onclick = () => {
    if (el("about")) el("about")!.hidden = true;
    aboutBtn?.focus();
  };
}
if (aboutOverlay) {
  aboutOverlay.onclick = (e) => {
    if (e.target === aboutOverlay) aboutOverlay.hidden = true;
  };
}
if (soundBtn) {
  soundBtn.onclick = () => {
    earlyMuted = !earlyMuted;
    soundBtn.classList.toggle("is-muted", earlyMuted);
    soundBtn.setAttribute(
      "aria-label",
      earlyMuted ? "Unmute sound" : "Mute sound",
    );
  };
}

function clearEarlyFocus() {
  earlyNavActive = false;
  earlyNavIndex = 0;
  for (const id of MENU_NAV_IDS) el(id)?.classList.remove("tv-focus");
}

function setEarlyFocus(index: number) {
  const items = MENU_NAV_IDS.map((id) => el(id)).filter(
    (node): node is HTMLElement => Boolean(node && !node.hidden),
  );
  if (!items.length) return;
  earlyNavIndex = ((index % items.length) + items.length) % items.length;
  earlyNavActive = true;
  for (const node of items) node.classList.remove("tv-focus");
  items[earlyNavIndex].classList.add("tv-focus");
  items[earlyNavIndex].focus({ preventScroll: true });
}

function onEarlyKey(e: KeyboardEvent) {
  const cmd = normalizeTVKey(e);
  if (e.code === "Space" && !modalOpen()) {
    e.preventDefault();
    clearEarlyFocus();
    void ensureGame(true);
    return;
  }
  if (!cmd) return;

  if (modalOpen()) {
    if (cmd === "up" || cmd === "down") {
      const card = document.querySelector<HTMLElement>(".about-card");
      if (aboutOverlay && !aboutOverlay.hidden && card) {
        card.scrollBy({ top: cmd === "down" ? 90 : -90, behavior: "smooth" });
        e.preventDefault();
      }
      return;
    }
    if (cmd === "select" || cmd === "back") {
      e.preventDefault();
      if (el("about")) el("about")!.hidden = true;
      if (el("help")) el("help")!.hidden = true;
      clearEarlyFocus();
    }
    return;
  }

  if (cmd === "up" || cmd === "down" || cmd === "left" || cmd === "right") {
    e.preventDefault();
    void loadModule();
    if (!earlyNavActive) setEarlyFocus(cmd === "up" ? 1 : 0);
    else
      setEarlyFocus(earlyNavIndex + (cmd === "right" || cmd === "up" ? 1 : -1));
    return;
  }

  if (cmd === "select" || cmd === "playpause") {
    e.preventDefault();
    if (cmd === "select" && earlyNavActive) {
      const items = MENU_NAV_IDS.map((id) => el(id)).filter(
        (node): node is HTMLElement => Boolean(node && !node.hidden),
      );
      const target = items[earlyNavIndex];
      if (target && target.id !== "play") {
        target.click();
        return;
      }
    }
    clearEarlyFocus();
    void ensureGame(true);
  }
}
addEventListener("keydown", onEarlyKey);
addEventListener("gamepadconnected", () => void ensureGame(false), {
  once: true,
});

async function ensureGame(startAfterLoad = false): Promise<Game> {
  if (game) {
    if (startAfterLoad) game.start();
    return game;
  }
  if (!booting) {
    booting = loadModule().then(({ Game: GameClass }) => {
      removeEventListener("keydown", onEarlyKey);
      clearEarlyFocus();
      const instance = new GameClass();
      const canvas = document.querySelector<HTMLCanvasElement>("canvas");
      if (canvas) canvas.style.backgroundImage = "none";
      if (earlyMuted) {
        const muted = instance.audio.toggle();
        el("sound")?.classList.toggle("is-muted", muted);
        el("sound")?.setAttribute(
          "aria-label",
          muted ? "Unmute sound" : "Mute sound",
        );
      }
      game = instance;
      if (import.meta.env.DEV)
        Object.assign(window, { __afterlight: instance });
      return instance;
    });
  }
  const ready = await booting;
  if (startAfterLoad) ready.start();
  return ready;
}

if (playBtn) {
  playBtn.onclick = () => {
    clearEarlyFocus();
    void ensureGame(true);
  };
  playBtn.addEventListener("pointerenter", () => void loadModule(), {
    once: true,
    passive: true,
  });
}

// Development-only eager boot for reproducible automated browser physics tests.
if (import.meta.env.DEV) {
  void ensureGame(false);
} else {
  // Prefetch Three.js + Game immediately on first pointer/touch activity, or after
  // initial visual assets (fonts + backdrop) finish settling on slow mobile networks.
  addEventListener("pointermove", () => void loadModule(), {
    once: true,
    passive: true,
  });
  addEventListener("touchstart", () => void loadModule(), {
    once: true,
    passive: true,
  });
  const schedulePrefetch = () => {
    setTimeout(() => void loadModule(), 3200);
  };
  if (document.readyState === "complete") schedulePrefetch();
  else addEventListener("load", schedulePrefetch, { once: true });
}
