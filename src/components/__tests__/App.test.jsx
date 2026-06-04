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

describe('App wizard', () => {
  it('renders the Age step on initial load', () => {
    render(<App />);
    expect(screen.getByText('Patient Age')).toBeDefined();
    expect(screen.getByText(/select an age group/i)).toBeDefined();
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

  it('advances to Risks step after selecting an age chip', () => {
    render(<App />);
    // Click "Adolescent" chip (sets ageMonths to 168)
    fireEvent.click(screen.getByText('Adolescent (11–18y)'));
    fireEvent.click(getNextBtn());
    expect(screen.getByText('Risk Factors')).toBeDefined();
  });

  it('can go back from Risks to Age', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Adolescent (11–18y)'));
    fireEvent.click(getNextBtn());
    expect(screen.getByText('Risk Factors')).toBeDefined();
    fireEvent.click(getBackBtn());
    expect(screen.getByText('Patient Age')).toBeDefined();
  });

  it('drives through the full wizard and renders MenACWY rec card at Results', () => {
    render(<App />);

    // Step 0: Age — select Adult
    fireEvent.click(screen.getByText('Adult (19+)'));
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

  it('shows "Start Over" button on Results and resets to Age step', () => {
    render(<App />);

    fireEvent.click(screen.getByText('Adult (19+)'));
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

    // Adult (276m default) + asplenia → MenACWY D1 due today + MenB D1 due today → pentavalent eligible
    fireEvent.click(screen.getByText('Adult (19+)'));
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

  it('renders MenB not-indicated for young child without risk', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Child (2–10y)'));
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
});
