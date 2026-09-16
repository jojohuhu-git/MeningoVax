// ─────────────────────────────────────────────────────────────────────────
// PENTAVALENT CREDIT (G1, 2026-09-16)
//
// The pentavalents — Penbraya (Pfizer) and Penmenvy (GSK) — are ONE injection
// that is simultaneously a MenACWY dose and a MenB dose. This app records
// MenACWY and MenB history in two separate lists, and both dropdowns offer the
// pentavalents, so a real chart entry lands in one list or the other. Whichever
// list it lands in, both families must be credited.
//
// Source, fetched live 2026-09-16:
//   CDC child/adolescent schedule notes (meningococcal): "Children age 10 years
//   or older may receive a single dose of Penbraya as an alternative to separate
//   administration of MenACWY and MenB when both vaccines would be given on the
//   same clinic day." — https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//   ACIP MMWR 2024;73(15): a healthy adolescent given one pentavalent dose
//   "should complete the MenB series with a dose of MenB-FHbp 6 months after the
//   pentavalent vaccine dose was administered."
//   — https://www.cdc.gov/mmwr/volumes/73/wr/mm7315a4.htm
//
// Owner decision (2026-09-16): ONE row, not two. The entry stays in the list it
// was typed into — so editing or deleting it moves both halves at once — and the
// other family gets a CREDITED COPY at read time, tagged `creditedFrom` so the
// record panel can say where it came from. Dose numbers stay independent per
// family: a pentavalent may be MenACWY dose 3 and MenB dose 1 in the same chart.
//
// Both consumers (the engine in recommend.js and the record panel, which now
// reads the engine's own history result) go through this one function, so the
// two can't drift — the same reason brandRules/seriesTotals exist.
// ─────────────────────────────────────────────────────────────────────────
import { PENTAVALENT_BRANDS } from '../data/brands.js';

const PENTAVALENT_KEYS = PENTAVALENT_BRANDS.map((b) => b.key);

/**
 * True when this brand string names a pentavalent (MenABCWY) product.
 * Accepts either the stored key ('Penbraya') or the full label
 * ('Penbraya (MenABCWY)') — both shapes exist in saved histories and fixtures,
 * the same prefix match `menbFamily()` uses.
 */
export function isPentavalentBrand(brand) {
  if (!brand) return false;
  return PENTAVALENT_KEYS.some((key) => brand.startsWith(key));
}

// Two rows describe the same injection when the brand and the date match. An
// undated pentavalent in each list is the same shot recorded twice, too: a
// patient with two genuinely different undated pentavalent doses would have both
// rows in one list, and the surplus rule below still credits the second one.
const sameShotKey = (dose) => `${dose.brand}|${dose.date || ''}`;

// Drop empty slots without handing back a new array when there weren't any —
// an untouched history should come out of this module as the very same array.
function compact(list) {
  const arr = list ?? [];
  return arr.every(Boolean) ? arr : arr.filter(Boolean);
}

function creditInto(target, source, sourceName) {
  const alreadyHere = new Map();
  for (const dose of target) {
    if (!isPentavalentBrand(dose?.brand)) continue;
    const key = sameShotKey(dose);
    alreadyHere.set(key, (alreadyHere.get(key) ?? 0) + 1);
  }

  const credited = [];
  for (const dose of source) {
    if (!isPentavalentBrand(dose?.brand)) continue;
    const key = sameShotKey(dose);
    const seen = alreadyHere.get(key) ?? 0;
    if (seen > 0) {
      // The user recorded this same shot in both lists. Count it once.
      alreadyHere.set(key, seen - 1);
      continue;
    }
    credited.push({ ...dose, creditedFrom: sourceName });
  }

  // Same array back when nothing was credited, so an untouched history keeps its
  // identity for React and for callers comparing references.
  return credited.length === 0 ? target : [...target, ...credited];
}

/**
 * creditPentavalents(menacwyDoses, menbDoses)
 *
 * @returns {{menacwy: Array, menb: Array}} the two histories as the engine and
 *   the record panel should read them: every pentavalent present in both, each
 *   credited copy tagged `creditedFrom: 'MenACWY' | 'MenB'`. Order is not
 *   significant — analyzeHistory() sorts chronologically before it walks.
 */
export function creditPentavalents(menacwyDoses = [], menbDoses = []) {
  const acwy = compact(menacwyDoses);
  const menb = compact(menbDoses);
  return {
    menacwy: creditInto(acwy, menb, 'MenB'),
    menb: creditInto(menb, acwy, 'MenACWY'),
  };
}
