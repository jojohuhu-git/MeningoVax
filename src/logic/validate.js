// ─────────────────────────────────────────────────────────────────────────
// validate.js — dose-history validation layer for MeningoVax.
//
// Pure functions. Given a vaccine's recorded dose history, age, risk IDs, and
// a reference date, provides:
//
//   analyzeHistory(vaccine, doses, ageMonths, riskIds, today)
//     → { perDose: [...], effective: [...] }
//
//   perDose — parallel to input doses. Each entry:
//     { status: 'valid'|'invalid'|'unknown', effectiveDoseNum: number|null,
//       reasons: string[], detail?: string, doesNotCount?: true }
//
//   effective — the kept (valid + unknown) doses in chronological order.
//     These are what the recommendation engine should count.
//
//   validateHistory(vaccine, doses, ageMonths, riskIds, today)
//     → Array<{status, reasons, detail?}>   (backward-compat — same as perDose
//       but without effectiveDoseNum/doesNotCount; callers that only need the
//       display-only result can still use this.)
//
// Design: mirrors vaxapp's validatedHistory() last-kept walk. Each dose is
// validated against the KEPT list so far, not the raw list. This prevents
// false "interval too short" cascades when an earlier dose is dropped (e.g.
// if D1 is invalid, D2 is re-evaluated as effective D1 — not flagged as
// "too soon after D1").
//
// Counting policy (ACIP):
//   - Invalid dose → dropped; does NOT count. Message: "does not count —
//     repeat this dose only, do not restart the series."
//   - Unknown (no date) → COUNTS; is not a timing anchor for later doses.
//   - MenB family mismatch (4C vs FHbp) → invalid → does not count. Only
//     checked when BOTH brands are known.
//   - MenB healthy D2 given <6 months after D1 → VALID (counts); rescue
//     dose path fires in the engine. NOT dropped.
//
// Sources:
//   • ACIP 2020 MMWR (RR-9): meningococcal schedule — doi:10.15585/mmwr.rr6909a1
//   • CDC adult meningococcal schedule notes:
//       https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html
//   • CDC child/adolescent meningococcal notes:
//       https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening
//   • CDC MenB child notes:
//       https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b
//   • immunize.org Ask the Experts:
//       https://www.immunize.org/ask-experts/meningococcal-vaccines/
//   • Penmenvy MMWR 2025: https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm
//   • Penbraya MMWR 2023: https://www.cdc.gov/mmwr/volumes/73/wr/mm7315a4.htm
// ─────────────────────────────────────────────────────────────────────────
//
// Port Phase 2.1 (2026-11-15): THE RULES THEMSELVES LIVE IN `doseRules.js`,
// one row per rule, each row stating its schedule, what it is measured from,
// what happens to a dose it catches, whether the 4-day grace applies, and who
// the code says it comes from. This file is the WALK: it decides which doses
// have counted so far, hands each dose to `judgeDose()` once, and applies the
// series cap afterwards. A rule added here instead of to the table is a rule
// no table test can see — add a row.

import { menacwyRiskClass, menacwyInfantSeriesIndicated, hasMenbRisk } from '../data/riskFactors.js';
import { menacwySeriesInfo, menbSeriesInfo } from './seriesTotals.js';
import { todayISO } from './dateUtils.js';
import { doseAnswerKey, dropBlankDoseRows } from './doseIdentity.js';
import { judgeDose, doseContext } from './doseRules.js';

// Re-exported: display surfaces (the record panel, the compliance audit
// table) import it from here.
export { ageAtDoseFromDate } from './doseRules.js';

