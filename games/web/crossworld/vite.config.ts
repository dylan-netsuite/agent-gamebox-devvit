import { defineConfig } from "vite";
import { devvit } from "@devvit/start/vite";

export default defineConfig({
  plugins: [
    devvit({
      server: { build: { target: "node24" } },
    }),
  ],
});
