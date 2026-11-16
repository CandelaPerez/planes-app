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
import { variedBaDataOrder } from '../src/utils/baDataPresentation.js';
import { createHash } from 'node:crypto';

const path = 'public/data/ba-data.json';
const cache = JSON.parse(await readFile(path, 'utf8'));
const tourism = JSON.parse(await readFile('src/data/tourismPlaces.json', 'utf8'));



test('only reviewed photographs become visible; originals remain available', async () => {
 const plans=toPlanCards(cache);
 assert.equal(cache.places.length,6670);
 assert.ok(plans.length >= 48);
 assert.equal(new Set(plans.map(p=>p.photograph.sha256)).size, plans.length);
 assert.equal(new Set(plans.map(p=>p.id)).size,plans.length);
 assert.equal(plans.find(p=>p.id==='badata-food-1573'),undefined);
 for(const plan of plans){
  const original=[...cache.places,...tourism.places].find(p=>p.id===plan.id);
  assert.equal(plan.originalName,original.title);
  assert.equal(plan.address,original.address);
  assert.equal(plan.imageKind,'photograph');
  assert.ok(plan.photograph.evidence && plan.photograph.author && plan.photograph.licenseUrl);
  assert.equal(createHash('sha256').update(await readFile('public'+plan.image)).digest('hex'),plan.photograph.sha256);
 }
 const changed=structuredClone(cache);changed.places.find(p=>p.id==='badata-food-638').address='OTHER ADDRESS';
 assert.ok(!toPlanCards(changed).some(p=>p.id==='badata-food-638'));
 const urlOnly=structuredClone(cache);urlOnly.places[0].photoUrl='https://example.com/real.jpg';urlOnly.places[0].photoSourceUrl='https://example.com';
 assert.equal(toPlanCards(urlOnly).length,plans.length);
 assert.equal(variedBaDataOrder(plans).length,plans.length);
 for (const category of ['Gastronomía', 'Cultura', 'Aire Libre', 'Viajes']) assert.ok(plans.filter(p=>p.category===category).length >= 12, category);
});

test('tourism entries have stable entity IDs, open provenance and real attractions rather than bus stops', () => {
 const plans=toPlanCards(cache).filter(p=>p.category==='Viajes');
 assert.ok(plans.length>=12);
 for(const plan of plans){
  assert.equal(plan.id,`tourism-wikidata-${plan.wikidataId.toLowerCase()}`);
  assert.equal(plan.sourceUrl,`https://www.wikidata.org/wiki/${plan.wikidataId}`);
  assert.equal(plan.sourceLicense,'CC0');
  assert.match(plan.sourceName,/Wikidata/);
  assert.ok(!plan.description.includes('parada del bus'));
  assert.ok(plan.lat < -34.5 && plan.lat > -34.7 && plan.lon < -58.3 && plan.lon > -58.6);
 }
});
test('HTML errors and malformed CSV cannot be accepted as successful data', () => {
  assert.throws(() => parseCsv('<html>Request Rejected</html>'), /HTML/);
  assert.throws(() => parseCsv('id,name\n1,"incomplete'), /Incomplete/);
  assert.deepEqual(parseCsv('id,name,note\r\n1,"Real, named field","two\nlines"\r\n'), [{ id: '1', name: 'Real, named field', note: 'two\nlines' }]);
});

test('invalid persistent catalog fails explicitly instead of showing an empty or duplicated catalog', () => {
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
    for (const item of cache.statistics) assert.equal(renderToString(createElement(Count, { category: item.category })), `<span>${catalog.filter(p=>p.category===item.category).length}</span>`);
    assert.equal(renderToString(createElement(Count, { search: 'Tortoni' })), '<span>1</span>');
    assert.equal(renderToString(createElement(Count, { budget: 'Bajo' })), '<span>0</span>');
    assert.equal(renderToString(createElement(Count, { budget: 'Sin información' })), `<span>${catalog.length}</span>`);
  } finally { await server.close(); }
});
