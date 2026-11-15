import assert from 'node:assert/strict';
import { test } from 'node:test';
import original from '../data/osm-caba.json' with { type: 'json' };
import { verifiedSnapshot } from '../data/verifiedPlaces.js';

test('institutional checks never redate or alter the original OSM facts', () => {
  assert.deepEqual(verifiedSnapshot.elements.map((element) => Object.fromEntries(Object.entries(element).filter(([key]) => !['verification', 'provenance'].includes(key)))), original.elements);
  assert.equal(verifiedSnapshot.osmTimestamp, '2019-07-01T00:50:02Z');
  assert.equal(verifiedSnapshot.verificationUpdatedOn, '2026-11-15');
  assert.equal(verifiedSnapshot.elements.length, 10);
  for (const { verification, provenance } of verifiedSnapshot.elements) {
    assert.equal(verification.verifiedOn, '2026-11-15');
    assert.ok(verification.verifiedFields.includes('existence'));
    assert.ok(verification.sources.length > 0);
    assert.ok(verification.sources.every(({ publisher, url }) => publisher && new URL(url).protocol === 'https:'));
    assert.equal(provenance.coordinateDataTimestamp, original.osmTimestamp);
    assert.equal(provenance.license, 'ODbL-1.0');
    assert.equal(provenance.datasetUrl, original.datasetUrl);
    assert.ok(!verification.openingHours && !verification.image, 'No unverifiable hours or images are introduced');
  }
});

test('outdated addresses are corrected and conflicting access numbers stay explicitly unresolved', () => {
  const find = (id) => verifiedSnapshot.elements.find((element) => element.id === id);
  const institute = find(147938686);
  assert.equal(institute.tags['addr:housenumber'], '2900');
  assert.equal(institute.verification.address, 'Mariscal Castilla 2752');
  assert.equal(find(173065616).verification.address, 'Puerto Madero, Dique 4, CABA');
  const river = find(120102412).verification;
  assert.equal(river.addressPrecision, 'street');
  assert.ok(!river.verifiedFields.includes('address'));
  assert.ok(!/\d/.test(river.address));
  assert.equal(river.sources.length, 2);
  assert.match(river.note, /7509.*7597/);
});
