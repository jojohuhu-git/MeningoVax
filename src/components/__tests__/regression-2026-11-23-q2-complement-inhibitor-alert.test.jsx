// @vitest-environment happy-dom
// The complement checkbox shows CDC's three complement-inhibitor points in one
// alert, where the transplant hard stop's banner sits (owner, Tier 1 Q2,
// 2026-11-22 "Add the note"; placement 2026-11-23 "put alert in the same place
// as CAR-T hard stop").
//
// CDC, "Clinical Guidance for Managing Meningococcal Disease Risk in Patients
// Receiving Complement Inhibitor Therapy" (Mar 6, 2026; read live 2026-11-22
// and 2026-11-23):
//   "Vaccination is also recommended but offers incomplete protection."
//   "In addition to vaccination, healthcare providers could consider
//    antimicrobial prophylaxis for complement inhibitor recipients to
//    potentially reduce meningococcal disease risk."
//   "Ideally, complete or update meningococcal vaccination at least 2 weeks
//    prior to administering the first dose of the complement inhibitor."
// The page is about inhibitor therapy only; the app's one checkbox also covers
// inherited complement deficiency, so the alert begins "If on a complement
// inhibitor".
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import Results from '../Results.jsx';
import { recommend } from '../../logic/recommend.js';
import { CITATIONS } from '../../data/refs.js';

afterEach(cleanup);

const TEXT = 'If on a complement inhibitor: vaccination gives incomplete protection. Consider antibiotic prophylaxis. Ideally finish these vaccines at least 2 weeks before the first inhibitor dose.';
const KEYS = ['cdcComplementIncompleteProtection', 'cdcComplementConsiderProphylaxis', 'cdcComplementVaccinate2WeeksBefore'];
const input = (riskIds) => ({ dob: '1996-03-10', today: '2026-09-15', riskIds, menacwyDoses: [], menbDoses: [] });
const show = (riskIds) => {
  const { today, ...state } = input(riskIds);
  return render(<Results state={state} today={today} onChange={() => {}} onReset={() => {}} />);
};

describe('Q2: the complement-inhibitor alert', () => {
  it('the engine gives the alert with one CDC sentence per clause, only for the complement box', () => {
    const a = recommend(input(['complement'])).complementAlert;
    expect(a.text.replace(/ ?\[c\]/g, '')).toBe(TEXT);
    expect(a.cites.map((c) => c.key)).toEqual(KEYS);
    expect((a.text.match(/\[c\]/g) ?? []).length).toBe(3);
    expect(recommend(input(['asplenia'])).complementAlert).toBeNull();
    expect(recommend(input([])).complementAlert).toBeNull();
  });

  it('each sentence is CDC\'s own, word for word, about complement patients', () => {
    expect(CITATIONS.cdcComplementIncompleteProtection.quote).toBe('Vaccination is also recommended but offers incomplete protection.');
    expect(CITATIONS.cdcComplementConsiderProphylaxis.quote).toBe('In addition to vaccination, healthcare providers could consider antimicrobial prophylaxis for complement inhibitor recipients to potentially reduce meningococcal disease risk.');
    expect(CITATIONS.cdcComplementVaccinate2WeeksBefore.quote).toBe('Ideally, complete or update meningococcal vaccination at least 2 weeks prior to administering the first dose of the complement inhibitor.');
    for (const k of KEYS) {
      expect(CITATIONS[k].url).toBe('https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html');
      expect(CITATIONS[k].population).toEqual(['acwy-complement', 'menb-complement']);
    }
  });

  it('the screen draws it first, above the summary line, where the hard stop sits; the cards still show', () => {
    const { getByTestId, container } = show(['complement']);
    const alert = getByTestId('complement-alert');
    expect(alert.textContent.replace(/ ?\[\d+\]/g, '').replace(/\s+/g, ' ')).toContain(TEXT.replace(/\.$/, ''));
    expect(container.firstChild.firstChild).toBe(alert);
    expect(alert.className).toContain('advisory-banner');
    expect([...alert.querySelectorAll('a.note-cite')].map((a) => a.textContent)).toEqual(['[1]', '[1]', '[1]']);
    expect(getByTestId('results-summary-line')).toBeTruthy();
  });

  it('no alert without the complement box', () => {
    const { queryByTestId } = show(['asplenia']);
    expect(queryByTestId('complement-alert')).toBeNull();
  });
});
