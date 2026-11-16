import fs from 'node:fs';import{createHash}from'node:crypto';const read=p=>JSON.parse(fs.readFileSync(p));
const state=read('data/photo-batches/progress.json'),round=read('data/photo-batches/variety-research.json'),old=read('data/photo-batches/expansion.json'),tourism=read('src/data/tourismPlaces.json'),cache=read('public/data/ba-data.json'),reviews=read('data/photo-batches/reviews.json'),selections=read('data/photo-batches/variety-selections.json');
const responses=Object.entries(round.responses).map(([endpoint,v])=>({endpoint,body:v.body,checkedAt:v.checkedAt})).concat(Object.entries(old.responses).map(([endpoint,body])=>({endpoint,body,checkedAt:new Date(old.lastRequestAt).toISOString()})));
const plain=(v='')=>v.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
function normalize(page){const i=page.imageinfo[0],m=i.extmetadata;return {file:page.title,pageId:page.pageid,url:i.thumburl||i.url,originalUrl:i.url,sourceUrl:i.descriptionurl,author:plain(m.Artist?.value),authorMetadata:m.Artist?.value||'',uploader:i.user,license:m.LicenseShortName?.value||'',licenseUrl:m.LicenseUrl?.value||'',restrictions:plain(m.Restrictions?.value),photoDate:plain(m.DateTimeOriginal?.value),description:plain(m.ImageDescription?.value),categories:m.Categories?.value||'',gps:m.GPSLatitude&&m.GPSLongitude?{lat:Number(m.GPSLatitude.value),lon:Number(m.GPSLongitude.value)}:null,mime:i.mime,originalBytes:i.size};}
for(const selection of selections){const{id,file}=selection;
 if(state.records[id]?.status==='verified-photo')continue;
 if(id.startsWith('tourism-')&&!tourism.places.some(p=>p.id===id)){
  const q=id.split('-').at(-1).toUpperCase(),e=round.entities[q],coord=e?.claims.P625?.[0]?.mainsnak.datavalue?.value;if(!coord||!e.claims.P18)throw Error('Entity not ready '+q);
  const key='wikidata-'+q.toLowerCase(),name=e.labels.es?.value||e.labels.en.value,raw=responses.find(r=>r.body.entities?.[q]);
  tourism.sources.push({key,dataset:'Wikidata: '+name,publisher:'Comunidad de Wikidata',datasetUrl:'https://www.wikidata.org/wiki/'+q,url:'https://www.wikidata.org/wiki/Special:EntityData/'+q+'.json',license:'CC0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',downloadedAt:raw.checkedAt,sha256:createHash('sha256').update(JSON.stringify(e)).digest('hex')});
  tourism.places.push({id,title:name,category:'Viajes',address:'',lat:coord.latitude,lon:coord.longitude,barrio:'',subtype:e.descriptions.es?.value||e.descriptions.en?.value||'',coordinateMethod:'Wikidata-P625',wikidataId:q,coordinatePrecision:coord.precision,sourceName:'Wikidata',location:'Buenos Aires, Argentina',sources:[{key,recordId:q}]});
 }
 const place=[...cache.places,...tourism.places].find(p=>p.id===id);if(!place)throw Error('No source '+id);
 const raw=responses.find(r=>Object.values(r.body.query?.pages||{}).some(p=>p.title===file&&p.imageinfo));let candidate,endpoint,checkedAt;
 if(raw){candidate=normalize(Object.values(raw.body.query.pages).find(p=>p.title===file));endpoint=raw.endpoint;checkedAt=raw.checkedAt;}else{
  const found=Object.values(state.searches).find(s=>s.candidates.some(c=>c.file===file));if(!found)throw Error('No metadata '+file);candidate=found.candidates.find(c=>c.file===file);endpoint=found.endpoint;checkedAt=found.checkedAt;
 }
 const fingerprint=createHash('sha256').update(JSON.stringify([place.id,place.title,place.address,place.lat,place.lon])).digest('hex'),searchKey=createHash('sha256').update('variety:'+file).digest('hex');state.searches[searchKey]={endpoint,query:'exact-file:'+file,checkedAt,candidates:[candidate]};state.records[id]={id,originalName:place.title,address:place.address,category:place.category,lat:place.lat,lon:place.lon,fingerprint,searchKey,status:'awaiting-review',checkedAt};if(!state.queue.some(r=>r.id===id))state.queue.push(state.records[id]);
 if(!reviews.some(r=>r.id===id))reviews.push(selection);
 console.log(JSON.stringify({id,name:place.title,address:place.address,lat:place.lat,lon:place.lon,file,description:candidate.description,gps:candidate.gps,license:candidate.license}));
}
state.cap=state.queue.length;for(const[path,value]of Object.entries({'src/data/tourismPlaces.json':tourism,'data/photo-batches/progress.json':state,'data/photo-batches/reviews.json':reviews}))fs.writeFileSync(path,JSON.stringify(value,null,2));
