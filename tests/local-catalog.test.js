import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

test('original catalog, images, Firebase implementation and rules remain unchanged', async () => {
  // Portable fingerprints: the delivery tests do not require Git history.
  const paths = {
    'src/data/catalog.js': 'b3e22a83334d8e45fa35602f9e416277ff8a6b30ec949dd1a7f86676c9510ccf',
    'src/data/catalog-extra.js': '0e13e8759de9d1dd495c7fb78103244cc721d2dddd7696e5fd6a37041ff9c84e',
    'src/services/firebase.js': '023feab23c679450834c08da171bb1db2420fed989a970f5101dbcd527078ac3',
    'src/services/planPhotos.js': '7e68853e2cde57857b833e8d6b59abccaa38fcff434eff096258925608874e25',
    'firestore.rules': 'a9c6c08afe004f49e34b7ab1ee929e2694a3ecfb50dfd8244fa85020b87bfab4',
  };
  for (const [path, expected] of Object.entries(paths)) {
    const fingerprint = createHash('sha256').update((await readFile(path, 'utf8')).replaceAll('\r\n', '\n')).digest('hex');
    assert.equal(fingerprint, expected, path);
  }
});

test('129 original ideas render, filter and retain valid detail fields without external places', async () => {
  const server = await createServer({ define: { 'import.meta.env.VITE_USE_FIREBASE': '"false"' }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { CATALOG } = await server.ssrLoadModule('/src/data/catalog.js');
    const { default: App } = await server.ssrLoadModule('/src/AppFirebase.jsx');
    const { default: usePlanFilters } = await server.ssrLoadModule('/src/hooks/usePlanFilters.js');
    assert.equal(CATALOG.length, 129);
    assert.equal(new Set(CATALOG.map(({ id }) => id)).size, 129);
    assert.ok(CATALOG.every((plan) => plan.title && plan.description && plan.category && plan.location && plan.budget && plan.image));
    const html = renderToString(createElement(App));
    assert.match(html.replaceAll('<!-- -->', ''), /0 planes con fotografía real verificada/);
    assert.ok(!/OpenStreetMap|Overpass|Planes para hacer hoy|api-preview/.test(html));
    function Results({ search = '', category = 'Todas', zone = 'Todas', budget = 'Todos' }) {
      const { visibleIdeas } = usePlanFilters({ catalog: CATALOG, search, category, zone, budget, sortBy: 'alpha', ratings: [], planPhotos: {} });
      return createElement('div', {}, visibleIdeas.map((plan) => createElement('span', { key: plan.id, 'data-id': plan.id }, plan.title)));
    }
    const render = (props) => renderToString(createElement(Results, props));
    assert.equal((render({}).match(/data-id=/g) || []).length, 129);
    assert.match(render({ search: 'Tortoni' }), /Tortoni/);
    assert.equal(render({ search: 'No existe este plan 12345' }), '<div></div>');
    for (const [filter, value] of [['category', 'Cultura'], ['zone', 'Zona Norte'], ['budget', 'Bajo']]) {
      const result = render({ [filter]: value });
      assert.ok(result.includes('data-id='), `${filter} finds original plans`);
      assert.ok((result.match(/data-id=/g) || []).length < 129, `${filter} narrows the original catalog`);
    }
  } finally { await server.close(); }
});
