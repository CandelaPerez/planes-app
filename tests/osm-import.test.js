import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';
import original from '../data/osm-caba.json' with { type: 'json' };
import { buildQuery, elementsFromGeoJson, CATEGORY_SELECTORS, ZONES } from '../server/osm.js';
import { mergeDiscoveryCatalog } from '../src/utils/discoveryCatalog.js';

test('small queries cover five categories in four independent AMBA cells', () => {
  for (const zone of Object.keys(ZONES)) for (const category of Object.keys(CATEGORY_SELECTORS)) {
    const query = buildQuery({ zone, category });
    assert.match(query, /timeout:10/);
    assert.match(query, /out center tags 40/);
    assert.ok(query.includes(ZONES[zone].join(',')));
  }
  assert.throws(() => buildQuery({ zone: 'world' }));
});

test('real extract point import preserves original OSM IDs and coordinates', () => {
  const record = original.elements[0];
  const imported = elementsFromGeoJson({ type: 'FeatureCollection', features: [{ type: 'Feature', id: `${record.type}/${record.id}`, properties: record.tags, geometry: { type: 'Point', coordinates: [record.center.lon, record.center.lat] } }] });
  assert.deepEqual(imported, [record]);
  assert.deepEqual(elementsFromGeoJson({ type: 'FeatureCollection', features: [{ id: 'invented-1', properties: { name: 'Not an OSM ID' }, geometry: { type: 'Point', coordinates: [-58.4, -34.6] } }] }), []);
});

test('actual filter hook finds OSM cards, preserves unknown budgets and deduplicates', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: usePlanFilters } = await server.ssrLoadModule('/src/hooks/usePlanFilters.js');
    const { loadStoredOpenStreetMapPlaces } = await server.ssrLoadModule('/src/services/openStreetMap.js');
    const places = loadStoredOpenStreetMapPlaces();
    assert.equal(mergeDiscoveryCatalog([], [...places, ...places]).length, 10);
    function Results({ search = '', zone = 'Todas', category = 'Todas', budget = 'Todos' }) {
      const { visibleIdeas } = usePlanFilters({ catalog: places, search, zone, category, budget, sortBy: 'alpha', ratings: [], planPhotos: {} });
      return createElement('div', {}, visibleIdeas.map((place) => createElement('a', { key: place.id, href: place.sourceUrl }, place.title)));
    }
    assert.match(renderToString(createElement(Results, { search: 'Cárcova', zone: 'CABA', category: 'Cultura' })), /openstreetmap.org\/way\/149957847/);
    assert.equal(renderToString(createElement(Results, { budget: 'Bajo' })), '<div></div>');
    assert.equal(renderToString(createElement(Results, { zone: 'Zona Norte' })), '<div></div>');
    assert.equal(renderToString(createElement(Results, { category: 'Cultura' })).match(/<a /g).length, 10);
  } finally { await server.close(); }
});
