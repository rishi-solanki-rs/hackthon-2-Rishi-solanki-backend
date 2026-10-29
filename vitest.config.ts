import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    // Keep the suite deterministic and offline: never call the live Gemini API from tests
    env: {
      GEMINI_ENABLED: 'false',
      MONGODB_URI: '',
    },
  },
  resolve: {
    alias: {
      '@sidekit/shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
