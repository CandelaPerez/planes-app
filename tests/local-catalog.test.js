import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { mergeDiscoveryCatalog } from '../src/utils/discoveryCatalog.js';
import { createServer as createHttpServer } from 'node:http';
import originalSnapshot from '../data/osm-caba.json' with { type: 'json' };

test('initial page renders local catalog without waiting for Firebase or Overpass', async () => {
  const server = await createServer({ define: { 'import.meta.env.VITE_USE_FIREBASE': '"false"' }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const httpServer = createHttpServer(server.middlewares);
  try {
    const { default: App } = await server.ssrLoadModule('/src/AppFirebase.jsx');
    const { CATALOG } = await server.ssrLoadModule('/src/data/catalog.js');
    const html = renderToString(createElement(App));
    assert.equal(CATALOG.length, 129);
    assert.ok(CATALOG.some((plan) => html.includes(plan.title)));
    assert.ok(html.includes('class="plan-card"'));
    const service = await server.ssrLoadModule('/src/services/openStreetMap.js');
    const places = service.loadStoredOpenStreetMapPlaces();
    assert.equal(places.length, 10);
    assert.ok(html.includes('No hay eventos con fecha confirmada para hoy.'));
    const merged = mergeDiscoveryCatalog(CATALOG, places);
    assert.deepEqual(merged.slice(0, 129), CATALOG);
    assert.equal(merged.length, 139);
    const manualPlan = { id: 'firebase-manual', title: 'Plan personal conservado' };
    const withManualPlan = mergeDiscoveryCatalog([...CATALOG, manualPlan], places);
    assert.equal(withManualPlan[129], manualPlan, 'Remote manual plans are retained untouched');
    const museum = merged.find((place) => place.id === 'osm-way-149957847');
    assert.equal(museum.title, 'Museo de la Cárcova');
    assert.equal(museum.address, 'Avenida España 1701');
    assert.equal(museum.sourceUrl, 'https://www.openstreetmap.org/way/149957847');
    assert.match(museum.description, /2026-11-15/);
    assert.match(museum.visitTips, /2019-07-01/);
    assert.equal(museum.openingHours, '');
    assert.ok(places.every((place) => place.verifiedOn === '2026-11-15' && place.verification.sources.length && place.provenance.coordinateDataTimestamp.startsWith('2019-07-01')));
    assert.ok(places.every((place) => place.imageFallback.startsWith('data:image/svg+xml') && !place.openingHours));
    assert.equal(new Set(places.map((place) => place.image)).size, 10);
    assert.equal(places.find((place) => place.id === 'osm-way-147938686').address, 'Mariscal Castilla 2752');
    assert.ok(places.every((place) => place.category === 'Cultura' && place.image && place.sourceLicense === 'ODbL' && place.location === 'CABA'));
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; throw new Error('Offline'); };
    try {
      const [first, second] = await Promise.all([service.fetchOpenStreetMapPlaces(), service.fetchOpenStreetMapPlaces()]);
      assert.deepEqual(first, places);
      assert.deepEqual(second, places);
      assert.equal(calls, 1);
      assert.deepEqual(await service.fetchOpenStreetMapPlaces({ force: true }), places);
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
    await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    const response = await fetch(`http://127.0.0.1:${httpServer.address().port}/api/places`);
    assert.equal(response.status, 200, 'Vite serves the real local API endpoint');
    const payload = await response.json();
    assert.equal(payload.elements.length, 10);
    assert.deepEqual(service.normalizePayload(payload), places);
    // Advance past the failure cooldown and verify successful response caching.
    const originalNow = Date.now;
    const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const storage = new Map();
    Date.now = () => originalNow() + 31_000;
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) } });
    calls = 0;
    globalThis.fetch = async () => { calls += 1; return { ok: true, json: async () => payload }; };
    try {
      assert.deepEqual(await service.fetchOpenStreetMapPlaces(), places);
      assert.deepEqual(await service.fetchOpenStreetMapPlaces(), places);
      assert.equal(calls, 1, 'Fresh cache avoids a second request');
      const stored = JSON.parse(storage.get('porhacer_openstreetmap_places_v4'));
      assert.equal(stored.places.length, 10);
      assert.equal(stored.osmTimestamp, payload.osmTimestamp);
      // An old HTTP/browser cache must not undo the new institutional checks.
      globalThis.fetch = async () => ({ ok: true, json: async () => originalSnapshot });
      const afterOldResponse = await service.fetchOpenStreetMapPlaces({ force: true });
      assert.ok(afterOldResponse.every((place) => place.verifiedOn === '2026-11-15'));
      assert.equal(afterOldResponse.find((place) => place.id === 'osm-way-147938686').address, 'Mariscal Castilla 2752');
    } finally {
      globalThis.fetch = originalFetch;
      Date.now = originalNow;
      if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
      else delete globalThis.localStorage;
    }
    console.log(`Verified ${CATALOG.length} original plans + ${merged.length - CATALOG.length} OSM additions = ${merged.length} cards available.`);
  } finally {
    if (httpServer.listening) await new Promise((resolve) => httpServer.close(resolve));
    await server.close();
  }
});
