import { createRoot, hydrateRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { DEFAULT_THEME, isThemeId, THEME_STORAGE_KEY } from "@/lib/themes";
import type { InitialAuth } from "@/contexts/user-context";

// No-flash init: pick the saved theme (any registered theme) before React mounts.
const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialTheme = isThemeId(stored) ? stored : prefersDark ? "dark" : DEFAULT_THEME;
document.documentElement.dataset.theme = initialTheme;

const queryClient = new QueryClient();

declare global {
  interface Window {
    __REACT_QUERY_STATE__?: unknown;
    __INITIAL_AUTH__?: InitialAuth;
  }
}

const rootEl = document.getElementById("root")!;
const dehydratedState = window.__REACT_QUERY_STATE__;
delete window.__REACT_QUERY_STATE__;
const initialAuth = window.__INITIAL_AUTH__;
delete window.__INITIAL_AUTH__;

const app = (
  <App
    queryClient={queryClient}
    dehydratedState={dehydratedState as never}
    initialAuth={initialAuth}
  />
);

// Pages the server rendered (`/` and `/billing`) ship with markup already in
// `#root` plus a serialized query cache, so we hydrate in place. Every other
// route was served as an empty SPA shell (unchanged from before this app had
// a server at all), so we mount fresh as a normal client-side render.
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, app);
} else {
  createRoot(rootEl).render(app);
}
