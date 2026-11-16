import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {toPlanCards,loadBaDataPreview} from '../src/services/baData.js';
import {matchesDiscoveryFilters} from '../src/utils/discoveryFilters.js';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const plans=toPlanCards(await read('public/data/ba-data.json'));
const review=await read('data/photo-batches/south-gastronomy.json');
test('three verified additions appear together in Gastronomia and Zona Sur with real local photos',async()=>{
 const filtered=plans.filter(p=>matchesDiscoveryFilters(p,{category:'Gastronom\u00eda',zone:'Zona Sur'}));
 assert.deepEqual(filtered.map(p=>p.id).sort(),review.additions.map(p=>p.id).sort());
 for(const entry of review.additions){
  const plan=filtered.find(p=>p.id===entry.id);
  assert.equal(plan.imageKind,'photograph');assert.equal(plan.address,entry.address);
  assert.equal(plan.photograph.sha256,entry.sha256);
  assert.ok(plan.photograph.author&&plan.photograph.license&&plan.photograph.identitySources.length>=2);
  const bytes=await readFile('public'+plan.image);
  assert.equal(bytes[0],255);assert.equal(bytes[1],216);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
 }
 assert.equal(new Set(plans.map(p=>p.id)).size,plans.length);
});
test('all 81 previous visible plans remain byte-for-byte identical',()=>{
 assert.equal(review.previousPlans.length,81);
 assert.equal(plans.length,84);
 for(const before of review.previousPlans){const plan=plans.find(p=>p.id===before.id);assert.ok(plan,before.id);assert.equal(createHash('sha256').update(JSON.stringify(plan)).digest('hex'),before.sha256,before.id);}
});

test('bundled selection loads every reviewed plan without requesting the raw archive',async()=>{
 const originalFetch=globalThis.fetch;
 let requested=false;
 globalThis.fetch=()=>{requested=true;throw Error('Raw archive unavailable');};
 try {
  const loaded=await loadBaDataPreview();
  assert.equal(requested,false);
  assert.deepEqual(loaded.plans,plans);
  assert.equal(loaded.places.length,plans.filter(p=>!p.wikidataId).length);
  for(const category of ['Gastronom\u00eda','Cultura','Aire Libre','Viajes']) assert.ok(loaded.plans.some(p=>p.category===category));
 } finally {globalThis.fetch=originalFetch;}
});
