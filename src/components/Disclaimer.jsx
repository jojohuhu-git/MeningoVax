import React from 'react';

export default function Disclaimer() {
  return (
    <div className="disclaimer" role="note" aria-label="Clinical disclaimer">
      <strong>Clinical decision support only.</strong> MeningoVax is not a substitute for clinical judgment.
      Verify all recommendations against current{' '}
      <a href="https://www.cdc.gov/vaccines/hcp/imz-schedules/index.html" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
        ACIP/CDC immunization schedules
      </a>{' '}
      before administering vaccines. Every recommendation displayed includes a citation link
      to its source (CDC schedule notes, ACIP MMWR, or immunize.org Ask the Experts).
      Age eligibility and dose intervals shown here reflect ACIP guidance, which may differ
      from FDA package insert labeling.
    </div>
  );
}
