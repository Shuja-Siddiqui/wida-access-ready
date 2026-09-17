import fs from "node:fs";
import path from "node:path";
import express from "express";

try {
  process.loadEnvFile(path.resolve(import.meta.dirname, "..", ".env"));
} catch {
  // .env is optional; PORT / BASE_PATH have local defaults below.
}

/**
 * A minimal Express server that server-renders exactly three routes — `/`,
 * `/billing`, and `/billing/checkout` (see `client/entry-server.tsx`) — and
 * falls back to serving the plain SPA shell for every other route, exactly
 * as `vite dev` / `vite preview` did before this server existed. No other
 * route's behavior changes.
 */

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

// In production this can point at an internal reverse proxy. Locally the
// API server listens on 8080.
const internalApiBaseUrl = (
  process.env.INTERNAL_PROXY_BASE_URL ?? "http://127.0.0.1:8080"
).replace("://localhost", "://127.0.0.1");

const isProduction = process.env.NODE_ENV === "production";
const root = path.resolve(import.meta.dirname, "..");

// Routes rendered on the server. Everything else is served as the SPA shell.
const SSR_ROUTES = new Set(["/", "/billing", "/billing/checkout"]);

function stripBasePath(urlPath: string): string {
  if (basePath === "/" || !urlPath.startsWith(basePath)) return urlPath;
  const stripped = urlPath.slice(basePath.length);
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

async function createServer() {
  const app = express();

  let vite: import("vite").ViteDevServer | undefined;

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      root,
      server: { middlewareMode: true, hmr: { server: undefined } },
      appType: "custom",
      base: basePath,
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      basePath,
      express.static(path.resolve(root, "dist/public"), { index: false }),
    );
  }

  app.use(/.*/, async (req, res, next) => {
    const rawUrl = req.originalUrl;
    const urlPath = stripBasePath(rawUrl.split("?")[0] ?? rawUrl);

    try {
      let template: string;
      let render: (
        url: string,
        internalApiBaseUrl: string,
        cookieHeader?: string,
      ) => Promise<{ html: string; dehydratedState: unknown; initialAuth: unknown }>;

      if (!isProduction) {
        template = fs.readFileSync(path.resolve(root, "index.html"), "utf-8");
        template = await vite!.transformIndexHtml(rawUrl, template);
        const mod = await vite!.ssrLoadModule("/client/entry-server.tsx");
        render = mod.render;
      } else {
        template = fs.readFileSync(
          path.resolve(root, "dist/public/index.html"),
          "utf-8",
        );
        // Built by `vite build --ssr client/entry-server.tsx --outDir dist/server`.
        const mod = await import(
          path.resolve(root, "dist/server/entry-server.js")
        );
        render = mod.render;
      }

      if (!SSR_ROUTES.has(urlPath)) {
        // Not one of the two SSR'd routes — serve the same untouched SPA
        // shell that this app always has, and let the client-side router
        // (wouter) take over, exactly as before this server existed.
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
        return;
      }

      const { html, dehydratedState, initialAuth } = await render(
        urlPath,
        internalApiBaseUrl,
        req.headers.cookie,
      );

      const page = template
        .replace(`<div id="root"></div>`, `<div id="root">${html}</div>`)
        .replace(
          "</body>",
          `<script>window.__REACT_QUERY_STATE__ = ${JSON.stringify(
            dehydratedState,
          ).replace(/</g, "\\u003c")};window.__INITIAL_AUTH__ = ${JSON.stringify(
            initialAuth,
          ).replace(/</g, "\\u003c")};</script></body>`,
        );

      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (err) {
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(err as Error);
      }
      next(err);
    }
  });

  app.listen(port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`access-ready SSR server listening on 0.0.0.0:${port} (base ${basePath})`);
  });
}

createServer();
