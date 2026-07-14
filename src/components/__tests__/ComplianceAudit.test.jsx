// @vitest-environment happy-dom
// B1: a consolidated compliance-audit table listing every recorded dose
// (both vaccines) with dose number, date, age at administration, and
// validity + reason.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ComplianceAudit from '../ComplianceAudit.jsx';

describe('ComplianceAudit', () => {
  it('renders nothing when no doses are recorded', () => {
    const { container } = render(
      <ComplianceAudit ageMonths={132} riskIds={[]} menacwyDoses={[]} menbDoses={[]} today="2026-07-13" />
    );
    expect(container.querySelector('[data-testid="compliance-audit"]')).toBeNull();
  });

  it('lists dose number, date, age at administration, and validity for each recorded dose', () => {
    render(
      <ComplianceAudit
        ageMonths={280}
        riskIds={[]}
        menacwyDoses={[
          { date: '2017-10-26', brand: '' },
          { date: '2019-07-08', brand: '' },
        ]}
        menbDoses={[]}
        today="2026-07-13"
      />
    );
    expect(screen.getByTestId('compliance-audit')).toBeDefined();
    expect(screen.getByText('D1')).toBeDefined();
    expect(screen.getByText('D2')).toBeDefined();
    expect(screen.getByText('Oct 26, 2017')).toBeDefined();
    expect(screen.getByText('Jul 8, 2019')).toBeDefined();
    // Both doses are valid.
    expect(screen.getAllByText('Valid').length).toBe(2);
  });

  it('shows the honest "not counted" chip (not "Invalid") for a pre-age-10 MenACWY dose', () => {
    render(
      <ComplianceAudit
        ageMonths={271}
        riskIds={[]}
        menacwyDoses={[
          { date: '2005-03-14', brand: '' }, // ~15 months — pre-age-10
          { date: '2018-04-10', brand: '' },
        ]}
        menbDoses={[]}
        today="2026-07-13"
      />
    );
    expect(screen.getByText('Valid — not counted')).toBeDefined();
    expect(screen.getByText(/before age 10.*does not count/i)).toBeDefined();
  });

  it('combines MenACWY and MenB doses in one table', () => {
    render(
      <ComplianceAudit
        ageMonths={280}
        riskIds={[]}
        menacwyDoses={[{ date: '2019-07-08', brand: '' }]}
        menbDoses={[{ date: '2020-01-15', brand: 'Bexsero' }]}
        today="2026-07-13"
      />
    );
    const table = screen.getByTestId('compliance-audit');
    expect(table.textContent).toMatch(/MenACWY/);
    expect(table.textContent).toMatch(/MenB/);
  });

  it('computes a real age at administration when `today` is omitted (regression: was NaN)', () => {
    render(
      <ComplianceAudit
        ageMonths={280}
        riskIds={[]}
        menacwyDoses={[{ date: '2017-10-26', brand: '' }]}
        menbDoses={[]}
      />
    );
    const table = screen.getByTestId('compliance-audit');
    expect(table.textContent).not.toMatch(/NaN/);
  });

  it('keeps dose rows aligned with their validity result when doses are entered out of chronological order', () => {
    render(
      <ComplianceAudit
        ageMonths={280}
        riskIds={[]}
        // Entered out of order: later dose first.
        menacwyDoses={[
          { date: '2019-07-08', brand: '' },
          { date: '2017-10-26', brand: '' },
        ]}
        menbDoses={[]}
        today="2026-07-13"
      />
    );
    const table = screen.getByTestId('compliance-audit');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    // Displayed chronologically regardless of entry order: 2017 dose is D1.
    expect(rows[0].textContent).toMatch(/Oct 26, 2017/);
    expect(rows[1].textContent).toMatch(/Jul 8, 2019/);
    // Both are valid — no misaligned "Invalid" from index mismatch.
    expect(table.textContent).not.toMatch(/Invalid/);
  });
});
