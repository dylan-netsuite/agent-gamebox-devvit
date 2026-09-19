import { defineConfig } from "vite";
import { devvit } from "@devvit/start/vite";

/**
 * Client assets ship under stable names (game.js, game.html), so a webview can
 * serve a cached copy after a new version is installed. Stamping the build into
 * the bundle makes "am I actually running the new build?" answerable from the
 * footer instead of by guesswork.
 */
const BUILD_STAMP = new Date()
  .toISOString()
  .slice(5, 16)
  .replace("T", " ")
  .replace("-", "/");

export default defineConfig({
  define: { __BUILD_STAMP__: JSON.stringify(BUILD_STAMP) },
  plugins: [
    devvit({
      server: { build: { target: "node24" } },
    }),
  ],
});
