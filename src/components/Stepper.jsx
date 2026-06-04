import React from 'react';

export default function Stepper({ steps, current }) {
  return (
    <nav className="stepper" aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={label}
            className={`stepper-item${active ? ' active' : ''}${done ? ' done' : ''}`}
            aria-current={active ? 'step' : undefined}
          >
            <div className="stepper-dot">{done ? '✓' : i + 1}</div>
            <div className="stepper-label">{label}</div>
          </div>
        );
      })}
    </nav>
  );
}
