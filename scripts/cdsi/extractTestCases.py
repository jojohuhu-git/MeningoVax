#!/usr/bin/env python3
"""Pull CDC's meningococcal CDSI test patients out of CDC's two workbooks.

Port Phase 1.5 (2026-11-15), copied from PneumoVax's script of the same name;
only the vaccine groups, the output file and the `group` field differ.

Reads, with the Python standard library only (no openpyxl needed):
  cdc-files/cdsi-healthy-childhood-and-adult-test-cases-v4.46.xlsx   (vaccine groups "MCV", "MENB")
  cdc-files/CDSi-underlying-conditions-test-cases-v4.6.xlsx          (vaccine groups "Meningococcal", "Meningococcal B")
Writes cdc-files/meningo-test-cases.json, one object per patient. No interpretation:
dates are normalised to YYYY-MM-DD, everything else is CDC's text as printed.

Run:  python3 -I scripts/cdsi/extractTestCases.py
When CDC publishes new workbooks, replace the two files, update the names below, re-run.
"""
import zipfile, re, json, datetime, sys
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent / 'cdc-files'
SOURCES = [
    ('cdsi-healthy-childhood-and-adult-test-cases-v4.46.xlsx', 'FITS Exported TestCases', {'MCV', 'MENB'}, 'healthy-4.46'),
    ('CDSi-underlying-conditions-test-cases-v4.6.xlsx', 'Underlying Condition Test Cases', {'Meningococcal', 'Meningococcal B'}, 'conditions-4.6'),
]
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}

def colnum(ref):
    n = 0
    for ch in re.match(r'[A-Z]+', ref).group():
        n = n * 26 + ord(ch) - 64
    return n - 1

def read_sheet(path, sheet):
    z = zipfile.ZipFile(path)
    ss = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS):
            ss.append(''.join(t.text or '' for t in si.iter('{%s}t' % NS['m'])))
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    for sh in wb.find('m:sheets', NS):
        if sh.get('name') != sheet:
            continue
        tgt = rels[sh.get('{%s}id' % NS['r'])].lstrip('/')
        tgt = tgt if tgt.startswith('xl/') else 'xl/' + tgt
        rows = []
        for row in ET.fromstring(z.read(tgt)).iter('{%s}row' % NS['m']):
            vals = {}
            for c in row.findall('m:c', NS):
                t, v, isv = c.get('t'), c.find('m:v', NS), c.find('m:is', NS)
                if t == 's' and v is not None: val = ss[int(v.text)]
                elif t == 'inlineStr' and isv is not None: val = ''.join(x.text or '' for x in isv.iter('{%s}t' % NS['m']))
                elif v is not None: val = v.text
                else: continue
                vals[colnum(c.get('r'))] = val
            if vals:
                rows.append([vals.get(i, '') for i in range(max(vals) + 1)])
        return rows
    sys.exit(f'sheet {sheet!r} not found in {path}')

def iso(v):
    v = (v or '').strip()
    if not v: return ''
    try:
        return (datetime.date(1899, 12, 30) + datetime.timedelta(days=int(float(v)))).isoformat()
    except ValueError:
        m, d, y = v.split('/')
        return f'{int(y):04d}-{int(m):02d}-{int(d):02d}'

out = []
for fname, sheet, groups, src in SOURCES:
    rows = read_sheet(HERE / fname, sheet)
    h = rows[0]
    def g(r, k):
        return (r[h.index(k)] if k in h and h.index(k) < len(r) else '').strip()
    for r in rows[1:]:
        if g(r, 'Vaccine_Group') not in groups:
            continue
        doses = []
        for n in range(1, 8):
            if not g(r, f'Date_Administered_{n}'):
                continue
            doses.append({'date': iso(g(r, f'Date_Administered_{n}')), 'name': g(r, f'Vaccine_Name_{n}'),
                          'cvx': g(r, f'CVX_{n}'), 'status': g(r, f'Evaluation_Status_{n}'),
                          'reason': g(r, f'Evaluation_Reason_{n}'), 'seriesType': g(r, f'Series_Type_{n}')})
        obs = [{'code': g(r, f'Observation_Code_{n}'), 'text': g(r, f'Observation_Text_{n}')}
               for n in (1, 2, 3) if g(r, f'Observation_Code_{n}')]
        if g(r, 'Med_History_Code'):
            obs.append({'code': g(r, 'Med_History_Code'), 'text': g(r, 'Med_History_Text')})
        # 'MenACWY' or 'MenB': which of the app's two vaccines this patient is about.
        grp = 'MenB' if g(r, 'Vaccine_Group').upper().endswith('B') else 'MenACWY'
        out.append({'source': src, 'group': grp, 'id': g(r, 'CDC_Test_ID'), 'name': g(r, 'Test_Case_Name'),
                    'dob': iso(g(r, 'DOB')), 'observations': obs, 'seriesStatus': g(r, 'Series_Status'),
                    'doses': doses, 'forecastNum': g(r, 'Forecast_#'), 'earliest': iso(g(r, 'Earliest_Date')),
                    'recommended': iso(g(r, 'Recommended_Date')), 'pastDue': iso(g(r, 'Past_Due_Date')),
                    'assessmentDate': iso(g(r, 'Assessment_Date')), 'evalType': g(r, 'Evaluation_Test_Type'),
                    'forecastType': g(r, 'Forecast_Test_Type'), 'guidance': g(r, 'Administrative_Guidance'),
                    'description': g(r, 'General_Description'), 'changedIn': g(r, 'Changed_In_Version')})

(HERE / 'meningo-test-cases.json').write_text(json.dumps(out, indent=1) + '\n')
print(f'{len(out)} meningococcal test patients -> {HERE / "meningo-test-cases.json"}')
