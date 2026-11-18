// @vitest-environment happy-dom
// Port Phase 5 B1 (PneumoVax's Remy ruling, 2026-11-07) with STOP F1 Q9a
// (owner, 2026-11-17). The date on the card's top line is the ADVISED date, so
// the line says "Next dose due <date>", never "eligible". The earlier date the
// minimum allows is in the note beneath it.
//
// The owner's own Q9a patient: asplenia, 20 y, Bexsero 11/3/26, seen 11/17.
// Before: "Next dose not yet due - eligible Dec 1, 2026" (the 4-week minimum)
// over a note saying "1–2 months after dose 1".
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { recommend } from '../../logic/recommend.js';
import RecCard from '../RecCard.jsx';

const menbCard = (input) => recommend({ menacwyDoses: [], menbDoses: [], ...input }).menb[0];
const B = (date) => ({ date, brand: 'Bexsero (MenB)' });

describe('Phase 5 B1: "Next dose due <date>"', () => {
  it('Q9a patient on 11/17: "Next dose due Dec 3, 2026", and the note names Dec 1', () => {
    const rec = menbCard({ dob: '2006-01-01', today: '2026-11-17', riskIds: ['asplenia'], menbDoses: [B('2026-11-03')] });
    const { container } = render(<RecCard rec={rec} />);
    expect(container.querySelector('.next-date').textContent).toBe('Next dose due Dec 3, 2026');
    expect(container.textContent).toContain('It can be given from Dec 1, 2026 if needed (minimum 4 weeks).');
    expect(container.textContent).not.toMatch(/eligible/i);
  });

  it('a card due today shows no date line', () => {
    const rec = menbCard({ dob: '2006-01-01', today: '2026-12-03', riskIds: ['asplenia'], menbDoses: [B('2026-11-03')] });
    const { container } = render(<RecCard rec={rec} />);
    expect(container.querySelector('.next-date')).toBeNull();
  });
});
