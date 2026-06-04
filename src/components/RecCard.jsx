import React from 'react';
import { fmtDate } from '../logic/format.js';

const STATUS_LABELS = {
  'due':              'Due',
  'catchup':          'Catch-up',
  'risk-based':       'Risk-Based',
  'shared-decision':  'Shared Decision',
  'complete':         'Complete',
  'not-indicated':    'Not Indicated',
  'deferred':         'Deferred',
};

// Truncate citation labels for display
function shortLabel(label, max = 55) {
  if (!label) return '';
  if (label.length <= max) return label;
  return label.slice(0, max - 1) + '…';
}

export default function RecCard({ rec }) {
  const { vaccine, status, doseLabel, dueToday, earliestNextDate, brands, note, citations } = rec;
  const isNeutral = status === 'complete' || status === 'not-indicated' || status === 'deferred';

  return (
    <div className={`rec-card status-${status}`} data-testid="rec-card">
      <div className="rec-card-inner">
        <div className="rec-card-head">
          <span className="rec-vaccine-name">{vaccine}</span>
          <span className={`status-badge ${status}`}>{STATUS_LABELS[status] || status}</span>
          {dueToday && !isNeutral && (
            <span className="due-pill">Due today</span>
          )}
        </div>

        <div className="rec-dose-label">{doseLabel}</div>

        {!dueToday && earliestNextDate && (
          <div className="next-date">
            Next dose eligible: {fmtDate(earliestNextDate)}
          </div>
        )}

        {brands && brands.length > 0 && !isNeutral && (
          <div className="rec-brands">
            <div className="rec-brands-title">Brand options — choose one</div>
            {brands.map((b, i) => (
              <div key={i} className="rec-brand-item">
                <span className="rec-brand-dot" />
                {b}
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
                {shortLabel(c.label)}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
