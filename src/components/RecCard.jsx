import React, { useState } from 'react';
import { fmtDate, fmtAgeMonths, stripAntigen } from '../logic/format.js';
import { ageAtDoseFromDate } from '../logic/validate.js';
import { todayISO } from '../logic/dateUtils.js';
import { Chevron } from './icons.jsx';

const STATUS_LABELS = {
  'due':              'Due',
  'catchup':          'Catch-up',
  'risk-based':       'Risk-Based',
  'shared-decision':  'Optional (shared decision)',
  'complete':         'Complete',
  'not-indicated':    'Not indicated',
  'deferred':         'Deferred',
};

// One recorded past dose → "D1 · Jul 3, 2025 · age 11 years 2 months · Bexsero"
// D3: age at administration lets a clinician compare a recorded dose's timing
// against the recommendation, not just its date.
function describeDose(dose, idx, ageMonths, today) {
  const parts = [`D${idx + 1}`];
  parts.push(dose?.date ? fmtDate(dose.date) : 'date unknown');
  const ageAtDose = dose?.date ? ageAtDoseFromDate(dose, ageMonths, today) : null;
  parts.push(ageAtDose != null ? `age ${fmtAgeMonths(ageAtDose)}` : 'age unknown');
  parts.push(dose?.brand ? stripAntigen(dose.brand) : 'brand unknown');
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
function DoseValidation({ result, seriesTotal, onAnswer }) {
  if (!result) return null;
  const { status, reasons, detail, effectiveDoseNum, doesNotCount, notAdolescentCount, needsInput, promptDate } = result;

  if (status === 'pending') {
    return (
      <div className="dose-val dose-val-pending" data-testid="dose-val-pending">
        <span className="dose-val-chip dose-val-needs-input">Needs input</span>
        {showReasonsBlock(reasons, null)}
        <div className="risk-at-dose-prompt" data-testid="risk-at-dose-prompt">
          <div className="risk-at-dose-question">
            Was this patient at high risk for meningococcal disease when this dose was given ({fmtDate(promptDate)})?
          </div>
          <div className="risk-at-dose-actions">
            <button type="button" className="btn btn-outline btn-small" onClick={() => onAnswer?.('yes')}>Yes</button>
            <button type="button" className="btn btn-outline btn-small" onClick={() => onAnswer?.('no')}>No</button>
            <button type="button" className="btn btn-outline btn-small" onClick={() => onAnswer?.('unsure')}>Not sure</button>
          </div>
        </div>
      </div>
    );
  }

  const chipClass = notAdolescentCount
    ? 'dose-val-chip dose-val-offwindow'
    : status === 'valid'
      ? 'dose-val-chip dose-val-valid'
      : status === 'invalid'
        ? 'dose-val-chip dose-val-invalid'
        : 'dose-val-chip dose-val-unknown';

  const chipLabel = notAdolescentCount
    ? 'Off-window - repeat'
    : status === 'valid'
      ? (effectiveDoseNum != null && seriesTotal != null ? `Dose ${effectiveDoseNum} of ${seriesTotal}` : 'Counts')
      : status === 'invalid' ? 'Invalid' : 'Unknown';

  return (
    <div className={`dose-val${doesNotCount ? ' dose-val-dropped' : ''}`}>
      <span className={chipClass}>{chipLabel}</span>
      {showReasonsBlock(reasons, detail)}
    </div>
  );
}

// Only render when there's non-empty reasons AND not a bare 'valid' with no notes.
function showReasonsBlock(reasons, detail) {
  if (!reasons || reasons.length === 0) return null;
  return (
    <div className="dose-val-reasons">
      {reasons.map((r, i) => (
        <span key={i} className="dose-val-reason">{r}</span>
      ))}
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

export default function RecCard({ rec, doses = [], doseValidations = [], ageMonths = 0, onRiskAtDoseAnswer }) {
  const { vaccine, status, doseLabel, dueToday, earliestNextDate, boosterDueDate, brands, note, citations, seriesTotal, boosterSummary } = rec;
  const isNeutral = status === 'complete' || status === 'not-indicated' || status === 'deferred';
  // D5: neutral cards (nothing to do) collapse to a compact row so due items
  // dominate the screen. B6 exception: a "complete" status with a booster
  // still due later must stay expanded — that's not a quiet done state.
  const collapsible = isNeutral && !boosterDueDate;
  const [expanded, setExpanded] = useState(!collapsible);
  const given = doses.length;
  const today = todayISO();

  return (
    <div
      className={`rec-card ${timingClass(status, dueToday)}${collapsible && !expanded ? ' rec-card-collapsed' : ''}`}
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
            <span className={`status-badge ${status}`}>{STATUS_LABELS[status] || status}</span>
            <Chevron open={expanded} />
          </span>
        </button>
      ) : (
        <div className="rec-card-head">
          <span className="rec-vaccine-name">{vaccine}</span>
          <span className="rec-card-head-trailing">
            <span className={`status-badge ${status}`}>{STATUS_LABELS[status] || status}</span>
          </span>
        </div>
      )}

      {expanded && (
      <div className="rec-card-inner">
        {/* D4: today's action first — dose due + brands, then booster/next-date,
            then recorded history (history supports the decision, it doesn't
            sit above it), then note, then citations. */}
        <div className="rec-dose-label">{doseLabel}</div>

        {brands && brands.length > 0 && !isNeutral && (
          <div className="rec-brands">
            <div className="rec-brands-title">Brand options: choose one</div>
            {brands.map((b, i) => (
              <div key={i} className="rec-brand-item">
                <span className="rec-brand-dot" />
                {stripAntigen(b)}
              </div>
            ))}
            <div className="rec-brands-helper">Select one brand for this dose.</div>
          </div>
        )}

        {/* B6: a "complete" status with a booster still coming is NOT a quiet
            done state — call it out with its own emphasized line and date.
            Item 2 (2026-07-23): neutral gray, not amber -- amber reads as
            "behind schedule, act now," which is a false alarm for a date
            that isn't due yet. Bold weight still keeps it prominent. */}
        {boosterDueDate && (
          <div className="booster-due-banner" data-testid="booster-due-banner">
            Not yet due — booster ~{fmtDate(boosterDueDate)}
          </div>
        )}

        {!dueToday && earliestNextDate && (
          <div className="next-date">
            Not yet due — eligible {fmtDate(earliestNextDate)}
          </div>
        )}

        {/* C4 (2026-07-23 handoff): count/cadence of FUTURE boosters beyond
            what's due today. The concrete next date, when known, stays in
            the booster-due-banner above -- this line only states how many
            and how often. Replaces the rejected "+ boosters" header flag. */}
        {boosterSummary && (
          <div className="booster-summary-line" data-testid="booster-summary-line">
            {boosterSummary}
          </div>
        )}

        {/* Series progress — what's recorded vs what's due */}
        {given > 0 && (
          <div className="rec-progress" data-testid="rec-progress">
            <span className="rec-progress-label">Recorded:</span>
            <ul className="rec-progress-list">
              {doses.map((d, i) => (
                <li key={i} className="rec-progress-dose-row">
                  <span className="rec-progress-dose-text">{describeDose(d, i, ageMonths, today)}</span>
                  <DoseValidation
                    result={doseValidations[i]}
                    seriesTotal={seriesTotal}
                    onAnswer={answer => onRiskAtDoseAnswer?.(vaccine, i, answer)}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {note && <div className="rec-note">{note}</div>}

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
