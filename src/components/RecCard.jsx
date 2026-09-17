import React, { useState } from 'react';
import { fmtDate, fmtAgeMonths, stripAntigen } from '../logic/format.js';
import { ageAtDoseFromDate } from '../logic/validate.js';
import { todayISO } from '../logic/dateUtils.js';
import { Chevron } from './icons.jsx';
import { doseAnswerKey } from '../logic/doseIdentity.js';

// C3 (2026-07-23 handoff): self-describing pills that state WHEN and WHAT
// instead of a terse status word that needed a legend to decode (the legend
// was removed in C1). Owner-approved vocabulary:
//   due today, boosters follow      -> "Dose due today, future boosters needed"
//   due today, no boosters          -> "Dose due today"
//   behind schedule                 -> "Catch-up dose due today"
//   series done, booster due today  -> "Booster due today"
//   series done, booster in future  -> "Future booster needed"
//   optional (MenB 16-23y)          -> "Optional today - shared decision"
//   nothing left                    -> "Up to date"
//   not indicated for this patient  -> "Not needed"
//   MenB in pregnancy               -> "Deferred in pregnancy"
// Derived from rec fields already on the object (status, dueToday,
// boosterDueDate, boosterSummary) plus a doseNum > seriesTotal comparison
// to tell a primary/catch-up dose apart from a booster dose -- no new
// engine field needed, since seriesTotal already excludes boosters (C2).
// P1-4 (2026-09-15, owner decision): while any recorded dose is still waiting
// on its risk-timing answer, this card must not state a recommendation. The
// conservative maths (a pending dose does not count) is right, but presenting
// it as a confident "Dose due today" is how a clinician ends up vaccinating an
// already fully vaccinated child -- the reported case showed "Dose 1 of 2
// (high-risk primary series), due today" for a child with five doses on record,
// with the five unanswered questions further down the page.
//
// The questions themselves live INSIDE this card, in the recorded-dose list, so
// the card is NOT hidden -- only the parts that assert an answer: the status
// pill, the dose label, and the brand list ("give one of these now"). The
// record and its prompts stay, and the real recommendation appears the moment
// the last question is answered.
export function hasPendingDoses(doseValidations) {
  return (doseValidations || []).some((v) => v?.status === 'pending');
}

function statusPillLabel(rec, pending) {
  // "Answers needed", not "Needs input": the per-dose chip already says "Needs
  // input", and two identical labels at two levels leaves the clinician asking
  // which input is meant. This one names the card's state; the chips name the
  // individual doses that are waiting.
  if (pending) return 'Answers needed';
  const { status, dueToday, doseNum, seriesTotal, boosterDueDate, boosterSummary } = rec;

  if (status === 'deferred') return 'Deferred in pregnancy';
  if (status === 'not-indicated') return 'Not needed';
  if (status === 'complete') return boosterDueDate ? 'Future booster needed' : 'Up to date';
  if (status === 'catchup') return 'Catch-up dose due today';
  if (status === 'shared-decision') return dueToday ? 'Optional today - shared decision' : 'Up to date';

  // 'due' / 'risk-based' / 'exposure': a dose is being recommended now.
  if (!dueToday) return 'Up to date';
  const isBooster = doseNum != null && seriesTotal != null && doseNum > seriesTotal;
  if (isBooster) return 'Booster due today';
  return boosterSummary ? 'Dose due today, future boosters needed' : 'Dose due today';
}

// One recorded past dose → "D1 · Jul 3, 2025 · age 11 years 2 months · Bexsero"
// D3: age at administration lets a clinician compare a recorded dose's timing
// against the recommendation, not just its date.
//
// G1 (2026-09-16): a pentavalent (Penbraya/Penmenvy) is one injection that counts
// in both families, and it is only ever typed into one of the two history lists.
// The copy that appears in the other family's record says where it was typed, so
// a clinician who counts the rows against the paper chart isn't left wondering
// where a dose they never entered here came from — and knows to edit it on the
// step that owns it.
function describeDose(dose, idx, ageMonths, today) {
  const parts = [`D${idx + 1}`];
  parts.push(dose?.date ? fmtDate(dose.date) : 'date unknown');
  const ageAtDose = dose?.date ? ageAtDoseFromDate(dose, ageMonths, today) : null;
  parts.push(ageAtDose != null ? `age ${fmtAgeMonths(ageAtDose)}` : 'age unknown');
  parts.push(dose?.brand ? stripAntigen(dose.brand) : 'brand unknown');
  if (dose?.creditedFrom) {
    parts.push(`one shot covering both — recorded under ${dose.creditedFrom}`);
  }
  return parts.join(' · ');
}

