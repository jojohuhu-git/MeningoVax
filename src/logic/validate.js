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
//   - No date → NOT counted (STOP C C1, 2026-11-15: ACIP accepts only written,
//     dated records). Kept on the record and shown, graded like a record
//     problem: no "repeat" advice, never a timing anchor.
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
  // RULING D (STOP C C2, 2026-11-15): the clock for the next dose. The last
  // DATED dose actually given — counted, or not counted because it was given
  // too soon or too young — so a repeat is timed from the dose that failed,
  // not from the last one that counted. Never a record problem (no dose was
  // given), never a set-aside, pending or extra dose (those are not repeats),
  // and never a wrong-family MenB dose (owner, E2: that dose sets only the
  // 4-week floor below, not the schedule's clock).
  let anchor = null;
  // E2: the last dated MenB dose given that did not count, wrong family
  // included — the start of ACIP's "4 weeks between any 2 doses" when a dose
  // must be repeated. Cleared once a later dose counts.
  let lastUncounted = null;

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
      anchor, lastUncounted,
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
      if (dose.date && !result.recordProblem) {
        if (!result.wrongFamily) anchor = dose;
        lastUncounted = dose;
      }
    } else if (result.notAdolescentCount) {
      // A3: a valid dose given before age 10 — does not advance the
      // adolescent series count, but it is NOT invalid and does NOT need to
      // be repeated. Excluded from `kept` (like invalid) but display-distinct.
      perDose.push({
        ...result,
        effectiveDoseNum: null,
      });
      // Do NOT add to kept; do NOT increment effectiveCount.
      // D2 (owner, 2026-11-17): a set-aside MenACWY dose was still given, so
      // it starts the 8-week clock (ACIP 2020: "as long as a minimum interval
      // of 8 weeks between doses is maintained"). The next dose's gap rows
      // and the card's repeat floor read it. MenB set-aside doses: not asked.
      if (vaccine === 'MenACWY' && dose.date) {
        anchor = dose;
        lastUncounted = dose;
      }
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
        // A dose past the series total on a schedule with no booster phase.
        // Only a DATED dose can land here: since STOP C C1 (2026-11-15) an
        // undated dose never counts, so the G6 "Extra dose? — no date" wording
        // and the G8 re-walk (an undated row taking a dated dose's slot) have
        // nothing left to catch and were removed with it.
        decidedBy[decidedBy.length - 1] = 'SERIES-CAP-EXTRA-DOSE';
        perDose.push({
          ...result,
          effectiveDoseNum: null,
          extraDose: true,
          reasons: [
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
        if (dose.date) {
          anchor = dose;
          lastUncounted = null;
        }
      }
    }
  }

  // `anchor` / `lastUncounted` after the last dose: what the card times the
  // NEXT dose from (recommend.js reads them; never recomputes them).
  return {
    perDose, effective: kept, decidedBy,
    anchorDate: anchor?.date ?? null,
    uncountedDate: lastUncounted?.date ?? null,
  };
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
  // undated doses sort FIRST (since STOP C C1 they never count and never start a clock,
  // so where they sit changes no answer; first keeps the record panel's order stable).
  // K1 (2026-09-24): drop rows the clinician added but never typed into. The
  // filter used to be `.filter(Boolean)`, which removed only null/undefined,
  // so an empty row reached the walk and was graded as a dose of unknown
  // date. Sweeping those rows out of state when the user leaves a list is not
  // enough on its own: the Results "Recorded doses" panel recalculates live,
  // so a just-added blank row is already changing the answer on screen with
  // no "leaving" moment to sweep at.
  const filtered = sortDosesChronologically(dropBlankDoseRows(doses));
  if (filtered.length === 0) return { perDose: [], effective: [], sortedDoses: [], decidedBy: [], anchorDate: null, uncountedDate: null };
  return { ...runWalk(vaccine, filtered, ageMonths, riskIds, ref, riskAtDoseAnswers, dob), sortedDoses: filtered };
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
