// ─────────────────────────────────────────────────────────────────────────
// noteFold.js — Port Phase 6.3, Q10 (OWNER DECISIONS 2026-11-19): what a
// card's note shows before a click, and what waits behind "Why this".
// Brought over from PneumoVax's file of the same name (its §WORD-1).
//
// Why: the card's heading already says what the note's first line says
// ("Dose 2 of 2 (high-risk primary series)" over "The second dose of the
// high-risk primary series, at least 8 weeks after dose 1."). Measured over the
// 18,780 saved patients (docs/archive/report-2026-11-19-result-page-fold.md):
// 87% of card lines repeat their heading.
//
// This is the one place that decides which sentences stay in view. It runs
// once, as the last step of `recommend()`, so `note.lead` keeps meaning "what
// shows". The engine's own steps, and its look-ahead runs, use
// `recommendBeforeFold` and never see a folded note. No component selects a
// clinical sentence.
//
// Nothing is deleted. A sentence either stays in `lead` or moves to the front
// of `detail`, carrying its own [c] with it.
//
// Adding a sentence the clinician must see without a click: add a rule here,
// and a line to the guard, regression-2026-11-19-q10-result-page-fold.test.js.

// A card that is shut by default keeps its note whole: its one line IS the
// note once opened (PneumoVax's rule). In MeningoVax those are the neutral
// cards with no booster date (RecCard.jsx `collapsible`).
const NEUTRAL = new Set(['complete', 'not-indicated', 'deferred']);
const shutByDefault = (card) => NEUTRAL.has(card.status) && !card.boosterDueDate;

// The owner's list, 2026-11-19 ("Yes, that list"). The pentavalent card's line
// and "MenB is optional today" are on it too: the pentavalent note is not a
// card note and is never folded (see foldResult).
export const STAY_IN_VIEW = Object.freeze([
  { why: 'A second option, with its own date (owner D-switch line, 2026-11-17)', re: /^Or finish with \S+ instead\b/ },
  { why: 'The minimum beside a routine date: both numbers go on the card (owner STOP F1, 2026-11-17; PneumoVax C10-2)', re: /^It can be given (today|from) .*\bif needed\b/ },
  { why: 'Says why the date is later than expected', re: /^It can be given once \d+ weeks? have passed since that dose\b/ },
  { why: 'A date tied to a dose that did not count', re: /^Not before .*\bwhich did not count\.$/ },
]);

const markers = (s) => (s.match(/\[c\]/g) ?? []).length;

// Sentences: a full stop followed by a space and a capital. "N. meningitidis"
// is not cut (lower-case after it); a [c] before the full stop stays with its
// sentence ("indication [c].").
export function sentencesOf(text) {
  return (text ?? '').trim().split(/(?<=\.)\s+(?=[A-Z])/).filter(Boolean);
}

export const staysInView = (sentence) => STAY_IN_VIEW.some(({ re }) => re.test(sentence));

export function foldCard(card) {
  if (!card?.note || typeof card.note !== 'object' || shutByDefault(card)) return card;
  const { note } = card;
  const cites = card.noteCites ?? [];
  let at = 0;
  const parts = sentencesOf(note.lead).map((text) => {
    const n = markers(text);
    at += n;
    return { text, cites: cites.slice(at - n, at), stays: staysInView(text) };
  });
  // Nothing changes place: leave the card exactly as the engine wrote it.
  if (parts.every((p) => p.stays)) return card;
  const kept = parts.filter((p) => p.stays);
  const folded = parts.filter((p) => !p.stays);
  const join = (list) => list.map((p) => p.text).join(' ');
  return {
    ...card,
    note: {
      ...note,
      lead: join(kept),
      detail: [join(folded), note.detail].filter(Boolean).join(' '),
    },
    // One ordered list across lead then detail (RecNote's contract): the kept
    // sentences' markers first, then the folded ones', then the detail's own.
    noteCites: [...kept.flatMap((p) => p.cites), ...folded.flatMap((p) => p.cites), ...cites.slice(at)],
  };
}

/** The whole result, folded: every MenACWY and MenB card. */
export function foldResult(result) {
  if (!result || result.excluded) return result;
  return {
    ...result,
    menacwy: (result.menacwy ?? []).map(foldCard),
    menb: (result.menb ?? []).map(foldCard),
  };
}
