import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["electron/main.ts", "electron/preload.ts"],
  format: ["cjs"],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: false,
  target: "node18",
  platform: "node",
  external: ["electron", "better-sqlite3"],
  outDir: "dist/electron",
  env: {
    NODE_ENV: process.env.NODE_ENV ?? "development",
  },
});

