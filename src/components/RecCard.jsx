import React, { useState, useContext } from 'react';
import { fmtDate, fmtAgeMonths, stripAntigen } from '../logic/format.js';
import { ageAtDoseFromDate } from '../logic/validate.js';
import { isFutureDated } from '../logic/doseRules.js';
import { todayISO, daysBetween } from '../logic/dateUtils.js';
import { Chevron } from './icons.jsx';
import { doseAnswerKey } from '../logic/doseIdentity.js';
import { doseChipLabel, doseChipClass, NEEDS_INPUT_LABEL } from './doseChipLabel.js';
import { OpenAllDisclosures } from './openAllDisclosures.js';
// C1 (2026-10-17): the inline [N] hover text names its document. Lives beside
// cite() in refs.js, the same file PneumoVax keeps it in.
import { citeTitle, CITATIONS } from '../data/refs.js';

// C3 (2026-07-23 handoff): self-describing pills that state WHEN and WHAT
// instead of a terse status word that needed a legend to decode (the legend
// was removed in C1). Owner-approved vocabulary:
//   due today, boosters follow      -> "Dose due today, future boosters needed"
//   due today, no boosters          -> "Dose due today"
//   behind schedule                 -> "Catch-up dose due today"
//   series done, booster due today  -> "Booster due today"
//   series done, booster in future  -> "Future booster needed"
//   optional (MenB 16-23y)          -> "Optional today - shared decision"
//   not due, next dose dated        -> "Next dose not yet due" (F-3, owner 2026-11-18)
//   not due, next booster dated     -> "Future booster needed" (F-3)
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