// ── Core walk: last-kept algorithm ───────────────────────────────────────
//
// This is the single source of truth for BOTH display results AND the
// effective dose list that the engine consumes.
//
// Walk order: chronological (input order assumed already sorted).
// For each dose:
//   1. Validate against the KEPT list so far (not the full raw list).
//   2. If valid or unknown → keep (counts toward series).
//   3. If invalid → drop (does not count; mark as doesNotCount=true in perDose).
// The effective count advances ONLY on kept doses, so a dose that follows a
// dropped one is re-evaluated at the correct effective position.
//
function runWalk(vaccine, rawDoses, ageMonths, riskIds, today, riskAtDoseAnswers, dob) {
  const kept = [];           // doses kept so far (the "effective" list being built)
  const perDose = [];        // one entry per raw dose (display results)
  let effectiveCount = 0;    // number of kept doses so far (including unknown)
  // Which table row decided each raw dose (doseRules.js ids; null = no row
  // spoke and the dose simply counts). Parallel to perDose. Read by
  // dose-rules-table.test.js; nothing on screen uses it yet.
  const decidedBy = [];

  for (let rawIdx = 0; rawIdx < rawDoses.length; rawIdx++) {
    const dose = rawDoses[rawIdx];
    // G2: keyed by the dose's own id when it has one, falling back to its
    // position for hand-built fixtures. See doseIdentity.js.
    const riskAnswer = riskAtDoseAnswers?.[doseAnswerKey(dose, rawIdx)];

    // Judge this dose against the current kept list: one call, one table
    // (doseRules.js). The record problems (future date, before birth, entered
    // twice) are the table's first rows, so they are settled before any
    // vaccine rule runs — there is no dose to grade when the date is wrong.
    const { result, ruleId } = judgeDose(doseContext({
      vaccine, dose, effectiveIdx: effectiveCount, kept, ageMonths, riskIds, today, riskAnswer, dob,
    }));
    decidedBy.push(ruleId);

    if (result.status === 'pending') {
      // Awaiting a risk-at-dose answer from the provider. Conservative default
      // while pending: not added to kept, does not advance the effective count.
      perDose.push({
        ...result,
        effectiveDoseNum: null,
      });
    } else if (result.status === 'invalid') {
      // Dropped. Record as doesNotCount with advice to repeat only this dose.
      perDose.push({
        ...result,
        effectiveDoseNum: null,
        doesNotCount: true,
        reasons: result.recordProblem
          // G3: the entry is wrong, not the vaccination — see recordProblemResult.
          ? result.reasons
          : [
            ...result.reasons,
            'This dose does not count toward the series: repeat this dose only (do not restart the series).',
          ],
      });
      // Do NOT add to kept; do NOT increment effectiveCount.
    } else if (result.notAdolescentCount) {
      // A3: a valid dose given before age 10 — does not advance the
      // adolescent series count, but it is NOT invalid and does NOT need to
      // be repeated. Excluded from `kept` (like invalid) but display-distinct.
      perDose.push({
        ...result,
        effectiveDoseNum: null,
      });
      // Do NOT add to kept; do NOT increment effectiveCount.
    } else {
      // Valid or unknown → tentatively keep, then apply the F2/F3 series-total
      // cap: a dose past the schedule's primary total, on a schedule with no
      // ongoing booster phase (routine MenACWY, single-dose MenACWY exposure
      // indications, healthy MenB), is an extra dose — safely given, but it
      // doesn't extend the series and must not be numbered against it (the
      // reported bug: "Dose 3 of 1"). Schedules WITH an ongoing booster phase
      // (high-risk MenACWY/MenB, MenACWY travel/microbiologist, MenACWY
      // infant high-risk) are never capped here — see seriesTotals.js.
      const candidateKept = [...kept, dose];
      const seriesInfo = vaccine === 'MenACWY'
        ? menacwySeriesInfo({ riskClass: menacwyRiskClass(riskIds), am: ageMonths, doses: candidateKept, today, dob, infantSeries: menacwyInfantSeriesIndicated(riskIds) })
        : menbSeriesInfo({ highRisk: hasMenbRisk(riskIds), doses: candidateKept });
      const isExtra = !seriesInfo.hasBoosterPhase
        && seriesInfo.total != null
        && candidateKept.length > seriesInfo.total;

      if (isExtra) {
        // G6 (2026-09-16, owner decision): ASK, don't assert — but only for an
        // UNDATED row. A dose with no date cannot be placed in time, so the app
        // cannot tell a genuine extra dose from an ordinary series dose whose
        // date is missing, and old paper records routinely carry several
        // undated doses. On a healthy 17-year-old the assertion also
        // contradicts the card it sits on, which says the age-16 booster is
        // still due: the series cannot be both complete and owed a dose.
        //
        // A DATED dose that genuinely exceeds the total keeps the assertion —
        // there the app really does know (several regression tests pin it).
        //
        // The question needs no answer stored: an extra dose is excluded from
        // `kept`, so the engine never sees this row and the recommendation is
        // identical with or without it. Nothing downstream depends on which
        // reading is true, which is why this is wording rather than state.
        //
        // The undated reasons are REPLACED, not appended to: the base sentence
        // for an undated dose ends "Dose is counted in the series", which would
        // sit directly above a line saying it is not counted.
        const undatedExtra = !dose.date;
        decidedBy[decidedBy.length - 1] = 'SERIES-CAP-EXTRA-DOSE';
        perDose.push({
          ...result,
          effectiveDoseNum: null,
          extraDose: true,
          ...(undatedExtra ? { extraDoseUnverified: true } : {}),
          reasons: undatedExtra
            ? [
              'No date recorded, so this dose cannot be placed in time.',
              // Deliberately says nothing about the series being COMPLETE.
              // The cap that lands a row here is a counting rule, not a verdict
              // on the patient: a healthy 17-year-old with two undated MenACWY
              // doses is capped at a 1-dose total while the card above still
              // says the age-16 booster is due. Claiming completeness here
              // would contradict the card the row sits in. (Live-observed
              // 2026-09-16; raised separately — the cap itself is not G6's.)
              'Do you mean this was an extra dose given? With no date recorded, the app cannot tell whether this is a dose beyond the series or a series dose whose date is missing, so it is not counted. Whichever it is, the recommendation above is the same with or without this row. Adding the date settles it.',
            ]
            : [
              ...result.reasons,
              `Given after the ${seriesInfo.total}-dose series was already complete: this dose does not extend the series.`,
            ],
        });
        // Do NOT add to kept; do NOT increment effectiveCount.
      } else {
        effectiveCount++;
        const effectiveDoseNum = effectiveCount;

        // If raw index > effective index, this dose was renumbered upward.
        const wasRenumbered = rawIdx > effectiveCount - 1;
        const renumberNote = wasRenumbered
          ? `After excluding the dose(s) above that don't count, this counts as effective dose ${effectiveDoseNum}.`
          : null;

        const augmentedReasons = renumberNote
          ? [...result.reasons, renumberNote]
          : result.reasons;

        perDose.push({
          ...result,
          reasons: augmentedReasons,
          effectiveDoseNum,
        });
        kept.push(dose);
      }
    }
  }

  return { perDose, effective: kept, decidedBy };
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * analyzeHistory(vaccine, doses, ageMonths, riskIds, today)
 *
 * Single-walk validator. Returns BOTH a display result array and the
 * effective (kept) dose list for the engine to consume.
 *
 * @param {'MenACWY' | 'MenB'} vaccine
 * @param {Array<{date?: string, brand?: string}>} doses
 * @param {number} ageMonths  — current patient age in months
 * @param {string[]} riskIds  — selected risk-factor IDs
 * @param {string} [today]    — ISO date string; defaults to today's date
 * @param {Object.<string|number, 'yes'|'no'|'unsure'>} [riskAtDoseAnswers] —
 *   provider answers to the risk-at-dose prompt, keyed by each dose's own
 *   `id` (G2). Doses built without an id fall back to their index in the
 *   chronologically-sorted list — the index used by `sortedDoses`/`perDose`.
 *
 * @returns {{
 *   perDose: Array<{status, effectiveDoseNum, reasons, detail?, doesNotCount?, needsInput?, promptDate?}>,
 *   effective: Array<{date?, brand?}>,
 *   sortedDoses: Array<{date?, brand?}>
 * }}
 */
export function analyzeHistory(vaccine, doses, ageMonths, riskIds = [], today, riskAtDoseAnswers, dob) {
  // todayISO(), not new Date().toISOString() — the latter is UTC and can be a
  // day ahead of the caller's local date (e.g. any evening in a UTC-behind
  // timezone), which breaks the exact cancellation ageAtDoseFromDate relies on
  // when the caller's ageMonths was itself derived from a local "today".
  const ref = today || todayISO();
  // Sort chronologically before the last-kept walk. The walk and the engine both assume
  // ascending order (dose numbering, interval anchoring, MenB family lock on the first
  // kept dose), so doses entered out of order must be re-sorted. Dated doses ascending;
  // undated doses sort FIRST (they count but are never a timing anchor, and an undated
  // historical dose is assumed to be the earlier dose — matching existing convention).
  // K1 (2026-09-24): drop rows the clinician added but never typed into. The
  // filter used to be `.filter(Boolean)`, which removed only null/undefined,
  // so an empty row reached the walk and was graded as a dose of unknown
  // date. Sweeping those rows out of state when the user leaves a list is not
  // enough on its own: the Results "Recorded doses" panel recalculates live,
  // so a just-added blank row is already changing the answer on screen with
  // no "leaving" moment to sweep at.
  const filtered = sortDosesChronologically(dropBlankDoseRows(doses));
  if (filtered.length === 0) return { perDose: [], effective: [], sortedDoses: [], decidedBy: [] };
  const firstPass = runWalk(vaccine, filtered, ageMonths, riskIds, ref, riskAtDoseAnswers, dob);

  // G8 (2026-09-16): a row with NO date must never take the place of a dose
  // that has one. Undated rows sort first (above), so on a schedule with a
  // series cap they fill the slots first and a DATED dose arriving later is
  // the one thrown out as "extra" — the app then recommended a booster the
  // patient demonstrably had, because a blank date field somewhere else in
  // the record had claimed its place.
  //
  // The cap can only be judged once the walk has run, so this is decided by
  // re-walking rather than by guessing an order up front: if the first pass
  // dropped a DATED dose as an extra while an undated row was kept, walk
  // again with the dated doses first. Each pass stays internally consistent
  // (the alternative — reaching back into the finished pass to evict a row —
  // would leave the earlier doses graded at positions they no longer hold).
  const datedDoseDropped = firstPass.perDose.some((p, i) => p.extraDose && filtered[i]?.date);
  const undatedRowKept = firstPass.effective.some((d) => !d.date);
  if (datedDoseDropped && undatedRowKept) {
    const datedFirst = [
      ...filtered.filter((d) => d.date),
      ...filtered.filter((d) => !d.date),
    ];
    return { ...runWalk(vaccine, datedFirst, ageMonths, riskIds, ref, riskAtDoseAnswers, dob), sortedDoses: datedFirst };
  }
  return { ...firstPass, sortedDoses: filtered };
}

// Chronological, stable sort. ISO date strings compare lexicographically. Undated doses
// sort before all dated doses, preserving their relative input order.
// Exported because the MenB family-lock note in DoseEditor has to pick the same
// "first dose in the series" this walk does — two copies of the ordering rule is
// how the note and the engine would end up naming different families.
export function sortDosesChronologically(doses) {
  return doses
    .map((d, i) => ({ d, i }))
    .sort((a, b) => {
      const da = a.d?.date || '';
      const db = b.d?.date || '';
      if (da && db) return da < db ? -1 : da > db ? 1 : a.i - b.i;
      if (!da && db) return -1; // undated sorts before dated
      if (da && !db) return 1;
      return a.i - b.i;         // both undated → stable input order
    })
    .map((x) => x.d);
}

/**
 * validateHistory(vaccine, doses, ageMonths, riskIds, today)
 *
 * Backward-compatible wrapper. Returns the perDose array from analyzeHistory.
 * Callers that only need the display results (e.g. RecCard) can continue
 * using this signature unchanged.
 *
 * @param {'MenACWY' | 'MenB'} vaccine
 * @param {Array<{date?: string, brand?: string}>} doses
 * @param {number} ageMonths
 * @param {string[]} riskIds
 * @param {string} [today]
 *
 * @returns {Array<{status: 'valid'|'invalid'|'unknown', reasons: string[], detail?: string}>}
 */
export function validateHistory(vaccine, doses, ageMonths, riskIds = [], today, riskAtDoseAnswers, dob) {
  return analyzeHistory(vaccine, doses, ageMonths, riskIds, today, riskAtDoseAnswers, dob).perDose;
}
