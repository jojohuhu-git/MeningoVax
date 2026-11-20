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
      {/* P71 (review v10, owner 2026-11-20): about half the length. */}
      <strong>Clinical decision support</strong>, not a substitute for clinical judgment.
      Check recommendations against current{' '}
      <a href="https://www.cdc.gov/vaccines/hcp/imz-schedules/index.html" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
        ACIP/CDC schedules
      </a>. Each recommendation cites its source. Ages and intervals follow ACIP, which can
      differ from FDA labeling.{' '}
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
          {' '}The app records <em>current</em> risk only. When an earlier dose depends on the
          risk on its date, a "Needs input" question asks.
        </span>
      )}
    </div>
  );
}