// Render a small status chip + reasons for a single recorded dose.
// result now optionally carries effectiveDoseNum, doesNotCount, and
// notAdolescentCount (A3) from analyzeHistory.
//
// Chip vocabulary (owner-agreed design, 2026-07-23 handoff, C2 revision):
//   Dose N of M (green) — a valid dose that advances this patient's series;
//     N is this dose's position (effectiveDoseNum), M is the primary-series
//     total (seriesTotal from recommend.js — boosters are NOT counted in M).
//     Replaces the old two-chip "Counts" + "Effective dose N" pairing.
//   Off-window - repeat (amber) — safely given, but doesn't advance this
//     patient's series. Clinical rationale goes in the reasons text beside
//     the chip, not the label itself.
//   Invalid (red) — a true error: below the product floor, incompatible
//     MenB antigen family, or a spacing violation. Disregard the dose.
//   Unknown (gray) — no date; can't verify.
//   Needs input (gray, interactive) — a PENDING state on doses where whether
//     the patient was high-risk on that date is unknown and decisive. The
//     provider's answer resolves it live to Dose N of M/Off-window.
// Interleave "Primary series" / "Boosters" headings into the recorded-dose
// list (owner decision 2026-09-15, option A). `primaryTotal` is where the
// primary series ends; anything counted past it is a booster.
//
// A dose that does NOT count (off-window, invalid, unknown) has no effective
// dose number, so it cannot name its own phase. It stays in DATE order inside
// whichever group is currently open rather than being moved to a group of its
// own — a failed attempt at dose 2 belongs beside dose 2 in the record, and
// re-ordering it would stop the list lining up against the paper chart.
//
// A non-counting dose recorded BEFORE any counting dose (an obsolete product,
// say) sits above the first heading, which is correct: it precedes the series.
export function doseRowsWithGroups(doses, doseValidations, primaryTotal) {
  const rows = [];
  let openGroup = null;
  doses.forEach((d, i) => {
    const n = doseValidations?.[i]?.effectiveDoseNum;
    if (primaryTotal != null && n != null) {
      const phase = n <= primaryTotal ? 'primary' : 'booster';
      if (phase !== openGroup) {
        rows.push({ kind: 'group', phase, label: phase === 'primary' ? 'Primary series' : 'Boosters' });
        openGroup = phase;
      }
    }
    rows.push({ kind: 'dose', dose: d, index: i });
  });
  return rows;
}

// G4 (2026-09-16): one numbering sequence per CARD, not per block. The card's
// note and the verdicts on its recorded doses both carry superscripts, so
// numbering them separately would put two different [1]s in one card whenever
// they cite different documents. The map is pre-seeded here, in the order the
// reader meets them (recorded doses top to bottom, then the note), because
// React runs a child component's body after its parent's — seeding on first
// render would number the note before the verdicts above it.
function cardCiteNumberer(doseValidations, noteCites) {
  const numberFor = makeCiteNumberer();
  for (const v of doseValidations || []) {
    for (const c of v?.reasonCites || []) numberFor(c.page ?? c.key);
  }
  for (const c of noteCites || []) numberFor(c.page ?? c.key);
  return numberFor;
}

