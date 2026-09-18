// Test helper (U1, 2026-09-17).
//
// A card's note is `{ lead, detail }`: the card always shows `lead`, and puts
// `detail` behind a "Why this" disclosure. A test that asks "does this card SAY
// such-and-such?" means either half, so it reads the note through here instead
// of reaching for a string field that no longer exists.
//
// Deliberately NOT exported from recommend.js. Nothing in the app should join
// the two halves back into one paragraph — that is the very thing U1 removed.
// Assertions about which half a sentence landed in should read note.lead or
// note.detail directly, not this.
export function noteText(recOrNote) {
  const note = recOrNote && typeof recOrNote === 'object' && 'note' in recOrNote
    ? recOrNote.note
    : recOrNote;
  if (!note) return '';
  return [note.lead, note.detail].filter(Boolean).join(' ');
}
