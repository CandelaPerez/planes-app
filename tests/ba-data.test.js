import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';
import { toPlanCards } from '../src/services/baData.js';
import { parseCsv } from '../scripts/ba-data/normalize.js';
import { categoryIllustrations, variedBaDataOrder, placeImage } from '../src/utils/baDataPresentation.js';

const path = 'public/data/ba-data.json';
const cache = JSON.parse(await readFile(path, 'utf8'));

test('real cached records have original IDs, verified geographic fields and dated official sources', () => {
  assert.equal(cache.places.length, cache.statistics.reduce((sum, item) => sum + item.unique, 0));
  assert.equal(new Set(cache.places.map((place) => place.id)).size, cache.places.length);
  assert.ok(cache.statistics.every((item) => item.unique > 0 && item.raw === item.eligible + item.discarded));
  const plans = toPlanCards(cache);
  for (const plan of plans) {
    assert.ok(plan.title && plan.lat >= -34.71 && plan.lat <= -34.52 && plan.lon >= -58.54 && plan.lon <= -58.33);
    assert.equal(plan.budget, 'Sin información');
    assert.equal(plan.image, categoryIllustrations[plan.category]);
    assert.equal(plan.imageKind, 'illustration');
    assert.equal(plan.description, plan.subtype || '', 'Description only repeats the published classification');
    assert.ok(plan.sourceReferences.every((source) => source.recordId && new URL(source.url).hostname === 'cdn.buenosaires.gob.ar' && source.license === 'CC-BY-2.5-AR' && source.downloadedAt && source.sha256));
  }
  const restaurant = plans.find((plan) => plan.id === 'badata-food-1602');
  assert.equal(restaurant.title, 'GUANTANAMERA');
  assert.ok(Math.abs(restaurant.lon - -58.36330675) < 0.0000001);
  assert.equal(restaurant.sourceUpdatedAt, cache.sources.find((source) => source.key === 'food').resourceLastModified);
  assert.ok(plans.filter((plan) => plan.category === 'Aire Libre').every((plan) => plan.coordinateMethod === 'published-boundary-vertex'));
  assert.ok(plans.filter((plan) => plan.category === 'Viajes').every((plan) => plan.subtype === 'Parada del bus turístico'));
});

test('recommended ordering varies categories, prioritizes complete addresses and preserves every real record', async () => {
  const plans = toPlanCards(cache);
  const ordered = variedBaDataOrder(plans);
  assert.equal(ordered.length, 6670);
  assert.equal(new Set(ordered.map((plan) => plan.id)).size, 6670);
  assert.deepEqual(new Set(ordered.map((plan) => plan.id)), new Set(plans.map((plan) => plan.id)));
  assert.deepEqual(ordered.slice(0, 4).map((plan) => plan.category), Object.keys(categoryIllustrations));
  for (const category of Object.keys(categoryIllustrations)) {
    const group = ordered.filter((plan) => plan.category === category);
    const firstMissing = group.findIndex((plan) => !plan.address);
    if (firstMissing >= 0) assert.ok(group.slice(firstMissing).every((plan) => !plan.address));
  }
  assert.equal(new Set(Object.values(categoryIllustrations)).size, 4);
  for (const file of Object.values(categoryIllustrations)) assert.match(await readFile(`public${file}`, 'utf8'), /<svg/);
  assert.equal(placeImage({ ...cache.places[0], photoUrl: 'javascript:alert(1)' }).imageKind, 'illustration');
});

test('HTML errors and malformed CSV cannot be accepted as successful data', () => {
  assert.throws(() => parseCsv('<html>Request Rejected</html>'), /HTML/);
  assert.throws(() => parseCsv('id,name\n1,"incomplete'), /Incomplete/);
  assert.deepEqual(parseCsv('id,name,note\r\n1,"Real, named field","two\nlines"\r\n'), [{ id: '1', name: 'Real, named field', note: 'two\nlines' }]);
});

test('invalid persistent catalog triggers fallback instead of showing an empty or duplicated catalog', () => {
  assert.throws(() => toPlanCards({ ...cache, places: [] }), /vacía/);
  assert.throws(() => toPlanCards({ ...cache, places: [cache.places[0], cache.places[0]] }), /duplicados/);
});

test('failed refresh preserves the persistent real snapshot byte for byte', async () => {
  const before = await readFile(path, 'utf8');
  const directory = await mkdtemp(join(tmpdir(), 'porhacer-badata-failure-'));
  await writeFile(join(directory, 'food.csv'), '<html>Request Rejected</html>');
  const result = spawnSync(globalThis.process.execPath, ['scripts/update-ba-data.js', `--from-dir=${directory}`], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /existing cache preserved/);
  assert.equal(await readFile(path, 'utf8'), before);
});

test('existing filter hook works on actual BA Data records without altering the 129 originals', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: usePlanFilters } = await server.ssrLoadModule('/src/hooks/usePlanFilters.js');
    const { CATALOG } = await server.ssrLoadModule('/src/data/catalog.js');
    assert.equal(CATALOG.length, 129);
    const catalog = toPlanCards(cache);
    function Count({ category = 'Todas', search = '', budget = 'Todos' }) {
      const { visibleIdeas } = usePlanFilters({ catalog, category, search, budget, zone: 'Todas', sortBy: 'alpha', ratings: [], planPhotos: {} });
      return createElement('span', null, String(visibleIdeas.length));
    }
    for (const item of cache.statistics) assert.equal(renderToString(createElement(Count, { category: item.category })), `<span>${item.unique}</span>`);
    assert.equal(renderToString(createElement(Count, { search: 'GUANTANAMERA' })), '<span>1</span>');
    assert.equal(renderToString(createElement(Count, { budget: 'Bajo' })), '<span>0</span>');
    assert.equal(renderToString(createElement(Count, { budget: 'Sin información' })), `<span>${catalog.length}</span>`);
  } finally { await server.close(); }
});
