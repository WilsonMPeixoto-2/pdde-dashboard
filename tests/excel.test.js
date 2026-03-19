const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const xlsx = require('xlsx');
const excelApi = require('../api/excel')._internal;

test('parseDashboardTotals preserves explicit zero values from summary sheet', () => {
    const totals = excelApi.parseDashboardTotals([
        ['PROCESSOS BÁSICO', 0, 164],
        ['PROCESSOS QUALIDADE', 12, 0],
        ['PROCESSOS EQUIDADE', 0, 0],
    ]);

    assert.deepEqual(totals, {
        basico: { concluded: 0, total: 164 },
        qualidade: { concluded: 12, total: 0 },
        equidade: { concluded: 0, total: 0 },
    });
});

test('normalizeWorkbook keeps the reconciled snapshot metrics from try2.xlsx stable', () => {
    const workbook = xlsx.readFile(path.join(__dirname, '..', 'try2.xlsx'), { cellFormula: true });
    const controlRows = xlsx.utils.sheet_to_json(workbook.Sheets.CONTROLE, { header: 1, defval: '' });
    const summaryRows = xlsx.utils.sheet_to_json(workbook.Sheets.DASHBOARD, { header: 1, defval: '' });
    const normalized = excelApi.normalizeWorkbook(controlRows, summaryRows);

    assert.equal(normalized.metrics.basico.concluded, 106);
    assert.equal(normalized.metrics.basico.total, 164);
    assert.equal(normalized.metrics.qualidade.concluded, 59);
    assert.equal(normalized.metrics.qualidade.total, 164);
    assert.equal(normalized.metrics.equidade.concluded, 27);
    assert.equal(normalized.metrics.equidade.total, 38);
    assert.equal(normalized.metrics.global.concluded, 192);
    assert.equal(normalized.metrics.global.total, 366);
    assert.equal(normalized.issues.length > 0, true);
});

test('normalizeWorkbook fails clearly when required process columns are missing', () => {
    assert.throws(() => {
        excelApi.normalizeWorkbook([
            ['R.A.', 'DESIGNAÇÃO', 'SICI', 'NOME DA UNIDADE ESCOLAR'],
            ['10', 'E/CRE(04.10.001)', '11263', 'Unidade de teste'],
        ], []);
    }, /coluna\(s\) obrigatoria\(s\)/i);
});
