import React from 'react';
import { fmtDate, fmtAgeMonths, stripAntigen } from '../logic/format.js';
import { ageAtDoseFromDate } from '../logic/validate.js';
import { todayISO } from '../logic/dateUtils.js';

const STATUS_LABELS = {
  'due':              'Due',
  'catchup':          'Catch-up',
  'risk-based':       'Risk-Based',
  'shared-decision':  'Shared decision',
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
// E5: labels/colors match vaxapp's compliance-audit language — on time
// (green), valid but off-window (amber), invalid (red), unknown (gray) —
// so a clinician who uses both apps reads the same vocabulary in both.
function DoseValidation({ result }) {
  if (!result) return null;
  const { status, reasons, detail, effectiveDoseNum, doesNotCount, notAdolescentCount } = result;

  const chipClass = notAdolescentCount
    ? 'dose-val-chip dose-val-offwindow'
    : status === 'valid'
      ? 'dose-val-chip dose-val-valid'
      : status === 'invalid'
        ? 'dose-val-chip dose-val-invalid'
        : 'dose-val-chip dose-val-unknown';

  const chipLabel = notAdolescentCount
    ? 'Valid — off-window'
    : status === 'valid' ? 'On time' : status === 'invalid' ? 'Invalid' : 'Unknown';

  // Only show reasons when non-empty AND not a bare 'valid' with no notes.
  const showReasons = reasons && reasons.length > 0;

  return (
    <div className={`dose-val${doesNotCount ? ' dose-val-dropped' : ''}`}>
      <span className={chipClass}>{chipLabel}</span>
      {effectiveDoseNum != null && status !== 'invalid' && (
        <span className="dose-val-effective">Effective dose {effectiveDoseNum}</span>
      )}
      {showReasons && (
        <div className="dose-val-reasons">
          {reasons.map((r, i) => (
            <span key={i} className="dose-val-reason">{r}</span>
          ))}
          {detail && <span className="dose-val-detail">{detail}</span>}
        </div>
      )}
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

export default function RecCard({ rec, doses = [], doseValidations = [], ageMonths = 0 }) {
  const { vaccine, status, doseLabel, dueToday, earliestNextDate, boosterDueDate, brands, note, citations } = rec;
  const isNeutral = status === 'complete' || status === 'not-indicated' || status === 'deferred';
  const given = doses.length;
  const today = todayISO();

  return (
    <div className={`rec-card ${timingClass(status, dueToday)}`} data-testid="rec-card">
      <div className="rec-card-inner">
        <div className="rec-card-head">
          <span className="rec-vaccine-name">{vaccine}</span>
          <span className={`status-badge ${status}`}>{STATUS_LABELS[status] || status}</span>
        </div>

        {/* Series progress — what's recorded vs what's due */}
        {given > 0 && (
          <div className="rec-progress" data-testid="rec-progress">
            <span className="rec-progress-label">Recorded:</span>
            <ul className="rec-progress-list">
              {doses.map((d, i) => (
                <li key={i} className="rec-progress-dose-row">
                  <span className="rec-progress-dose-text">{describeDose(d, i, ageMonths, today)}</span>
                  <DoseValidation result={doseValidations[i]} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rec-dose-label">{doseLabel}</div>

        {/* B6: a "complete" status with a booster still coming is NOT a quiet
            done state — call it out with its own emphasized line and date. */}
        {boosterDueDate && (
          <div className="booster-due-banner" data-testid="booster-due-banner">
            Booster still due — approximately {fmtDate(boosterDueDate)}
          </div>
        )}

        {!dueToday && earliestNextDate && (
          <div className="next-date">
            Eligible {fmtDate(earliestNextDate)}
          </div>
        )}

        {brands && brands.length > 0 && !isNeutral && (
          <div className="rec-brands">
            <div className="rec-brands-title">Brand options — choose one</div>
            {brands.map((b, i) => (
              <div key={i} className="rec-brand-item">
                <span className="rec-brand-dot" />
                {stripAntigen(b)}
              </div>
            ))}
            <div className="rec-brands-helper">Select one brand for this dose.</div>
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
    </div>
  );
}
