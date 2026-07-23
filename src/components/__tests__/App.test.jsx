// @vitest-environment happy-dom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App.jsx';

// Helper: navigate forward N steps without validation errors
function getNextBtn() {
  return screen.getByRole('button', { name: /next/i });
}
function getBackBtn() {
  return screen.queryByRole('button', { name: /back/i });
}

// A2: chips were removed — DOB is now the primary entry, Years/Months the
// fallback. Tests use the Years/Months fallback (no calendar picker needed)
// via the "Years / Months (if DOB unknown)" toggle, already the case for a
// fresh Age step only when a prior mode was selected; the Age step defaults
// to DOB mode, so switch to Years/Months explicitly.
function enterAgeYears(years) {
  fireEvent.click(screen.getByText(/years \/ months/i));
  fireEvent.change(screen.getByLabelText('Years'), { target: { value: String(years) } });
}

describe('App wizard', () => {
  it('renders the Age step on initial load', () => {
    render(<App />);
    expect(screen.getByText('Patient Age')).toBeDefined();
    expect(screen.getByText(/date of birth is recommended/i)).toBeDefined();
  });

  it('shows stepper with 5 steps', () => {
    render(<App />);
    // Stepper labels
    expect(screen.getByText('Age')).toBeDefined();
    expect(screen.getByText('Risks')).toBeDefined();
    expect(screen.getByText('MenACWY')).toBeDefined();
    expect(screen.getByText('MenB')).toBeDefined();
    expect(screen.getByText('Results')).toBeDefined();
  });

  it('shows error if Next is clicked without entering age', () => {
    render(<App />);
    fireEvent.click(getNextBtn());
    expect(screen.getByText(/please enter a valid age/i)).toBeDefined();
  });

  it('does not show Back button on step 0', () => {
    render(<App />);
    expect(getBackBtn()).toBeNull();
  });

  it('advances to Risks step after entering an age', () => {
    render(<App />);
    enterAgeYears(14);
    fireEvent.click(getNextBtn());
    expect(screen.getByText('Risk Factors')).toBeDefined();
  });

  it('can go back from Risks to Age', () => {
    render(<App />);
    enterAgeYears(14);
    fireEvent.click(getNextBtn());
    expect(screen.getByText('Risk Factors')).toBeDefined();
    fireEvent.click(getBackBtn());
    expect(screen.getByText('Patient Age')).toBeDefined();
  });

  it('drives through the full wizard and renders MenACWY rec card at Results', () => {
    render(<App />);

    // Step 0: Age — enter an adult age
    enterAgeYears(23);
    fireEvent.click(getNextBtn());

    // Step 1: Risks — select asplenia
    expect(screen.getByText('Risk Factors')).toBeDefined();
    const asplenia = screen.getByLabelText(/anatomic or functional asplenia/i, { exact: false });
    fireEvent.click(asplenia);
    fireEvent.click(getNextBtn());

    // Step 2: MenACWY history — no doses
    expect(screen.getByText('MenACWY History')).toBeDefined();
    fireEvent.click(screen.getByText('No previous doses'));
    fireEvent.click(getNextBtn());

    // Step 3: MenB history — no doses
    expect(screen.getByText('MenB History')).toBeDefined();
    fireEvent.click(screen.getByText('No previous doses'));
    // Last step button says "View Results"
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));

    // Step 4: Results
    // Should show at least one rec card
    const cards = screen.getAllByTestId('rec-card');
    expect(cards.length).toBeGreaterThan(0);

    // MenACWY risk-based rec should appear for asplenia adult
    // (multiple elements will say "MenACWY" — stepper label + section title + card — use getAllByText)
    const menacwyMatches = screen.getAllByText('MenACWY');
    expect(menacwyMatches.length).toBeGreaterThan(0);

    // At least one citation link should be present
    const links = document.querySelectorAll('a[href*="cdc.gov"], a[href*="ncbi.nlm.nih.gov"], a[href*="immunize.org"]');
    expect(links.length).toBeGreaterThan(0);
  });

  // E6/D6: a color key explaining the box colors, toggled the same way as
  // "Adjust age" / "Recorded doses". Keyboard-shortcut hints live at the
  // controls they act on (D6b), not in this panel.
  it('toggles a color key explaining box colors', () => {
    render(<App />);
    enterAgeYears(23);
    fireEvent.click(getNextBtn());
    fireEvent.click(getNextBtn()); // no risks
    fireEvent.click(screen.getByText('No previous doses'));
    fireEvent.click(getNextBtn());
    fireEvent.click(screen.getByText('No previous doses'));
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));

    expect(screen.queryByTestId('legend-panel')).toBeNull();
    const colorKeyBtn = screen.getByRole('button', { name: /color key/i });
    fireEvent.click(colorKeyBtn);
    const panel = screen.getByTestId('legend-panel');
    expect(panel.textContent).toMatch(/due today/i);
    expect(panel.textContent).toMatch(/catch-up/i);
    expect(panel.textContent).toMatch(/shared decision/i);
    expect(panel.textContent).toMatch(/on time/i);
    expect(panel.textContent).toMatch(/off-window/i);
    expect(panel.textContent).toMatch(/invalid/i);

    fireEvent.click(colorKeyBtn);
    expect(screen.queryByTestId('legend-panel')).toBeNull();
  });

  it('shows "Start Over" button on Results and resets to Age step', () => {
    render(<App />);

    enterAgeYears(23);
    fireEvent.click(getNextBtn());
    fireEvent.click(getNextBtn()); // risks
    fireEvent.click(getNextBtn()); // menacwy history
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));

    const startOver = screen.getByRole('button', { name: /start over/i });
    expect(startOver).toBeDefined();
    fireEvent.click(startOver);
    expect(screen.getByText('Patient Age')).toBeDefined();
  });

  it('shows pentavalent card when both antigens are due (adult + asplenia, no history)', () => {
    render(<App />);

    // Adult (23y) + asplenia → MenACWY D1 due today + MenB D1 due today → pentavalent eligible
    enterAgeYears(23);
    fireEvent.click(getNextBtn()); // → Risks

    const asplenia = screen.getByLabelText(/anatomic or functional asplenia/i, { exact: false });
    fireEvent.click(asplenia);
    fireEvent.click(getNextBtn()); // → MenACWY history

    // No MenACWY history
    fireEvent.click(screen.getByText('No previous doses'));
    fireEvent.click(getNextBtn()); // → MenB history

    // No MenB history
    fireEvent.click(screen.getByText('No previous doses'));
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));

    // Pentavalent card should appear (both MenACWY + MenB are dueToday for asplenia adult)
    const pentaCard = document.querySelector('[data-testid="penta-card"]');
    expect(pentaCard).not.toBeNull();
  });

  // B2/B3: separate injections are the first option; the single pentavalent
  // shot is the second option, with explicit labels (D2: no "primary"/
  // "alternative" qualifiers).
  it('orders separate injections before the pentavalent option, with explicit labels', () => {
    render(<App />);
    enterAgeYears(23);
    fireEvent.click(getNextBtn());
    const asplenia = screen.getByLabelText(/anatomic or functional asplenia/i, { exact: false });
    fireEvent.click(asplenia);
    fireEvent.click(getNextBtn());
    fireEvent.click(screen.getByText('No previous doses'));
    fireEvent.click(getNextBtn());
    fireEvent.click(screen.getByText('No previous doses'));
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));

    const separateLabel = screen.getByTestId('option-separate-label');
    const pentaLabel = screen.getByTestId('option-penta-label');
    expect(separateLabel.textContent).toMatch(/option 1.*two separate injections/i);
    expect(pentaLabel.textContent).toMatch(/option 2.*pentavalent/i);

    // DOM order: separate-injections option comes before the pentavalent card.
    const position = separateLabel.compareDocumentPosition(pentaLabel);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // The pentavalent card makes clear it replaces both shots, not an extra one.
    expect(screen.getByTestId('penta-card').textContent).toMatch(/replaces both shots/i);
  });

  // B4: card fill communicates timing (due=green, catch-up=amber, neither
  // urgent=neutral), never the clinical reason. Risk-based is a badge color
  // (purple), not a full red card fill — red stays reserved for invalid doses.
  it('gives a risk-based due-today card a green (timing) fill and a purple (reason) badge, not red', () => {
    render(<App />);
    enterAgeYears(23);
    fireEvent.click(getNextBtn());
    const asplenia = screen.getByLabelText(/anatomic or functional asplenia/i, { exact: false });
    fireEvent.click(asplenia);
    fireEvent.click(getNextBtn());
    fireEvent.click(screen.getByText('No previous doses'));
    fireEvent.click(getNextBtn());
    fireEvent.click(screen.getByText('No previous doses'));
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));

    const cards = screen.getAllByTestId('rec-card');
    const menacwyCard = cards.find(c => c.textContent.includes('MenACWY'));
    expect(menacwyCard.className).toMatch(/timing-due/);
    expect(menacwyCard.className).not.toMatch(/status-risk-based/);

    const badge = menacwyCard.querySelector('.status-badge.risk-based');
    expect(badge).not.toBeNull();
  });

  // B6: a "complete" status with a booster still due later must show a
  // prominent banner with an approximate date, not read as fully done.
  it('shows a prominent booster-due banner for a 12y with dose 1 recorded (booster due at 16y)', () => {
    render(<App />);
    enterAgeYears(12);
    fireEvent.click(getNextBtn()); // → Risks
    fireEvent.click(getNextBtn()); // → MenACWY history (no risks)

    fireEvent.click(screen.getByText('Yes, record doses'));
    fireEvent.click(screen.getByTitle('Add dose (Ctrl/Cmd+A)'));
    const doseDateInput = document.querySelector('input[type="date"]');
    fireEvent.change(doseDateInput, { target: { value: '2025-06-01' } });
    fireEvent.click(getNextBtn()); // → MenB history
    fireEvent.click(screen.getByText('No previous doses'));
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));

    const banner = screen.getByTestId('booster-due-banner');
    expect(banner.textContent).toMatch(/booster still due.*approximately/i);
  });

  it('renders MenB not-indicated for young child without risk', () => {
    render(<App />);
    enterAgeYears(5);
    fireEvent.click(getNextBtn());
    fireEvent.click(getNextBtn()); // risks
    fireEvent.click(getNextBtn()); // menacwy
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));

    // MenB should show not-indicated for a healthy child
    const cards = screen.getAllByTestId('rec-card');
    const texts = cards.map(c => c.textContent);
    const menbCard = texts.find(t => t.includes('MenB'));
    expect(menbCard).toBeDefined();
    expect(menbCard).toMatch(/not indicated|not routinely/i);
  });

  // A2: DOB is now the default/primary Age entry; there is no separate coarse
  // age-band question that could contradict a dose date entered later.
  describe('A2: date of birth is the default entry, no separate age-band chips', () => {
    it('Age step defaults to the Date of Birth field, not an age-band picker', () => {
      render(<App />);
      expect(screen.getByLabelText('Date of Birth')).toBeDefined();
      // The old coarse age-band buttons no longer exist.
      expect(screen.queryByText('Adolescent (11–18y)')).toBeNull();
      expect(screen.queryByText('Adult (19+)')).toBeNull();
    });

    it('entering a DOB derives the age band automatically (no separate question)', () => {
      render(<App />);
      fireEvent.change(screen.getByLabelText('Date of Birth'), { target: { value: '2003-03-28' } });
      // Age badge shows the derived years/months and band together.
      expect(screen.getByText(/23 years.*Adult/i)).toBeDefined();
    });

    it('DOB-derived age lets a ≥16y-dosed adult resolve to complete, matching the A1 case', () => {
      render(<App />);
      fireEvent.change(screen.getByLabelText('Date of Birth'), { target: { value: '2003-03-28' } });
      fireEvent.click(getNextBtn()); // → Risks
      fireEvent.click(getNextBtn()); // → MenACWY history (no risks)

      fireEvent.click(screen.getByText('Yes, record doses'));
      fireEvent.click(screen.getByTitle('Add dose (Ctrl/Cmd+A)'));
      const dateInputs = screen.getAllByDisplayValue('');
      // First empty date input is the new dose row's date field.
      const doseDateInput = document.querySelector('input[type="date"]:not(#dob-input)');
      fireEvent.change(doseDateInput, { target: { value: '2019-07-08' } });
      fireEvent.click(getNextBtn()); // → MenB history
      fireEvent.click(screen.getByText('No previous doses'));
      fireEvent.click(screen.getByRole('button', { name: /view results/i }));

      const cards = screen.getAllByTestId('rec-card');
      const menacwyCard = cards.map(c => c.textContent).find(t => t.includes('MenACWY'));
      expect(menacwyCard).toMatch(/complete/i);
    });
  });

  // B7: keyboard shortcuts — Ctrl/Cmd+A adds a dose row, Enter advances the
  // stepper (without submitting a partial form or destructive action).
  describe('B7: keyboard shortcuts', () => {
    it('Ctrl+A adds a dose row while recording MenACWY history', () => {
      render(<App />);
      enterAgeYears(14);
      fireEvent.click(getNextBtn());
      fireEvent.click(getNextBtn());
      fireEvent.click(screen.getByText('Yes, record doses'));

      expect(document.querySelectorAll('.dose-row').length).toBe(0);
      fireEvent.keyDown(document, { key: 'a', ctrlKey: true });
      expect(document.querySelectorAll('.dose-row').length).toBe(1);
    });

    it('Cmd+A (metaKey) also adds a dose row', () => {
      render(<App />);
      enterAgeYears(14);
      fireEvent.click(getNextBtn());
      fireEvent.click(getNextBtn());
      fireEvent.click(screen.getByText('Yes, record doses'));

      fireEvent.keyDown(document, { key: 'a', metaKey: true });
      expect(document.querySelectorAll('.dose-row').length).toBe(1);
    });

    it('Enter advances from the Age step to Risks', () => {
      render(<App />);
      enterAgeYears(14);
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(screen.getByText('Risk Factors')).toBeDefined();
    });

    it('Enter does not advance past the Results step (no crash, no reset)', () => {
      render(<App />);
      enterAgeYears(23);
      fireEvent.click(getNextBtn());
      fireEvent.click(getNextBtn());
      fireEvent.click(screen.getByText('No previous doses'));
      fireEvent.click(getNextBtn());
      fireEvent.click(screen.getByText('No previous doses'));
      fireEvent.click(screen.getByRole('button', { name: /view results/i }));

      expect(screen.getByText('Vaccine Recommendation')).toBeDefined();
      fireEvent.keyDown(document, { key: 'Enter' });
      // Still on Results — did not reset or error.
      expect(screen.getByText('Vaccine Recommendation')).toBeDefined();
    });
  });

  // Item 1 (2026-07-23): the wizard's dose-history editor should focus a
  // newly-added row's (empty) date input, so a clinician doesn't have to
  // click into it separately.
  describe('Item 1: auto-focus the date field on a newly added dose row (wizard)', () => {
    it('focuses the new row date input when "+ Add dose" is clicked in StepHistory', () => {
      render(<App />);
      enterAgeYears(23);
      fireEvent.click(getNextBtn());
      fireEvent.click(getNextBtn()); // no risks
      fireEvent.click(screen.getByText('Yes, record doses'));

      fireEvent.click(screen.getByTitle('Add dose (Ctrl/Cmd+A)'));

      const dateInput = document.querySelector('input[type="date"]');
      expect(dateInput).not.toBeNull();
      expect(document.activeElement).toBe(dateInput);
    });
  });

  // Item 5 (2026-07-23): StepHistory and the Results "Recorded doses" panel
  // now share one DoseEditor component, so the MenB family-lock guidance
  // that used to appear only in StepHistory must also appear in Results.
  describe('Item 5: MenB family-lock guidance stays available after picking a brand in the wizard', () => {
    it('shows "Family locked: MenB-4C" in StepHistory after selecting Bexsero for dose 1', () => {
      render(<App />);
      enterAgeYears(20);
      fireEvent.click(getNextBtn());
      fireEvent.click(getNextBtn()); // no risks
      fireEvent.click(screen.getByText('No previous doses')); // MenACWY: none
      fireEvent.click(getNextBtn());

      expect(screen.getByText('MenB History')).toBeDefined();
      fireEvent.click(screen.getByText('Yes, record doses'));
      fireEvent.click(screen.getByTitle('Add dose (Ctrl/Cmd+A)'));
      const brandSelect = document.querySelector('select');
      fireEvent.change(brandSelect, { target: { value: 'Bexsero' } });

      expect(screen.getByText(/Family locked: MenB-4C/i)).toBeDefined();
    });
  });
});
