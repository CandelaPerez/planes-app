import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanupDecision, cleanupReport } from '../scripts/lib/saved-cleanup.js';

const catalog = [{ id: 'badata-food-1362' }];
const current = new Set(catalog.map(p => p.id));
const row = (id, data, uid = 'account-a') => ({ uid, path: `users/${uid}/savedPlans/${id}`, data: { id, ...data } });

test('cleanup requires legacy provenance and current absence, never just a title or flag', () => {
  assert.equal(cleanupDecision({ id: 'cat_3' }, current).action, 'candidate');
  assert.equal(cleanupDecision({ id: 'cat_3' }, new Set(['cat_3'])).action, 'keep');
  assert.equal(cleanupDecision({ id: 'my-event', title: 'Recorrido por el Museo del Cine' }, current).action, 'keep');
  assert.equal(cleanupDecision({ id: 'my-event', isCatalog: true }, current).action, 'review');
  assert.equal(cleanupDecision({ id: 'badata-culture-999999' }, current).action, 'review');
  assert.equal(cleanupDecision({ id: 'cat_3', savedOrigin: 'custom' }, current).action, 'keep');
  assert.equal(cleanupDecision({ id: 'cat_3', type: 'itinerary' }, current).action, 'keep');
  assert.equal(cleanupDecision({ id: catalog[0].id }, current).action, 'keep');
});

test('cleanup blocks personal memories, changed photos, unknown fields, schedules and references', () => {
  const records = [row('cat_3', { image: 'original.jpg' }),
    row('cat_1', { image: 'personal.jpg', comment: 'My memory', scheduledAt: '2027-01-01' }),
    row('trip', { type: 'itinerary', items: [{ id: 'cat_3' }] }),
    row('coverage_1_1_1', { unexpectedPersonalField: 'keep' }),
    row('cat_2', {}, 'account-b'), row('cat_4', {}), row('cat_5', {})];
  records.at(-1).subcollections = ['ratings'];
  const original = structuredClone(records);
  const report = cleanupReport(records, catalog, { originalImages: new Map([['cat_3', 'original.jpg']]),
    ratings: [{ path: 'plans/cat_4/ratings/account-a', data: { userId: 'account-a', value: 5 } }] });
  assert.equal(report.totals.confirmedLegacy, 6);
  assert.equal(report.totals.candidates, 1);
  assert.equal(report.totals.review, 5);
  assert.equal(report.totals.accounts, 2);
  assert.equal(report.totals.deleted, 0);
  assert.equal(report.entries.find(e => e.documentId === 'cat_2').action, 'candidate');
  assert.equal(report.entries.find(e => e.documentId === 'cat_3').references[0].path, 'users/account-a/savedPlans/trip');
  assert.deepEqual(records, original);
});

test('cleanup refuses an empty or duplicate catalog', () => {
  assert.throws(() => cleanupReport([], []));
  assert.throws(() => cleanupReport([], [catalog[0], catalog[0]]));
});

test('a current document ID is protected even when stored identity fields conflict', () => {
  const report = cleanupReport([row(catalog[0].id, { id: 'cat_3', catalogId: 'cat_3' }),
    row('cat_2', { catalogId: 'cat_3' })], catalog);
  assert.equal(report.entries[0].action, 'keep');
  assert.equal(report.entries[1].action, 'review');
  assert.equal(report.totals.candidates, 0);
});
