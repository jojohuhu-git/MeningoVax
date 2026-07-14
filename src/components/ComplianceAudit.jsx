import React from 'react';
import { analyzeHistory, ageAtDoseFromDate } from '../logic/validate.js';
import { fmtDate, fmtAgeMonths, stripAntigen } from '../logic/format.js';

// B1: a consolidated compliance-audit table — every recorded dose (both
// vaccines) with dose number, date, age at administration, and validity +
// reason, in one place. Reuses analyzeHistory()'s output; does not
// recompute validity.
function auditRows(vaccine, doses, ageMonths, riskIds, today) {
  const ref = today || new Date().toISOString().slice(0, 10);
  // analyzeHistory() sorts doses chronologically before validating (undated
  // doses first) — perDose is parallel to that SORTED order, not the raw
  // input order, so re-sort the same way here to keep dose objects aligned
  // with their validity results.
  const sorted = [...(doses ?? []).filter(Boolean)].sort((a, b) => {
    const da = a?.date || '';
    const db = b?.date || '';
    if (da && db) return da < db ? -1 : da > db ? 1 : 0;
    if (!da && db) return -1;
    if (da && !db) return 1;
    return 0;
  });
  const { perDose } = analyzeHistory(vaccine, doses, ageMonths, riskIds, ref);
  return perDose.map((result, i) => {
    const dose = sorted[i];
    const ageAtDose = ageAtDoseFromDate(dose, ageMonths, ref);
    return { vaccine, dose, index: i, result, ageAtDose };
  });
}

function ValidityChip({ result }) {
  const { status, notAdolescentCount } = result;
  const cls = notAdolescentCount
    ? 'audit-chip audit-chip-valid'
    : status === 'valid'
      ? 'audit-chip audit-chip-valid'
      : status === 'invalid'
        ? 'audit-chip audit-chip-invalid'
        : 'audit-chip audit-chip-unknown';
  const label = notAdolescentCount
    ? 'Valid — not counted'
    : status === 'valid' ? 'Valid' : status === 'invalid' ? 'Invalid' : 'Unknown';
  return <span className={cls}>{label}</span>;
}

export default function ComplianceAudit({ ageMonths, riskIds, menacwyDoses, menbDoses, today }) {
  const rows = [
    ...auditRows('MenACWY', menacwyDoses, ageMonths ?? 0, riskIds, today),
    ...auditRows('MenB', menbDoses, ageMonths ?? 0, riskIds, today),
  ];

  if (rows.length === 0) return null;

  return (
    <div className="audit-card" data-testid="compliance-audit">
      <div className="audit-title">Compliance Audit</div>
      <div className="audit-sub">Every recorded dose, in one place</div>
      <div className="audit-table-wrap">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Vaccine</th>
              <th>Dose</th>
              <th>Date</th>
              <th>Brand</th>
              <th>Age at administration</th>
              <th>Validity</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>{row.vaccine}</td>
                <td>D{row.index + 1}</td>
                <td>{row.dose?.date ? fmtDate(row.dose.date) : 'Unknown'}</td>
                <td>{row.dose?.brand ? stripAntigen(row.dose.brand) : 'Unknown'}</td>
                <td>{row.ageAtDose != null ? fmtAgeMonths(row.ageAtDose) : 'Unknown'}</td>
                <td><ValidityChip result={row.result} /></td>
                <td className="audit-reason-cell">
                  {row.result.reasons && row.result.reasons.length > 0
                    ? row.result.reasons.join(' ')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