function DoseValidation({ result, seriesTotal, onAnswer, wasPrompted, doseDate, numberFor }) {
  const [editing, setEditing] = useState(false);
  if (!result) return null;
  const { status, reasons, detail, reasonCites, effectiveDoseNum, doesNotCount, notAdolescentCount, needsInput, promptDate, extraDose, extraDoseUnverified, recordProblem } = result;

  // Item 2 (2026-07-23 handoff): once answered, the validator's result no
  // longer carries needsInput/promptDate (see validate.js), so re-opening the
  // prompt falls back to this dose's own recorded date instead.
  if (status === 'pending' || editing) {
    return (
      <div className="dose-val dose-val-pending" data-testid="dose-val-pending">
        <span className="dose-val-chip dose-val-needs-input">Needs input</span>
        {showReasonsBlock(reasons, null, reasonCites, numberFor)}
        <div className="risk-at-dose-prompt" data-testid="risk-at-dose-prompt">
          <div className="risk-at-dose-question">
            Was this patient at high risk for meningococcal disease when this dose was given ({fmtDate(promptDate ?? doseDate)})?
          </div>
          <div className="risk-at-dose-actions">
            <button type="button" className="btn btn-outline btn-small" onClick={() => { onAnswer?.('yes'); setEditing(false); }}>Yes</button>
            <button type="button" className="btn btn-outline btn-small" onClick={() => { onAnswer?.('no'); setEditing(false); }}>No</button>
            <button type="button" className="btn btn-outline btn-small" onClick={() => { onAnswer?.('unsure'); setEditing(false); }}>Not sure</button>
          </div>
        </div>
      </div>
    );
  }

  // F5 (2026-09-14 dose-counter handoff): 'Counts' was a catch-all fallback
  // for states nobody enumerated — this app's own old dead wording (already
  // removed everywhere else, C2 2026-07-24). Every case below now has an
  // engine-named state and an explicit label:
  //   Dose N of M   — a valid dose within the primary series total.
  //   Booster       — a valid dose past the total on a schedule with an
  //     ongoing booster phase (high-risk/exposure MenACWY, high-risk MenB) —
  //     analyzeHistory() deliberately did NOT cap it (F2); showing "N of M"
  //     here would itself violate the "chip never shows N > M" rule.
  //   Extra dose    — a valid dose past the total on a schedule with NO
  //     booster phase (routine MenACWY, single-dose exposure, healthy
  //     MenB) — analyzeHistory() capped it (extraDose:true, F2/F3). This is
  //     the reported bug's exact scenario (a 3rd routine MenACWY dose).
  //   Recorded — not part of an indicated series — a dose recorded while
  //     this vaccine isn't currently indicated at all (no seriesTotal to
  //     compare against).
  const chipClass = notAdolescentCount
    ? 'dose-val-chip dose-val-offwindow'
    : extraDose
      ? 'dose-val-chip dose-val-offwindow'
      : status === 'valid'
        ? 'dose-val-chip dose-val-valid'
        : status === 'invalid'
          ? 'dose-val-chip dose-val-invalid'
          : 'dose-val-chip dose-val-unknown';

  // G3 (2026-09-16): a dose dated in the future is not an invalid DOSE — it is
  // an entry that cannot be right yet. "Invalid" sends the reader looking for a
  // clinical mistake; the chip has to point at the date instead.
  const chipLabel = recordProblem
    ? 'Date is in the future — not counted'
    : notAdolescentCount
    ? 'Off-window - repeat'
    // G6 (2026-09-16): an UNDATED row past the series total is a question, not
    // a finding — with no date the app cannot tell an extra dose from a series
    // dose whose date is missing. The assertive chip below stays for dated
    // doses, where it really is known.
    : extraDoseUnverified
      ? 'Extra dose? — no date recorded'
    : extraDose
      ? 'Extra dose — beyond the indicated series total'
      : status === 'valid'
        ? (seriesTotal == null
            ? 'Recorded — not part of an indicated series'
            : effectiveDoseNum <= seriesTotal
              ? `Dose ${effectiveDoseNum} of ${seriesTotal}`
              : 'Booster')
        : status === 'invalid' ? 'Invalid' : 'Unknown';

  return (
    <div className={`dose-val${doesNotCount ? ' dose-val-dropped' : ''}`}>
      <span className={chipClass}>{chipLabel}</span>
      {wasPrompted && (
        <button
          type="button"
          className="dose-val-edit-link"
          data-testid="dose-val-edit-risk-answer"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
      )}
      {showReasonsBlock(reasons, detail, reasonCites, numberFor)}
    </div>
  );
}

