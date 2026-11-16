import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';
import { toPlanCards } from '../src/services/baData.js';
import { discoveryOptions, neighborhoodFor, placeTypeFor, filterKey } from '../src/utils/discoveryFilters.js';

const plans = toPlanCards(JSON.parse(await readFile('public/data/ba-data.json', 'utf8')));

test('neighborhood options use published barrios, normalize spelling/case and exclude missing locations', () => {
  const { zones } = discoveryOptions(plans);
  assert.equal(zones.length, 14);
  assert.equal(zones.reduce((sum, option) => sum + option.count, 0), 39);
  assert.equal(new Set(zones.map(option => filterKey(option.name))).size, zones.length);
  assert.deepEqual(zones.find(option => option.name === 'San Nicolás'), { name: 'San Nicolás', count: 4 });
  assert.equal(neighborhoodFor({ barrio: '  SAN   NICOLAS ' }), 'San Nicolás');
  assert.equal(neighborhoodFor({ barrio: 'san nicolás' }), 'San Nicolás');
  assert.equal(neighborhoodFor({ location: 'CABA', address: 'Junín 1930', lat: -34.58, lon: -58.39 }), '');
  for (const option of zones) assert.ok(option.count > 0 && option.name !== 'CABA');
});

test('place types come from published subtype fields; no price options or guessed classifications', () => {
  const { placeTypes } = discoveryOptions(plans);
  assert.equal(placeTypes.find(option => option.name === 'Museos').count, 9);
  assert.equal(placeTypes.find(option => option.name === 'Parques y plazas').count, 12);
  assert.equal(placeTypes.find(option => option.name === 'Restaurantes').count, 8);
  assert.ok(placeTypes.every(option => option.count > 0));
  assert.equal(placeTypeFor({ title: 'Café inventado', subtype: '' }), '');
  assert.equal(placeTypeFor(plans.find(plan => plan.id === 'badata-food-1362')), 'Restaurantes', 'Keep the published RESTAURANTE classification even when the name contains Café');
  assert.equal(placeTypeFor(plans.find(plan => plan.wikidataId === 'Q2336867')), 'Puentes');
  assert.equal(placeTypeFor(plans.find(plan => plan.id === 'badata-food-947')), '');
});

test('filters combine with categories/search; both sorts cover full results and recommended order is preserved', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const before = JSON.stringify(plans);
  try {
    const { default: usePlanFilters } = await server.ssrLoadModule('/src/hooks/usePlanFilters.js');
    const results = (props = {}) => {
      let result;
      function Probe() {
        result = usePlanFilters({ catalog: plans, category: 'Todas', zone: 'Todas', placeType: 'Todos', search: '', sortBy: 'recommended', ratings: [], planPhotos: {}, ...props });
        return null;
      }
      renderToString(createElement(Probe));
      return result;
    };
    const ids = props => results(props).visibleIdeas.map(plan => plan.id);
    assert.equal(ids({}).length, 53);
    assert.deepEqual(ids({ zone: 'Recoleta', category: 'Cultura', placeType: 'Museos' }), ['badata-culture-2694']);
    assert.deepEqual(ids({ zone: 'san telmo', category: 'Cultura', placeType: 'Museos', search: 'historico' }), ['badata-culture-2674']);
    assert.deepEqual(ids({ zone: 'Palermo', placeType: 'Parques y plazas', search: 'japones', sortBy: 'alpha-desc' }), ['badata-green-1444']);
    assert.deepEqual(ids({ zone: 'Palermo', placeType: 'Cementerios' }), []);
    assert.equal(ids({ category: 'Viajes', search: 'iconos' }).length, 14);
    assert.deepEqual(ids({ category: 'Viajes', placeType: 'Puentes' }).sort(), ['tourism-wikidata-q1138028', 'tourism-wikidata-q2336867']);
    assert.equal(ids({ zone: 'Recoleta' }).length, 4);
    assert.equal(ids({ placeType: 'Museos' }).length, 9);
    for (const filters of [{}, { placeType: 'Museos' }, { zone: 'San Telmo' }]) {
      const expected = results(filters).visibleIdeas.sort((a, b) => a.title.localeCompare(b.title, 'es')).map(plan => plan.id);
      assert.deepEqual(ids({ ...filters, sortBy: 'alpha' }), expected);
      assert.deepEqual(ids({ ...filters, sortBy: 'alpha-desc' }), expected.toReversed());
    }
    assert.deepEqual(ids({ sortBy: '' }), ids({}));
    assert.deepEqual(ids({ placeType: undefined }), ids({}), 'Preserve the previous highlighted order');
    assert.equal(JSON.stringify(plans), before, 'Do not mutate names, photographs or catalog records');
  } finally { await server.close(); }
});
