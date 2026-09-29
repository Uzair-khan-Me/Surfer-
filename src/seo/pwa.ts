/**
 * Service worker registration. Offline play is a progressive enhancement: the
 * game works with no service worker at all, so failures are swallowed.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
    return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* Offline caching is optional — never break the game for it. */
    });
  });
}
