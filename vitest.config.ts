import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "tests/**/*.test.ts"],
    globals: true,
    testTimeout: 15000,
    hookTimeout: 15000,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(import.meta.dirname, './shared'),
      '@server': path.resolve(import.meta.dirname, './server'),
    },
  },
});
