import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "/creaturestudio/",
  build: {
    outDir: "dist",
  },
  server: {
    port: 5173,
  },
});