// C5/Change 4 (2026-07-24): render `note` text with each literal "[c]"
// placeholder turned into a clickable, NUMBERED superscript link that
// deep-links to the exact MMWR sentence. `noteCites` is an ORDERED list of
// {key, page, url, label} — one entry per "[c]" occurrence in the note, in
// order. The visible [N] number is assigned HERE, by order of first
// mention, not hardcoded in recommend.js — so a source can no longer
// render under a different number than intended just because a manual
// cite(N, key) call was typed wrong.
// Numbers are deduped by `page` (owner decision, 2026-07-24): two citation
// keys that quote different sentences on the SAME source page share one
// [N] — the number identifies the document, not the sentence. Each marker
// still gets its OWN href (deep-linking to its own quoted sentence) and its
// own hover title (that exact quote), so distinct sentences stay
// individually reachable even when their numbers match.
//
// G4 (2026-09-16): the numbering map is now optional-injectable, so a block
// that renders SEVERAL cited strings (the record panel's dose verdicts) numbers
// them as one sequence instead of restarting at [1] on every string.
function makeCiteNumberer() {
  const numberByPage = new Map();
  let nextNumber = 1;
  return (dedupeKey) => {
    if (!numberByPage.has(dedupeKey)) numberByPage.set(dedupeKey, nextNumber++);
    return numberByPage.get(dedupeKey);
  };
}

function renderNoteWithCites(note, noteCites, numberFor = makeCiteNumberer()) {
  if (!noteCites || noteCites.length === 0) return note;
  const parts = note.split('[c]');
  return parts.flatMap((part, i) => {
    if (i === parts.length - 1) return [part];
    const c = noteCites[i];
    if (!c) return [part];
    const marker = `[${numberFor(c.page ?? c.key)}]`;
    return [part, (
      <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="note-cite" title={c.label}>
        {marker}
      </a>
    )];
  });
}

// Only render when there's non-empty reasons AND not a bare 'valid' with no notes.
// G4 (2026-09-16): a verdict that sets a recorded dose aside on age grounds
// now carries the ACIP sentence it rests on, shown the same way as on the
// cards above — a numbered superscript linking to that exact sentence, with
// the quote on hover. `reasonCites` is one entry per literal "[c]" across the
// whole reasons array, in order (validate.js). Reasons the walk appends
// afterwards carry no marker, so they never disturb the pairing.
function showReasonsBlock(reasons, detail, reasonCites, numberFor = makeCiteNumberer()) {
  if (!reasons || reasons.length === 0) return null;
  let consumed = 0;
  return (
    <div className="dose-val-reasons">
      {reasons.map((r, i) => {
        const markers = r.split('[c]').length - 1;
        const cites = markers > 0 ? (reasonCites ?? []).slice(consumed, consumed + markers) : null;
        consumed += markers;
        return (
          <span key={i} className="dose-val-reason">
            {cites && cites.length ? renderNoteWithCites(r, cites, numberFor) : r}
          </span>
        );
      })}
      {detail && <span className="dose-val-detail">{detail}</span>}
    </div>
  );
}

// B4/E3: the big card's fill color communicates TIMING — due today (green),
// needs catch-up (yellow), shared decision (blue), or neither urgent (gray).
// Shared-decision gets its own permanent color (not just "green when due
// today") since it's a distinct kind of "now" — optional, not mandatory.
function timingClass(status, dueToday) {
  if (status === 'shared-decision') return 'timing-shared';
  if (status === 'catchup') return 'timing-catchup';
  if (dueToday) return 'timing-due';
  return 'timing-neutral';
}

