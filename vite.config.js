import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base is set for GitHub Pages deployment under /meningovax/.
// All public asset paths MUST use import.meta.env.BASE_URL.
export default defineConfig({
  base: '/meningovax/',
  plugins: [react()],
  test: {
    // Logic tests run in node; UI rendering tests opt into happy-dom per file
    // with `// @vitest-environment happy-dom` at the top.
    environment: 'node',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
  },
});
