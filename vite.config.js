import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';

// "Last updated" on the Rulebook footer (owner, 2026-11-27: "make sure to add
// when this app was last updated"): the date of the latest commit, read when
// the app is built, so it is never typed and never goes stale. Falls back to
// today if git is unavailable. Vite hands VITE_* variables to the app as
// import.meta.env.VITE_LAST_UPDATED.
try {
  process.env.VITE_LAST_UPDATED = execSync('git log -1 --format=%cs', { encoding: 'utf8' }).trim();
} catch {
  process.env.VITE_LAST_UPDATED = new Date().toISOString().slice(0, 10);
}

// base is set for GitHub Pages deployment under /MeningoVax/ (must match the
// GitHub repo name exactly — Pages paths are case-sensitive).
// All public asset paths MUST use import.meta.env.BASE_URL.
export default defineConfig({
  base: '/MeningoVax/',
  plugins: [react()],
  test: {
    // Logic tests run in node; UI rendering tests opt into happy-dom per file
    // with `// @vitest-environment happy-dom` at the top.
    environment: 'node',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
    // Agent worktrees live under .claude/worktrees/ and each holds a FULL second
    // copy of src/. Without this, `npx vitest run` from the repo root collects
    // both copies: the count doubles and the copy that is not the project root
    // fails en masse on setup paths, so a perfectly green tree reports ~197
    // failures that mean nothing. Vitest's default exclude covers node_modules
    // and dist, not this.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/worktrees/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/__tests__/**', 'src/test-*.js'],
    },
  },
});