export default function RecCard({ rec, doses = [], doseValidations = [], ageMonths = 0, onRiskAtDoseAnswer, riskAtDoseAnswers = {} }) {
  const { vaccine, status, doseLabel, primaryTotal, dueToday, earliestNextDate, boosterDueDate, brands, note, noteCites, citations, seriesTotal, boosterSummary } = rec;
  const numberFor = cardCiteNumberer(doseValidations, noteCites);
  const isNeutral = status === 'complete' || status === 'not-indicated' || status === 'deferred';
  // D5: neutral cards (nothing to do) collapse to a compact row so due items
  // dominate the screen. B6 exception: a "complete" status with a booster
  // still due later must stay expanded — that's not a quiet done state.
  // P1-4: a card with unanswered questions is never collapsible -- the
  // questions are inside it, and collapsing would hide the very thing the
  // clinician is being asked to do.
  const pending = hasPendingDoses(doseValidations);
  const collapsible = isNeutral && !boosterDueDate && !pending;
  const [expanded, setExpanded] = useState(!collapsible);
  const given = doses.length;
  const today = todayISO();

  return (
    <div
      className={`rec-card ${timingClass(status, pending ? false : dueToday)}${collapsible && !expanded ? ' rec-card-collapsed' : ''}`}
      data-testid="rec-card"
    >
      {collapsible ? (
        <button
          type="button"
          className="rec-card-head rec-card-head-toggle"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          <span className="rec-vaccine-name">{vaccine}</span>
          {!expanded && <span className="rec-card-collapsed-reason">{doseLabel}</span>}
          <span className="rec-card-head-trailing">
            <span className={`status-badge ${status}`}>{statusPillLabel(rec, pending)}</span>
            <Chevron open={expanded} />
          </span>
        </button>
      ) : (
        <div className="rec-card-head">
          <span className="rec-vaccine-name">{vaccine}</span>
          <span className="rec-card-head-trailing">
            <span className={`status-badge ${status}`}>{statusPillLabel(rec, pending)}</span>
          </span>
        </div>
      )}

      {expanded && (
      <div className="rec-card-inner">
        {/* D4: today's action first — dose due + brands, then booster/next-date,
            then recorded history (history supports the decision, it doesn't
            sit above it), then note, then citations. */}
        {/* P1-4: the recommendation is withheld, not computed differently,
            until every risk-timing question below has an answer. */}
        {pending ? (
          <div className="rec-dose-label rec-dose-label-pending" data-testid="rec-awaiting-input">
            Answer the question on each recorded dose below to get a recommendation.
          </div>
        ) : (
          <div className="rec-dose-label">{doseLabel}</div>
        )}

        {brands && brands.length > 0 && !isNeutral && !pending && (
          <div className="rec-brands">
            <div className="rec-brands-title">Brand options: choose one</div>
            {brands.map((b, i) => (
              <div key={i} className="rec-brand-item">
                <span className="rec-brand-dot" />
                {stripAntigen(b)}
              </div>
            ))}
          </div>
        )}

        {/* B6: a "complete" status with a booster still coming is NOT a quiet
            done state — call it out with its own emphasized line and date.
            Item 2 (2026-07-23): neutral gray, not amber -- amber reads as
            "behind schedule, act now," which is a false alarm for a date
            that isn't due yet. Bold weight still keeps it prominent. */}
        {boosterDueDate && !pending && (
          <div className="booster-due-banner" data-testid="booster-due-banner">
            Booster not yet due - ~{fmtDate(boosterDueDate)}
          </div>
        )}

        {!dueToday && earliestNextDate && !pending && (
          <div className="next-date">
            Next dose not yet due - eligible {fmtDate(earliestNextDate)}
          </div>
        )}

        {/* C4 (2026-07-23 handoff): count/cadence of FUTURE boosters beyond
            what's due today. The concrete next date, when known, stays in
            the booster-due-banner above -- this line only states how many
            and how often. Replaces the rejected "+ boosters" header flag. */}
        {boosterSummary && !pending && (
          <div className="booster-summary-line" data-testid="booster-summary-line">
            {boosterSummary}
          </div>
        )}

        {/* Series progress — what's recorded vs what's due */}
        {given > 0 && (
          <div className="rec-progress" data-testid="rec-progress">
            <span className="rec-progress-label">Recorded:</span>
            <ul className="rec-progress-list">
              {doseRowsWithGroups(doses, doseValidations, primaryTotal).map((row) => (
                row.kind === 'group' ? (
                  <li key={`group-${row.phase}`} className="rec-progress-group" data-testid={`dose-group-${row.phase}`}>
                    {row.label}
                  </li>
                ) : (
                  <li key={row.index} className="rec-progress-dose-row">
                    <span className="rec-progress-dose-text">{describeDose(row.dose, row.index, ageMonths, today)}</span>
                    <DoseValidation
                      result={doseValidations[row.index]}
                      seriesTotal={seriesTotal}
                      onAnswer={answer => onRiskAtDoseAnswer?.(vaccine, doseAnswerKey(row.dose, row.index), answer)}
                      wasPrompted={riskAtDoseAnswers[doseAnswerKey(row.dose, row.index)] !== undefined}
                      doseDate={row.dose?.date}
                      numberFor={numberFor}
                    />
                  </li>
                )
              ))}
            </ul>
          </div>
        )}

        {note && <div className="rec-note">{renderNoteWithCites(note, noteCites, numberFor)}</div>}

        {citations && citations.length > 0 && (
          <div className="rec-citations">
            {citations.map((c, i) => (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="citation-chip"
                title={c.label}
              >
                {c.short || c.label}
              </a>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
