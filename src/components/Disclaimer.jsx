import React from 'react';

export default function Disclaimer() {
  // L7 (review v10, owner 2026-11-20): the risk-history sentence moved from
  // here to under the "Needs input" question it explains (RecCard.jsx), and
  // shows only when that question does.
  return (
    <div className="disclaimer" role="note" aria-label="Clinical disclaimer">
      {/* P71 (review v10, owner 2026-11-20): about half the length. */}
      <strong>Clinical decision support</strong>, not a substitute for clinical judgment.
      Check recommendations against current{' '}
      <a href="https://www.cdc.gov/vaccines/hcp/imz-schedules/index.html" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
        ACIP/CDC schedules
      </a>. Each recommendation cites its source. Ages and intervals follow ACIP, which can
      differ from FDA labeling.
    </div>
  );
}
