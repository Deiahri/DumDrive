import { defineConfig } from 'vitest/config';
import path from "path";

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared/src")
    }
  },
  test: {
    'globals': true,
    'setupFiles': './vitest.setup.ts',
    'bail': 1,
    'environment': 'node'
  },
});
