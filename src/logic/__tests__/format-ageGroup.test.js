// Tests for ageGroup() boundary fixes (Task 2a):
//   - 10-year-old (120-131 mo) should be "Child (2-10y)", not "Adolescent (11-18y)"
//   - 18-year-old (216-227 mo) should be "Adolescent (11-18y)", not "Adult (19+)"

import { describe, it, expect } from 'vitest';
import { ageGroup } from '../format.js';

describe('ageGroup boundaries', () => {
  it('returns Infant for am < 24', () => {
    expect(ageGroup(0)).toBe('Infant (<2y)');
    expect(ageGroup(6)).toBe('Infant (<2y)');
    expect(ageGroup(23)).toBe('Infant (<2y)');
  });

  it('returns Child for am 24-131', () => {
    expect(ageGroup(24)).toBe('Child (2–10y)');
    expect(ageGroup(72)).toBe('Child (2–10y)');
    expect(ageGroup(120)).toBe('Child (2–10y)');  // exactly 10y - was mislabeled Adolescent
    expect(ageGroup(131)).toBe('Child (2–10y)');  // 10y11m
  });

  it('returns Adolescent for am 132-227', () => {
    expect(ageGroup(132)).toBe('Adolescent (11–18y)');  // exactly 11y
    expect(ageGroup(168)).toBe('Adolescent (11–18y)');  // 14y
    expect(ageGroup(216)).toBe('Adolescent (11–18y)');  // exactly 18y - was mislabeled Adult
    expect(ageGroup(227)).toBe('Adolescent (11–18y)');  // 18y11m
  });

  it('returns Adult for am >= 228', () => {
    expect(ageGroup(228)).toBe('Adult (19+)');
    expect(ageGroup(276)).toBe('Adult (19+)');
  });

  it('returns null for null input', () => {
    expect(ageGroup(null)).toBeNull();
  });

  it('has no gap between Child and Adolescent (131-132m boundary)', () => {
    expect(ageGroup(131)).toBe('Child (2–10y)');
    expect(ageGroup(132)).toBe('Adolescent (11–18y)');
  });

  it('has no gap between Adolescent and Adult (227-228m boundary)', () => {
    expect(ageGroup(227)).toBe('Adolescent (11–18y)');
    expect(ageGroup(228)).toBe('Adult (19+)');
  });
});
