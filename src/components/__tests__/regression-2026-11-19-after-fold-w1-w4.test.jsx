// @vitest-environment happy-dom
// After the fold (owner answers, 2026-11-19; docs/archive/decisions-2026-11-19-after-the-fold.md).
// Four wording answers, each asked with a worked patient and a measure over the grid:
//   W1  the routine "Booster (16y)" card's badge says "Booster due today"
//   W2  its "Why this" says "before 16 years", not "at 11–12 years"
//   W3  the 13–15 catch-up card's booster line says "at age 16–18"
//   W4  the healthy MenB "Why this" drops the sentence that repeated its first one
// Words only: no dose, date, status or source moves. Every patient here is synthetic.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { recommend } from '../../logic/recommend.js';
import RecCard, { statusPillLabel } from '../RecCard.jsx';

const TODAY = '2026-11-19';
const DOB_16 = '2010-11-19'; // 16 today
const healthy = (dob, acwy = [], menb = []) => ({
  dob, riskIds: [], today: TODAY,
  menacwyDoses: acwy.map(([date, brand]) => ({ date, brand })),
  menbDoses: menb.map(([date, brand]) => ({ date, brand })),
});

describe('W1: the routine 16-year booster card says "Booster due today"', () => {
  // Healthy 16-year-old, MenQuadfi at 11, nothing since.
  const card = recommend(healthy(DOB_16, [['2021-12-01', 'MenQuadfi (MenACWY)']])).menacwy[0];
  it('worked patient: label and badge agree', () => {
    expect(card.doseLabel).toBe('Booster (16y)');
    expect(card.dueToday).toBe(true);
    expect(statusPillLabel(card, false)).toBe('Booster due today');
  });
  it('the badge is what the card shows', () => {
    render(<RecCard rec={card} />);
    expect(screen.getByText('Booster due today')).toBeTruthy();
    expect(screen.queryByText('Dose due today')).toBeNull();
  });
  it('control: an 11-year-old\'s first dose still says "Due today, boosters to follow"', () => {
    const c = recommend(healthy('2015-11-19')).menacwy[0];
    expect(c.doseLabel).toBe('Dose 1 (routine, 11–12y)');
    expect(statusPillLabel(c, false)).toBe('Due today, boosters to follow');
  });
});

describe('W2: the 16-year booster\'s "Why this" says "before 16 years"', () => {
  const W2 = 'The dose given before 16 years is the first dose of the series, not the booster, so a booster is due from the 16th birthday.';
  it('worked patient: MenQuadfi at 15 (it was not given at 11–12)', () => {
    const c = recommend(healthy(DOB_16, [['2025-11-19', 'MenQuadfi (MenACWY)']])).menacwy[0];
    expect(c.doseLabel).toBe('Booster (16y)');
    expect(c.note.detail).toContain(W2);
    expect(c.note.detail).not.toMatch(/11–12 years/);
  });
  it('control: MenQuadfi at 11 reads the same, still true', () => {
    const c = recommend(healthy(DOB_16, [['2021-12-01', 'MenQuadfi (MenACWY)']])).menacwy[0];
    expect(c.note.detail).toContain(W2);
  });
});

describe('W3: the 13–15 catch-up card says the booster is at 16–18', () => {
  // Healthy 14-year-old, no MenACWY.
  const c = recommend(healthy('2012-11-19')).menacwy[0];
  it('worked patient: the in-view booster line and "Why this" give the same ages', () => {
    expect(c.doseLabel).toBe('Dose 1 (catch-up, 13–15y)');
    expect(c.boosterSummary).toBe('Booster: at age 16–18 years [c]');
    expect(c.note.detail).toMatch(/then the booster at 16–18 years/);
  });
  it('its source mark points at CDC\'s 13–15 sentence, which says 16–18', () => {
    expect(c.boosterCites.map((x) => x.key)).toEqual(['cdcCatchupAcwyBooster8Weeks']);
    expect(c.boosterCites[0].quote).toMatch(/booster at age 16–18 years/);
  });
  it('control: the 11-year-old keeps "at age 16" and ACIP\'s 11–12 sentence', () => {
    const r = recommend(healthy('2015-11-19')).menacwy[0];
    expect(r.boosterSummary).toBe('Booster: at age 16 years [c]');
    expect(r.boosterCites.map((x) => x.key)).toEqual(['acwyRoutine1112and16']);
  });
});

describe('W4: the healthy MenB "Why this" drops its repeated sentence', () => {
  const c = recommend(healthy(DOB_16)).menb[0];
  it('worked patient: healthy 16-year-old, no MenB', () => {
    expect(c.doseLabel).toBe('Dose 1 of 2 (shared clinical decision)');
    // extinct: W4 dropped this sentence on purpose, owner 2026-11-19
    expect(c.note.detail).not.toMatch(/A healthy 16–23-year-old may receive MenB by shared clinical decision-making\./);
    expect(c.note.detail).toMatch(/^Two MenB doses, at least 6 months apart, under shared clinical decision-making \[c\]\. The preferred age is 16 through 18 \[c\]\. Past 18, the series may still be given up to the 24th birthday\./);
    expect(c.note.detail.replace(/\[c\]/g, '').split(/\s+/).filter(Boolean)).toHaveLength(69);
  });
});