export function statusPillLabel(rec, pending) {
  // "Answers needed", not "Needs input": the per-dose chip already says "Needs
  // input", and two identical labels at two levels leaves the clinician asking
  // which input is meant. This one names the card's state; the chips name the
  // individual doses that are waiting.
  if (pending) return 'Answer needed below';
  const { status, dueToday, doseNum, seriesTotal, boosterDueDate, boosterSummary } = rec;

  if (status === 'deferred') return 'Deferred in pregnancy';
  if (status === 'not-indicated') return 'Not needed';
  if (status === 'complete') return boosterDueDate ? 'Booster due later' : 'Up to date';
  if (status === 'catchup') return 'Catch-up dose due today';
  // F-3 (owner, STOP G1, 2026-11-18): "Up to date" only when nothing is left.
  // A card not due today that still prints "Next dose due <date>"
  // (earliestNextDate, the same condition the date line below uses) names
  // what is coming: a booster, or the next dose of the series.
  // A dose past the PRIMARY series is a booster. primaryTotal, not
  // seriesTotal: the routine 16-year card counts its booster inside
  // seriesTotal (dose 2 of 2), so seriesTotal read "Booster (16y)" in its
  // 8-week wait as a series dose (42 grid cards, measured 2026-11-18).
  // primaryTotal matched every dated card's own label on the grid.
  // W1 (owner, 2026-11-19): "Booster due today" is judged the same way — past the
  // PRIMARY series. With seriesTotal the routine "Booster (16y)" card (dose 2 of
  // 2) read "Dose due today" on 264 grid patients while 740 others with the
  // same label read "Booster due today".
  const pastPrimary = (rec.primaryTotal ?? seriesTotal);
  const isBooster = doseNum != null && pastPrimary != null && doseNum > pastPrimary;
  const comingIsBooster = isBooster;
  const datedNext = !dueToday && !!rec.earliestNextDate;
  const comingLabel = comingIsBooster ? 'Booster due later' : 'Next dose not yet due';
  if (status === 'shared-decision') {
    if (dueToday) return 'Shared decision today';
    return datedNext ? comingLabel : 'Up to date';
  }

  // 'due' / 'risk-based' / 'exposure': a dose is being recommended now.
  // The routine "Booster (16y)" card (status 'due' since STOP B: never
  // "complete" while a booster is coming) keeps the pill it had.
  if (!dueToday && boosterDueDate) return 'Booster due later';
  // MQ6-f (owner, 2026-11-21, "Yes, both match"): no "Can be given today" badge.
  // Between a dose's minimum and its routine date the card reads "Next dose not
  // yet due" with "Next dose due <date>"; the note says it can be given if
  // needed. Follow the standard schedule when it can be followed; a dose at the
  // minimum still counts. As PneumoVax. (Was the owner's 2026-11-18 gap badge.)
  if (datedNext) return comingLabel;
  if (!dueToday) return 'Up to date';
  if (isBooster) return 'Booster due today';
  return boosterSummary ? 'Due today, boosters to follow' : 'Dose due today';
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
function describeDose(dose, idx, ageMonths, today, dob) {
  const parts = [`D${idx + 1}`];
  parts.push(dose?.date ? fmtDate(dose.date) : 'date unknown');
  // Calendar P2-2: with a date of birth the printed age is exact; without one
  // it is the same approximation as before, and still shown with a "~".
  const ageAtDose = dose?.date ? ageAtDoseFromDate(dose, ageMonths, today, dob) : null;
  // Exact day count for the weeks band (fmtAgeMonths' exactDays param) --
  // same dob + dose.date pair ageAtDoseFromDate already used above.
  const ageAtDoseDays = dob && dose?.date ? daysBetween(dob, dose.date) : null;
  // A dose dated in the future used to print the age the patient WILL be
  // ("D1 · May 1, 2030 · age 10 years 4 months" for a child of 6 years 9
  // months). The verdict beside it was right; the age described a visit that
  // has not happened. Parity with PneumoVax (owner, 2026-10-12; PneumoVax #41).
  // A date before birth already reads "age Before birth" (fmtAgeMonths); that
  // one is unchanged. The test is the rule table's own, so they cannot disagree.
  parts.push(
    isFutureDated(dose, today)
      ? 'In the future'
      : ageAtDose != null ? `age ${fmtAgeMonths(ageAtDose, ageAtDoseDays)}` : 'age unknown'
  );
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
// U2 (2026-09-17): the booster line now carries cited text of its own (the
// cadence sentence moved out of the note and into it), and it renders ABOVE the
// recorded doses -- so it is seeded first, or its source would be numbered after
// sources the reader meets later down the card.
//
// Port Phase 8, C2/C3 (2026-11-21), replacing cardCiteNumberer: ONE
// computation hands back both the numbering and the button list, so a [2] in
// a sentence always names the button marked [2] (PneumoVax's `cardSources`,
// owner 2026-10-17). Before, the buttons were a separate engine list with no
// numbers: 2,730 grid cards showed a number with no button.
//
// Order (owner, 2026-11-21, "Order you read"): the order the reader meets the
// sentences down the card. On a card open by default "Why this" sits first
// (L4), then its lead, the booster line, the recorded doses. On a card shut
// by default, or waiting on a question, the note is at the bottom.
//
// A button no sentence cites keeps its authored place after the cited ones,
// numbered — never dropped (taking one off is the per-document reading, C4).
// A button for a document a sentence already cites shares that number, and
// its authored link and title win: they were written for this card.
export function cardSources({ doseValidations, note, noteCites, citations, boosterCites, whyFirst = false }) {
  const numberFor = makeCiteNumberer();
  const lead = note?.lead ?? '';
  const leadCount = (lead.match(/\[c\]/g) || []).length;
  const leadCites = (noteCites ?? []).slice(0, leadCount);
  const detailCites = (noteCites ?? []).slice(leadCount);
  // Only the cites a verdict actually prints: one per "[c]" in its reasons.
  const verdictCites = (doseValidations ?? []).flatMap((v) => {
    const markers = (v?.reasons ?? []).reduce((n, r) => n + (String(r).split('[c]').length - 1), 0);
    return (v?.reasonCites ?? []).slice(0, markers);
  });
  const marks = whyFirst
    ? [...detailCites, ...leadCites, ...(boosterCites ?? []), ...verdictCites]
    : [...(boosterCites ?? []), ...verdictCites, ...leadCites, ...detailCites];

  const sources = [];
  const fromSentence = new Map(); // document -> its entry, until a button claims it
  for (const m of marks) {
    const key = m.page ?? m.key;
    const n = numberFor(key);
    const doc = documentOf(key);
    if (fromSentence.has(doc) || sources.some((s) => documentOf(s.url) === doc)) continue;
    const entry = { n, url: m.page ?? m.url, short: m.doc ?? m.label, title: documentTitle(doc) ?? m.doc };
    fromSentence.set(doc, entry);
    sources.push(entry);
  }
  for (const ch of citations ?? []) {
    const n = numberFor(ch.url);
    const doc = documentOf(ch.url);
    const entry = { n, url: ch.url, short: ch.short || ch.label, title: ch.label };
    if (fromSentence.has(doc)) {
      Object.assign(fromSentence.get(doc), entry);
      fromSentence.delete(doc);
    } else {
      sources.push(entry);
    }
  }
  // Stable: two buttons for one document (e.g. ACIP 2020 linked at two of its
  // tables) sit together, in the order the engine lists them.
  return { numberFor, sources: sources.sort((a, b) => a.n - b.n) };
}

// The document a link belongs to: the address without its "#…" part. One
// document is linked at many sentences and sections; the number names the
// document (owner 2026-07-24), so they all share it.
function documentOf(url) {
  return String(url ?? '').split('#')[0];
}

// A sentence-only document's button title: its whole-document entry's full
// title, when refs.js has one.
function documentTitle(doc) {
  const whole = Object.values(CITATIONS).find((e) => !e.quote && documentOf(e.url) === doc);
  return whole?.label;
}

// The chip wording for a row whose PROBLEM IS THE ENTRY, keyed by the `kind`
// validate.js attaches (G3/G7, 2026-09-16). Each says plainly that this row is
// not counted, because that is the question a reader has when a row is greyed
// out. The dose itself may well be fine — in the duplicate case it is counted,
// once, on the row above.

function DoseValidation({ result, seriesTotal, onAnswer, wasPrompted, doseDate, numberFor }) {
  const [editing, setEditing] = useState(false);
  if (!result) return null;
  const { status, reasons, detail, whys, reasonCites, effectiveDoseNum, doesNotCount, notAdolescentCount, needsInput, promptDate, extraDose, recordProblem } = result;

  // Item 2 (2026-07-23 handoff): once answered, the validator's result no
  // longer carries needsInput/promptDate (see validate.js), so re-opening the
  // prompt falls back to this dose's own recorded date instead.
  if (status === 'pending' || editing) {
    return (
      <div className="dose-val dose-val-pending" data-testid="dose-val-pending">
        <span className="dose-val-chip dose-val-needs-input">{NEEDS_INPUT_LABEL}</span>
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
          {/* L7 (review v10, owner 2026-11-20): beside the question it explains,
              only when the question appears (it was behind "About risk history"). */}
          <div className="risk-at-dose-note" data-testid="risk-at-dose-note">
            The app records current risk only. When an earlier dose depends on the risk on its date, this question asks.
          </div>
        </div>
      </div>
    );
  }

  // The chip's wording and its colour both live in doseChipLabel.js, which
  // carries the reasoning for every branch and the order they are tested in.
  // They were spelled out here AND, separately, inside sweep-dose-counter.test.js
  // -- the test whose job is to prove the chip never implies N > M. The two
  // drifted, and it was the test that was printing N. One copy now.
  const chipClass = doseChipClass(result);
  const chipLabel = doseChipLabel(result, seriesTotal);

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
      {showReasonsBlock(reasons, detail, reasonCites, numberFor, whys)}
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
  // C2 (2026-11-21): keyed by DOCUMENT, so a sentence link (`…htm#:~:text=…`)
  // and the plain page (`…htm`) are one number, not two (2,245 grid cards).
  return (dedupeKey) => {
    const doc = documentOf(dedupeKey);
    if (!numberByPage.has(doc)) numberByPage.set(doc, nextNumber++);
    return numberByPage.get(doc);
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
      <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="note-cite" title={citeTitle(c)}>
        {marker}
      </a>
    )];
  });
}

