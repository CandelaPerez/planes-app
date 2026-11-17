import { historicalPhoto } from './optimization-history.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';
import { toPlanCards } from '../src/services/baData.js';
import { discoveryOptions, neighborhoodFor, placeTypeFor, regionFor, filterKey } from '../src/utils/discoveryFilters.js';

const plans = toPlanCards(JSON.parse(await readFile('public/data/ba-data.json', 'utf8')));

test('three coherent CABA zones cover every visible place, with verified neighborhood provenance', () => {
 const {zones}=discoveryOptions(plans);
 assert.deepEqual(zones.map(z=>z.name),['Zona Norte','Zona Sur','Zona Centro']);
 assert.ok(zones.every(z=>z.count>=5));
 assert.equal(zones.reduce((n,z)=>n+z.count,0),plans.length);
 assert.equal(new Set(zones.map(z=>filterKey(z.name))).size,3);
 assert.equal(neighborhoodFor({barrio:' SAN   NICOLAS '}),'San Nicolás');
 assert.equal(neighborhoodFor({location:'CABA',lat:-34.58,lon:-58.39}),'');
 assert.equal(regionFor({barrio:'Palermo'}),'Zona Norte');
 assert.equal(regionFor({barrio:'La Boca'}),'Zona Sur');
 assert.equal(regionFor({barrio:'San Telmo'}),'Zona Centro');
 assert.equal(regionFor(plans.find(p=>p.wikidataId==='Q2336867')),'Zona Centro');
 assert.equal(regionFor(plans.find(p=>p.wikidataId==='Q1138028')),'Zona Sur');
});

test('four broad place groups cover all records without tiny or empty options', () => {
 const {placeTypes}=discoveryOptions(plans);
 assert.deepEqual(placeTypes.map(t=>t.name),['Museos','Gastronomía','Espacios verdes','Sitios turísticos']);
 assert.ok(placeTypes.every(t=>t.count>=5));
 assert.equal(placeTypes.reduce((n,t)=>n+t.count,0),plans.length);
 assert.equal(placeTypeFor({title:'Café inventado',subtype:''}),'');
 assert.equal(placeTypeFor(plans.find(p=>p.id==='badata-food-1362')),'Gastronomía');
 assert.equal(placeTypeFor(plans.find(p=>p.wikidataId==='Q2336867')),'Sitios turísticos');
 assert.equal(placeTypeFor(plans.find(p=>p.id==='badata-green-1330')),'Espacios verdes');
 assert.equal(placeTypeFor(plans.find(p=>p.id==='badata-culture-2694')),'Museos');
});

test('all 53 previous plans and their full photograph metadata are preserved', async () => {
 const before=JSON.parse(await readFile('data/photo-batches/preserved-53.json','utf8'));
 assert.equal(before.entries.length,53);
 assert.ok(plans.length>=80 && plans.length<=100);
 for(const entry of before.entries){
  const plan=plans.find(p=>p.id===entry.id);
  assert.ok(plan,entry.id);
  assert.equal(plan.originalName,entry.originalName);
  assert.equal(plan.address,entry.address);
  assert.equal(plan.category,entry.category);
  assert.deepEqual(historicalPhoto(plan.photograph),entry.photo);
 }
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
    assert.equal(ids({}).length, plans.length);
    assert.ok(ids({ zone: 'Zona Norte', category: 'Cultura', placeType: 'Museos' }).includes('badata-culture-2694'));
    assert.deepEqual(ids({ zone: 'Zona Centro', category: 'Cultura', placeType: 'Museos', search: 'historico' }), ['badata-culture-2674', 'badata-culture-2675']);
    assert.deepEqual(ids({ zone: 'Zona Norte', placeType: 'Espacios verdes', search: 'japones', sortBy: 'alpha-desc' }), ['badata-green-1444']);
    assert.deepEqual(ids({ zone: 'Zona Norte', category: 'Cultura', placeType: 'Gastronomía' }), []);
    assert.equal(ids({ category: 'Viajes', search: 'iconos' }).length, plans.filter(p=>p.category==='Viajes').length);
    assert.equal(ids({ category: 'Viajes', placeType: 'Sitios turísticos' }).length, plans.filter(p=>p.category==='Viajes').length);
    assert.equal(ids({ zone: 'Zona Sur' }).length,12);
    assert.equal(ids({ placeType: 'Museos' }).length,15);
    for (const filters of [{}, { placeType: 'Museos' }, { zone: 'Zona Centro' }]) {
      const expected = results(filters).visibleIdeas.sort((a, b) => a.title.localeCompare(b.title, 'es')).map(plan => plan.id);
      assert.deepEqual(ids({ ...filters, sortBy: 'alpha' }), expected);
      assert.deepEqual(ids({ ...filters, sortBy: 'alpha-desc' }), expected.toReversed());
    }
    assert.deepEqual(ids({ sortBy: '' }), ids({}));
    assert.deepEqual(ids({ placeType: undefined }), ids({}), 'Preserve the previous highlighted order');
    assert.equal(JSON.stringify(plans), before, 'Do not mutate names, photographs or catalog records');
  } finally { await server.close(); }
});
