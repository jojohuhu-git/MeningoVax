// ─────────────────────────────────────────────────────────────────────────
// rulebookFooter.js — the footer under the Rulebook screen.
//
// IDENTICAL in PneumoVax and MeningoVax (owner, 2026-11-27: "both should have
// the same footer"). Her wording, given that day in place of the shorter one
// first approved, which MeningoVax's no-semicolon rule (2026-11-20) could not
// carry. Change it in both apps or neither.
// ─────────────────────────────────────────────────────────────────────────

export const FOOTER_TEXT = 'This clinical decision support tool is based on CDC and/or ACIP recommendations. '
  + 'It will also provide suggested guidance for situations not addressed by these organizations. '
  + 'The information contained in this tool should not replace clinical judgement. '
  + 'For questions or issues with this app, reach out to';

export const FOOTER_EMAIL = 'jojohuhu@gmail.com';

/**
 * "Last updated November 27, 2026" — from the date of the latest commit,
 * which vite.config.js reads when the app is built (never typed by hand).
 * Null when there is no build date (a plain node script), so the line is left
 * out rather than guessed.
 */
export function lastUpdatedWords(iso = import.meta.env?.VITE_LAST_UPDATED) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? '')) return null;
  const date = new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric',
  });
  return `Last updated ${date}.`;
}
