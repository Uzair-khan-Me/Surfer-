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

function preloadCriticalFontsPlugin(): Plugin {
  return {
    name: "preload-critical-fonts-and-inline-css",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const preloadTags: string[] = [];
        for (const fileName of Object.keys(ctx.bundle)) {
          if (
            fileName.endsWith(".woff2") &&
            (fileName.includes("barlow-condensed-latin-800-italic") ||
              fileName.includes("dm-sans-latin-400-normal"))
          ) {
            preloadTags.push(
              `  <link rel="preload" as="font" type="font/woff2" href="/${fileName}" crossorigin>`,
            );
          }
        }
        // Inline small render-blocking CSS chunks directly into <head> to eliminate extra Slow-4G RTTs.
        let transformed = html.replace(
          /<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g,
          (fullMatch, assetPath: string) => {
            const chunk = ctx.bundle?.[assetPath];
            if (
              chunk &&
              chunk.type === "asset" &&
              typeof chunk.source === "string"
            ) {
              return `<style>${chunk.source}</style>`;
            }
            return fullMatch;
          },
        );
        if (preloadTags.length) {
          transformed = transformed.replace(
            "</head>",
            `${preloadTags.join("\n")}\n</head>`,
          );
        }
        return transformed;
      },
    },
  };
}

export default defineConfig({
  plugins: [vercelCleanUrlsPlugin(), preloadCriticalFontsPlugin()],
  server: { host: "0.0.0.0", allowedHosts: [".e2b.app"] },
  build: {
    modulePreload: {
      resolveDependencies(_filename, deps) {
        return deps.filter((d) => !d.includes("three"));
      },
    },
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
