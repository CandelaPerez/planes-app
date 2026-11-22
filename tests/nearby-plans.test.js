import assert from 'node:assert/strict';
import test from 'node:test';
import { loadBaDataPreview } from '../src/services/baData.js';
import { distanceKm, rankNearbyPlans } from '../src/utils/nearbyPlans.js';

test('Haversine measures distance along the Earth and handles identical positions', () => {
  const origin = { lat: 0, lon: 0 };
  assert.equal(distanceKm(origin, origin), 0);
  assert.ok(Math.abs(distanceKm(origin, { lat: 0, lon: 1 }) - 111.195) < 0.001);
});

test('nearby map selects twelve distinct valid plans from the full catalog', async () => {
  const { plans } = await loadBaDataPreview();
  const obelisk = plans.find(({ id }) => id === 'tourism-wikidata-q831389');
  const garden = plans.find(({ id }) => id === 'badata-green-1444');
  const catalog = [obelisk, { id: 'invalid', lat: 100, lon: -58 }, ...plans];
  const nearby = rankNearbyPlans(catalog, obelisk);

  assert.equal(plans.length, 84);
  assert.equal(nearby.length, 12);
  assert.equal(new Set(nearby.map(({ plan }) => plan.id)).size, 12);
  assert.deepEqual(nearby[0], { plan: obelisk, distance: 0 });
  assert.ok(nearby.every(({ plan }) => plans.includes(plan)));
  assert.ok(nearby.every(({ distance }, index) => index === 0 || distance >= nearby[index - 1].distance));
  assert.deepEqual(rankNearbyPlans(catalog, garden)[0], { plan: garden, distance: 0 });
});
