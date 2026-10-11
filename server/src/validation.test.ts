import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCsvRows } from './validation.js';

test('accepts valid rows and normalizes optional fields', () => {
  const result = validateCsvRows([{ case_type:'Billing', status:'Resolved', priority:'High', owner:'A. Person', created_at:'2026-09-10', resolution_hours:'3.5', satisfaction:'4' }]);
  assert.equal(result.imported.length, 1); assert.equal(result.errors.length, 0); assert.equal(result.imported[0].resolution_hours, 3.5); assert.equal(result.imported[0].satisfaction, 4);
});
test('reports missing required columns', () => {
  const result = validateCsvRows([{ status:'Open' }]); assert.equal(result.imported.length, 0); assert.match(result.errors[0], /Missing required columns/);
});
test('rejects invalid dates and satisfaction outside range', () => {
  const result = validateCsvRows([{ case_type:'Billing', status:'Open', priority:'Low', owner:'A', created_at:'not-a-date', satisfaction:'9' }]); assert.equal(result.imported.length, 0); assert.equal(result.errors.length, 1);
});
test('handles an empty dataset', () => { assert.deepEqual(validateCsvRows([]).errors, ['The CSV contains no data rows.']); });
