import React, { useContext, useState } from 'react';
import { Chevron } from './icons.jsx';
import { OpenAllDisclosures } from './openAllDisclosures.js';

export default function Disclaimer() {
  // Port Phase 6.3, Q10 (owner, 2026-11-19, as PneumoVax §WORD-1): the
  // paragraph about risk history goes behind a click; the first half stays in
  // view on every page. The words are unchanged, only moved.
  // The prose tool opens it (openAllDisclosures.js); the app never does.
  const openAll = useContext(OpenAllDisclosures);
  const [open, setOpen] = useState(openAll);
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
      from FDA package insert labeling.{' '}
      <button
        type="button"
        className="rec-note-toggle disclaimer-toggle"
        data-testid="disclaimer-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        About risk history<Chevron open={open} />
      </button>
      {open && (
        <span className="disclaimer-more" data-testid="disclaimer-more">
          {' '}This app tracks the patient's <em>current</em> risk
          status only — it does not record when a risk factor started or ended. For an older dose
          given before the risk-based age threshold, whether it counted may depend on the
          patient's risk status on that specific date; when that matters, a "Needs input" prompt
          asks for it directly.
        </span>
      )}
    </div>
  );
}
