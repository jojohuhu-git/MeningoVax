// @vitest-environment happy-dom
// K3 (2026-09-26): the Ctrl/Cmd+E / Ctrl/Cmd+Y shortcuts (and their on-screen
// hints) are gone. "No previous doses" and "Yes, record doses" are answered
// by Tab-and-Enter or a click, like every other button in the wizard.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import StepHistory from '../StepHistory.jsx';

function setup(doses = []) {
  const onChange = vi.fn();
  render(
    <StepHistory vaccine="MenACWY" doses={doses} onChange={onChange} brandOptions={[]} />
  );
  return { onChange };
}

describe('StepHistory "No previous doses" via Tab and Enter', () => {
  it('Tab lands on "No previous doses" first, and Enter answers no and clears history', async () => {
    const user = userEvent.setup();
    const { onChange } = setup([{ date: '2020-01-01', brand: '' }]);

    await user.tab();
    expect(document.activeElement.textContent).toMatch(/No previous doses/);
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith([]);
    expect(screen.getByText('No previous doses').closest('button').className).toMatch(/selected/);
  });

  it('a second Tab then Enter answers "Yes, record doses"', async () => {
    const user = userEvent.setup();
    setup();

    await user.tab();
    await user.tab();
    expect(document.activeElement.textContent).toMatch(/Yes, record doses/);
    await user.keyboard('{Enter}');

    expect(screen.getByText('Yes, record doses').closest('button').className).toMatch(/selected/);
  });

  it('Ctrl+E and Ctrl+Y no longer do anything — no modifier shortcuts remain', () => {
    const { onChange } = setup([{ date: '2020-01-01', brand: '' }]);
    fireEvent.keyDown(document, { key: 'e', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'y', metaKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('no on-screen hint mentions Ctrl, Cmd or Alt', () => {
    setup();
    expect(screen.queryByText(/Ctrl|Cmd|Alt|⌘/)).toBeNull();
  });
});
