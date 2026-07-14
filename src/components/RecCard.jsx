import React from 'react';
import { fmtDate, stripAntigen } from '../logic/format.js';

const STATUS_LABELS = {
  'due':              'Due',
  'catchup':          'Catch-up',
  'risk-based':       'Risk-Based',
  'shared-decision':  'Shared decision',
  'complete':         'Complete',
  'not-indicated':    'Not indicated',
  'deferred':         'Deferred',
};

// One recorded past dose → "D1 · Jul 3, 2025 · Bexsero"
function describeDose(dose, idx) {
  const parts = [`D${idx + 1}`];
  parts.push(dose?.date ? fmtDate(dose.date) : 'date unknown');
  parts.push(dose?.brand ? stripAntigen(dose.brand) : 'brand unknown');
  return parts.join(' · ');
}

// Render a small status chip + reasons for a single recorded dose.
// result now optionally carries effectiveDoseNum, doesNotCount, and
// notAdolescentCount (A3) from analyzeHistory.
function DoseValidation({ result }) {
  if (!result) return null;
  const { status, reasons, detail, effectiveDoseNum, doesNotCount, notAdolescentCount } = result;

  const chipClass = status === 'valid'
    ? 'dose-val-chip dose-val-valid'
    : status === 'invalid'
      ? 'dose-val-chip dose-val-invalid'
      : 'dose-val-chip dose-val-unknown';

  const chipLabel = notAdolescentCount
    ? 'Valid — not counted (given before age 10)'
    : status === 'valid' ? 'Valid' : status === 'invalid' ? 'Invalid ✕ does not count' : 'Unknown';

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

export default function RecCard({ rec, doses = [], doseValidations = [] }) {
  const { vaccine, status, doseLabel, dueToday, earliestNextDate, brands, note, citations } = rec;
  const isNeutral = status === 'complete' || status === 'not-indicated' || status === 'deferred';
  const isShared = status === 'shared-decision';
  const given = doses.length;

  return (
    <div className={`rec-card status-${status}`} data-testid="rec-card">
      <div className="rec-card-inner">
        <div className="rec-card-head">
          <span className="rec-vaccine-name">{vaccine}</span>
          <span className={`status-badge ${status}`}>{STATUS_LABELS[status] || status}</span>
          {dueToday && !isNeutral && (
            <span className={`due-pill${isShared ? ' due-pill-optional' : ''}`}>
              {isShared ? 'Optional today' : 'Today'}
            </span>
          )}
        </div>

        {/* Series progress — what's recorded vs what's due */}
        {given > 0 && (
          <div className="rec-progress" data-testid="rec-progress">
            <span className="rec-progress-label">Recorded:</span>
            <ul className="rec-progress-list">
              {doses.map((d, i) => (
                <li key={i} className="rec-progress-dose-row">
                  <span className="rec-progress-dose-text">{describeDose(d, i)}</span>
                  <DoseValidation result={doseValidations[i]} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rec-dose-label">{doseLabel}</div>

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
