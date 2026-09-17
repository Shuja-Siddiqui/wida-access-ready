import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT ?? "3000");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

const basePath = process.env.BASE_PATH ?? "/";
const apiTarget = (process.env.INTERNAL_PROXY_BASE_URL ?? "http://127.0.0.1:8080").replace(
  "://localhost",
  "://127.0.0.1",
);

export default defineConfig(async ({ command }) => ({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  // Bundle all dependencies into the SSR build (used only when building with
  // `--ssr client/entry-server.tsx --outDir dist/server`) so the production
  // server can run `dist/server/entry-server.js` standalone without caring
  // whether every transitive package is classified as a "dependency" vs
  // "devDependency" — everything the SSR render path needs is inlined at
  // build time. Has no effect on the regular client build.
  //
  // Only applied for `command === "build"`: in dev, the SSR module runner
  // loads modules through Vite's ESM transform pipeline even for CJS
  // packages when `noExternal` forces them to be inlined, which breaks
  // packages like React's dev JSX runtime (`module is not defined`) that
  // rely on being `require()`'d as CJS by Node directly (the default
  // "externalize" behavior in dev).
  ssr: command === "build" ? { noExternal: true } : undefined,
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
}));
