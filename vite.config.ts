import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const cleanUrlPages = new Set([
  "/games-like-subway-surfers",
  "/surfer-runner-online",
  "/no-download-browser-games",
  "/chromebook-unblocked-runner",
  "/how-to-play-guide",
]);

function vercelCleanUrlsPlugin(): Plugin {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    if (req.url) {
      const [pathname, query] = req.url.split("?");
      const normalized =
        pathname.length > 1 && pathname.endsWith("/")
          ? pathname.slice(0, -1)
          : pathname;
      if (cleanUrlPages.has(normalized)) {
        const distCandidate = path.resolve(
          rootDir,
          "dist",
          `.${normalized}.html`,
        );
        const srcCandidate = path.resolve(rootDir, `.${normalized}.html`);
        if (fs.existsSync(distCandidate) || fs.existsSync(srcCandidate)) {
          req.url = `${normalized}.html${query ? `?${query}` : ""}`;
        }
      }
    }
    next();
  };
  return {
    name: "vercel-clean-urls",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  plugins: [vercelCleanUrlsPlugin()],
  server: { host: "0.0.0.0", allowedHosts: [".e2b.app"] },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "index.html"),
        subwayAlternatives: path.resolve(
          rootDir,
          "games-like-subway-surfers.html",
        ),
        surferRunner: path.resolve(rootDir, "surfer-runner-online.html"),
        noDownload: path.resolve(rootDir, "no-download-browser-games.html"),
        chromebookRunner: path.resolve(
          rootDir,
          "chromebook-unblocked-runner.html",
        ),
        howToPlay: path.resolve(rootDir, "how-to-play-guide.html"),
      },
      output: { manualChunks: { three: ["three"] } },
    },
  },
});
