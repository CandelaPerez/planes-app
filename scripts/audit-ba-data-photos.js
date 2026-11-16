import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { toPlanCards, loadBaDataPreview } from '../src/services/baData.js';
import { discoveryOptions, regionFor } from '../src/utils/discoveryFilters.js';
const root=new URL('../',import.meta.url);
const read=async(path)=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const cache=await read('public/data/ba-data.json');
const tourism=await read('src/data/tourismPlaces.json');
const allPlaces=[...cache.places,...tourism.places];
const manifests=await Promise.all(['src/data/baDataPilot.json','src/data/baDataPhotos.json'].map(read));
for(const manifest of manifests){
 assert.equal(manifest.version,1);
 assert.equal(new Set(manifest.entries.map(e=>e.id)).size,manifest.entries.length);
 for(const entry of manifest.entries.filter(e=>e.photo)){
  const place=allPlaces.find(p=>p.id===entry.id),photo=entry.photo;
  assert.ok(place,entry.id);
  if (entry.displayCategory) assert.ok(['Gastronomía','Cultura','Aire Libre','Viajes'].includes(entry.displayCategory) && entry.classificationEvidence, 'Unreviewed category override');
  for(const [key,value] of Object.entries({originalName:place.title,address:place.address,category:place.category,lat:place.lat,lon:place.lon}))assert.equal(entry[key],value,`${entry.id}: ${key} changed; review again`);
  assert.ok(photo.evidence && photo.author && photo.description && photo.verifiedAt);
  assert.match(photo.license,/^(CC BY(?:-SA)? (?:2\.0|2\.5(?: ar)?|3\.0|4\.0)|CC0|Public domain)$/);
  assert.match(photo.localPath,/^\/images\/ba-data-(pilot|batches)\/[a-z0-9-]+\.jpg$/);
  const bytes=await readFile(new URL('public'+photo.localPath,root));
  assert.equal(bytes[0],255);assert.equal(bytes[1],216);assert.equal(bytes.length,photo.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),photo.sha256);
 }
}
const plans=toPlanCards(cache);
assert.deepEqual((await loadBaDataPreview()).plans,plans,'Bundled catalog differs from the complete reviewed selection');
assert.ok(plans.every(plan => regionFor(plan)), 'A visible plan has no verified CABA zone');
assert.equal(new Set(plans.map(p=>`${p.originalName.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()}|${p.address}`)).size,plans.length,'Duplicated place identity');
assert.equal(new Set(plans.map(p=>p.photograph.sha256)).size,plans.length,'The same photograph cannot represent different places');
assert.equal(new Set(plans.map(p=>p.photograph.sourceUrl)).size,plans.length,'Repeated Commons file');
assert.equal(plans.length,manifests.reduce((n,m)=>n+m.entries.filter(e=>e.photo).length,0),'A reviewed photo was excluded or duplicated');
console.log(JSON.stringify({originalRecords:cache.places.length,supplementalRecords:tourism.places.length,verified:plans.length,excludedBaData:cache.places.length-plans.filter(p=>!p.wikidataId).length,categories:plans.reduce((a,p)=>(a[p.category]=(a[p.category]||0)+1,a),{}),filters:discoveryOptions(plans)},null,2));