// U1 (2026-09-17): the card shows the note's `lead` — what to do for this
// patient — and puts `detail` behind a "Why this" disclosure. Before this the
// note was one paragraph that ran to a median of 128 characters and a longest
// of 530, reciting a whole ACIP schedule to a reader who needed one line.
//
// `noteCites` is ONE ordered list across both halves (the contract `rec()`
// documents): the `[c]` markers in `lead` consume the first entries, and
// `detail` takes the rest. The card's citation numbers are seeded from the
// whole list by cardSources, so a source keeps the same [N] whether the
// disclosure happens to be open or shut.
// L4 (review v10, owner 2026-11-20): `whyFirst` puts "Why this" right under the
// card title, and the lines that stay in view (another product, an earliest
// date) after it.
// C2 (2026-11-21): a card passes its `numberFor` and `sources` from
// cardSources(); a note shown on its own (the combined-shot card) works them
// out from its own sentences and buttons, so it gets the same numbered row.
export function RecNote({ note, noteCites = [], numberFor: numberForProp, sources: sourcesProp, citations = [], className = 'rec-note', whyFirst = false }) {
  // false in the app; true only when scripts/proseDiff.mjs reads every sentence.
  const openAll = useContext(OpenAllDisclosures);
  const [open, setOpen] = useState(openAll);
  const own = numberForProp && sourcesProp ? null : cardSources({ note, noteCites, citations, whyFirst });
  const numberFor = numberForProp ?? own.numberFor;
  const sources = sourcesProp ?? own.sources;
  const lead = note?.lead ?? '';
  const detail = note?.detail ?? '';
  const leadCiteCount = (lead.match(/\[c\]/g) || []).length;
  // Port Phase 6.3, Q10 (owner, 2026-11-19, as PneumoVax §WORD-1): the card's
  // source buttons sit inside the disclosure, not below it. A card with sources
  // and no explanation sentence titles the toggle "Sources" (PneumoVax's owner
  // ruling of 2026-11-07, "Call it Sources"), so it never opens onto an empty
  // "Why this".
  const hasSources = sources.length > 0;
  const toggleLabel = detail ? 'Why this' : 'Sources';
  const leadBlock = lead && (
    <div className="rec-note-lead">
      {renderNoteWithCites(lead, noteCites.slice(0, leadCiteCount), numberFor)}
    </div>
  );
  return (
    <div className={className}>
      {!whyFirst && leadBlock}
      {(detail || hasSources) && (
        <>
          <button
            type="button"
            className="rec-note-toggle"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            data-testid="rec-note-toggle"
          >
            {toggleLabel}<Chevron open={open} />
          </button>
          {open && (
            <div className="rec-note-detail" data-testid="rec-note-detail">
              {detail && renderNoteWithCites(detail, noteCites.slice(leadCiteCount), numberFor)}
              {/* C2 (PneumoVax, owner 2026-10-17): each button carries the
                  number the sentences use, so a [2] names the button marked
                  [2]. Headed "Sources" under an explanation; with no
                  explanation the toggle itself already says "Sources". */}
              {hasSources && (
                <div className="rec-citations">
                  {detail && <span className="rec-citations-heading">Sources</span>}
                  {sources.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="citation-chip"
                      title={s.title}
                    >
                      <span className="citation-chip-num">[{s.n}]</span>
                      {s.short}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      {whyFirst && leadBlock}
    </div>
  );
}

// impossible P1-2 (2026-09-18): the age-plausibility note. It lives here, next
// to RecNote, because it needs the same "[c]" -> numbered superscript machinery
// and that machinery is not worth exporting twice; it renders in the results
// header rather than on a card.
//
// Deliberately NOT a RecNote: no "Why this" disclosure. The whole point is that
// a doubt about the patient's age has to be readable without a click, and it is
// two short sentences, so there is nothing to hide behind a toggle.
//
// All copy comes from recommend.js. Nothing is authored here.
export function RiskAgeNote({ note, noteCites = [] }) {
  if (!note) return null;
  const numberFor = makeCiteNumberer();
  let used = 0;
  return (
    <div className="risk-age-note" data-testid="risk-age-note">
      {note.lines.map((line, i) => {
        const n = (line.match(/\[c\]/g) || []).length;
        const slice = noteCites.slice(used, used + n);
        used += n;
        return (
          <div key={i} className="risk-age-note-line">
            {renderNoteWithCites(line, slice, numberFor)}
          </div>
        );
      })}
      <div className="risk-age-note-footer">{note.footer}</div>
    </div>
  );
}

// Only render when there's non-empty reasons AND not a bare 'valid' with no notes.
// G4 (2026-09-16): a verdict that sets a recorded dose aside on age grounds
// now carries the ACIP sentence it rests on, shown the same way as on the
// cards above — a numbered superscript linking to that exact sentence, with
// the quote on hover. `reasonCites` is one entry per literal "[c]" across the
// whole reasons array, in order (validate.js). Reasons the walk appends
// afterwards carry no marker, so they never disturb the pairing.
function showReasonsBlock(reasons, detail, reasonCites, numberFor = makeCiteNumberer(), whys = null) {
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
            {i > 0 ? ' ' : ''}{cites && cites.length ? renderNoteWithCites(r, cites, numberFor) : r}
          </span>
        );
      })}
      {(detail || whys?.length) && <DoseWhy whys={whys} detail={detail} />}
    </div>
  );
}

// G1-b (owner, STOP G1, 2026-11-18, "Yes, as PneumoVax"): a recorded dose's
// line is the label plus its reason; the background (`whys`) and the
// age/interval/date detail sit behind the dose's own "Why this", ported from
// PneumoVax's DoseValidation. The trigger re-uses .rec-note-toggle, so the
// card's fold-out and the dose's cannot drift apart. `whys` carry no "[c]":
// a source number stays on the line, on the sentence it supports, so the
// card's numbering (cardSources) is the same open or shut.
function DoseWhy({ whys, detail }) {
  // false in the app; true only when scripts/proseDiff.mjs reads every sentence.
  const openAll = useContext(OpenAllDisclosures);
  const [open, setOpen] = useState(openAll);
  return (
    <>
      <button
        type="button"
        className="rec-note-toggle dose-val-toggle"
        data-testid="dose-val-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Why this<Chevron open={open} />
      </button>
      {open && (
        <span className="dose-val-why" data-testid="dose-val-why">
          {whys?.map((w, i) => (
            <span key={`w${i}`} className="dose-val-reason">{w}</span>
          ))}
          {detail && <span className="dose-val-detail">{detail}</span>}
        </span>
      )}
    </>
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

export default function RecCard({ rec, doses = [], doseValidations = [], ageMonths = 0, dob = null, onRiskAtDoseAnswer, riskAtDoseAnswers = {}, today: todayProp }) {
  const { vaccine, status, doseLabel, primaryTotal, dueToday, earliestNextDate, boosterDueDate, boosterDueDateExact, brands, note, noteCites, citations, seriesTotal, boosterSummary, boosterCites } = rec;
  const isNeutral = status === 'complete' || status === 'not-indicated' || status === 'deferred';
  // D5: neutral cards (nothing to do) collapse to a compact row so due items
  // dominate the screen. B6 exception: a "complete" status with a booster
  // still due later must stay expanded — that's not a quiet done state.
  // P1-4: a card with unanswered questions is never collapsible -- the
  // questions are inside it, and collapsing would hide the very thing the
  // clinician is being asked to do.
  const pending = hasPendingDoses(doseValidations);
  const collapsible = isNeutral && !boosterDueDate && !pending;
  // C2/C3: numbers and buttons, one computation, in the order this card is read.
  const whyFirst = !collapsible && !pending;
  const { numberFor, sources } = cardSources({ doseValidations, note, noteCites, citations, boosterCites, whyFirst });
  // Port 1.2: the prose tool opens every card (openAllDisclosures.js); the app never does.
  const openAll = useContext(OpenAllDisclosures);
  const [expanded, setExpanded] = useState(!collapsible || openAll);
  // U5 (2026-09-17): `expanded` is seeded ONCE, at mount. When props change so
  // that a neutral card becomes a due one, `collapsible` flips true -> false and
  // the header stops rendering the toggle button -- so a stale `expanded: false`
  // left the card with no body and no control to open it (reproduced live by
  // pressing "Adjust age" on a results page). What is SHOWN is therefore derived
  // from `collapsible`, which is computed from the current props every render:
  // a card that cannot be collapsed is always shown. `expanded` still holds the
  // clinician's own choice, and is only consulted while the toggle exists, so
  // deliberately collapsing a quiet card survives unrelated re-renders.
  const showBody = !collapsible || expanded;
  const given = doses.length;
  // calendar P2-1: Results.jsx passes the render's one `today` (the same
  // value recommend() built the card from); the fallback is only for a test
  // that mounts RecCard on its own.
  const today = todayProp || todayISO();

  return (
    <div
      className={`rec-card ${timingClass(status, pending ? false : dueToday)}${!showBody ? ' rec-card-collapsed' : ''}`}
      data-testid="rec-card"
    >
      {collapsible ? (
        <button
          type="button"
          className="rec-card-head rec-card-head-toggle"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={showBody}
        >
          <span className="rec-vaccine-name">{vaccine}</span>
          {!showBody && <span className="rec-card-collapsed-reason">{doseLabel}</span>}
          <span className="rec-card-head-trailing">
            <span className={`status-badge ${status}`}>{statusPillLabel(rec, pending)}</span>
            <Chevron open={showBody} />
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

      {showBody && (
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

        {/* L4 (review v10): on a card that is open by default, "Why this" sits
            right under the title it explains. A card shut by default keeps its
            note whole at the bottom, as before. */}
        {whyFirst && (note || sources.length > 0) && (
          <RecNote note={note} noteCites={noteCites} numberFor={numberFor} sources={sources} whyFirst />
        )}

        {brands && brands.length > 0 && !isNeutral && !pending && (
          <div className="rec-brands">
            {/* P70 (review v10): one brand is a statement, not a choice. */}
            <div className="rec-brands-title">{brands.length === 1 ? `Brand: ${stripAntigen(brands[0])}` : 'Brand options: choose one'}</div>
            {brands.length > 1 && brands.map((b, i) => (
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
            {/* Calendar P1-3: "about" only when the date really is approximate.
                With a date of birth this IS the patient's 16th birthday; with
                years/months the app does not know their birthday and says so.
                G1-a (style rule 8): "about", never "~". */}
            Booster due {boosterDueDateExact ? '' : 'about '}{fmtDate(boosterDueDate)}.
          </div>
        )}

        {/* The booster line above already names this date when it is set.
            Phase 5 B1 (PneumoVax's Remy ruling, 2026-11-07): the date is the
            ADVISED one, so the line says "due", not "eligible". An earlier
            date allowed by the minimum is in the note ("It can be given from
            … if needed"), STOP F1 Q9a/Q9b, 2026-11-17. */}
        {!dueToday && earliestNextDate && !boosterDueDate && !pending && (
          <div className="next-date">Next dose due {fmtDate(earliestNextDate)}</div>
        )}

        {/* C4 (2026-07-23 handoff): count/cadence of FUTURE boosters beyond
            what's due today. The concrete next date, when known, stays in
            the booster-due-banner above -- this line only states how many
            and how often. Replaces the rejected "+ boosters" header flag. */}
        {boosterSummary && !pending && (
          <div className="booster-summary-line" data-testid="booster-summary-line">
            {renderNoteWithCites(boosterSummary, boosterCites, numberFor)}
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
                    <span className="rec-progress-dose-text">{describeDose(row.dose, row.index, ageMonths, today, dob)}</span>
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

        {!whyFirst && (note || sources.length > 0) && (
          <RecNote note={note} noteCites={noteCites} numberFor={numberFor} sources={sources} />
        )}
      </div>
      )}
    </div>
  );
}
