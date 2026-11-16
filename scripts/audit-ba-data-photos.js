import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { toPlanCards } from '../src/services/baData.js';
const root=new URL('../',import.meta.url);
const read=async(path)=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const cache=await read('public/data/ba-data.json');
const manifests=await Promise.all(['src/data/baDataPilot.json','src/data/baDataPhotos.json'].map(read));
for(const manifest of manifests){
 assert.equal(manifest.version,1);
 assert.equal(new Set(manifest.entries.map(e=>e.id)).size,manifest.entries.length);
 for(const entry of manifest.entries.filter(e=>e.photo)){
  const place=cache.places.find(p=>p.id===entry.id),photo=entry.photo;
  assert.ok(place,entry.id);
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
assert.equal(plans.length,manifests.reduce((n,m)=>n+m.entries.filter(e=>e.photo).length,0),'A reviewed photo was excluded or duplicated');
console.log(JSON.stringify({originalRecords:cache.places.length,verified:plans.length,excluded:cache.places.length-plans.length,categories:plans.reduce((a,p)=>(a[p.category]=(a[p.category]||0)+1,a),{})},null,2));
