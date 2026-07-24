// @vitest-environment happy-dom
// Handoff 2026-07-24 change #1: Cmd+N / Ctrl+N are intercepted by the browser
// before the page ever sees them (new-window shortcut) and can't be caught,
// so "No previous doses" moves to Ctrl/Cmd+E ("Empty") instead. The old
// Alt/Cmd+N alias is dropped entirely.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StepHistory from '../StepHistory.jsx';

function setup(doses = []) {
  const onChange = vi.fn();
  render(
    <StepHistory vaccine="MenACWY" doses={doses} onChange={onChange} brandOptions={[]} />
  );
  return { onChange };
}

describe('StepHistory "No previous doses" shortcut (Ctrl/Cmd+E)', () => {
  it('Ctrl+E answers "No previous doses" and clears history', () => {
    const { onChange } = setup([{ date: '2020-01-01', brand: '' }]);
    fireEvent.keyDown(document, { key: 'e', ctrlKey: true });
    expect(onChange).toHaveBeenCalledWith([]);
    expect(screen.getByText('No previous doses').closest('button').className).toMatch(/selected/);
  });

  it('Cmd+E (metaKey) also answers "No previous doses"', () => {
    const { onChange } = setup();
    fireEvent.keyDown(document, { key: 'e', metaKey: true });
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('the old Alt/Cmd+N shortcut no longer fires', () => {
    const { onChange } = setup();
    fireEvent.keyDown(document, { key: 'n', altKey: true });
    fireEvent.keyDown(document, { key: 'n', metaKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('the on-screen hint reads Ctrl/Cmd+E, not Alt/Cmd+N', () => {
    setup();
    expect(screen.getByText('Ctrl/Cmd+E')).toBeTruthy();
    expect(screen.queryByText('Alt/Cmd+N')).toBeNull();
  });
});
