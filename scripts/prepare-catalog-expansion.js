import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const data=await read('data/photo-batches/expansion.json'),cache=await read('public/data/ba-data.json'),state=await read('data/photo-batches/progress.json');
const pages=Object.values(data.responses).flatMap(b=>Object.values(b.query?.pages||{})).filter(p=>p.imageinfo);
const plain=(v='')=>v.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
const normalize=p=>{const i=p.imageinfo[0],m=i.extmetadata;return {file:p.title,pageId:p.pageid,url:i.thumburl||i.url,originalUrl:i.url,sourceUrl:i.descriptionurl,author:plain(m.Artist?.value),authorMetadata:m.Artist?.value||'',uploader:i.user,license:m.LicenseShortName?.value||'',licenseUrl:m.LicenseUrl?.value||'',restrictions:plain(m.Restrictions?.value),photoDate:plain(m.DateTimeOriginal?.value),description:plain(m.ImageDescription?.value),categories:m.Categories?.value||'',gps:m.GPSLatitude&&m.GPSLongitude?{lat:Number(m.GPSLatitude.value),lon:Number(m.GPSLongitude.value)}:null,mime:i.mime,originalBytes:i.size};};
const selections={
'badata-food-1985':'File:Pizzería El Cuartito 09.jpg',
'badata-food-2296':'File:Pizzería Güerrín.jpg',
'badata-food-170':'File:Bar El Preferido de Palermo2.jpg',
'badata-food-565':'File:El Imperio de la Pizza 02.jpg',
'badata-culture-1103':'File:CENTROCULTURALRECOLETA2022.jpg',
'badata-culture-2599':'File:Museo de Arte Español Enrique Larreta esquina.jpg',
'badata-culture-2674':'File:Museo Histórico Nacional, Buenos Aires Argentina.jpg',
'badata-green-1444':'File:Buenos Aires - Jardín Japonés - 200806a.jpg',
'badata-green-171':'File:DefPuebloCABA - Barrio Parque Saavedra (1).jpg'};
const tourism={version:1,sources:[],places:[]};
for(const e of Object.values(data.entities)){
 const coords=e.claims.P625[0].mainsnak.datavalue.value;
 const key='wikidata-'+e.id.toLowerCase(),name=e.labels.es?.value||e.labels.en.value;
 const source={key,dataset:'Wikidata: '+name,publisher:'Comunidad de Wikidata',datasetUrl:'https://www.wikidata.org/wiki/'+e.id,url:'https://www.wikidata.org/wiki/Special:EntityData/'+e.id+'.json',license:'CC0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',downloadedAt:new Date(data.lastRequestAt).toISOString(),sha256:createHash('sha256').update(JSON.stringify(e)).digest('hex')};
 const place={id:'tourism-'+key,title:name,category:'Viajes',address:'',lat:coords.latitude,lon:coords.longitude,barrio:'',subtype:e.descriptions.es?.value||e.descriptions.en?.value||'',coordinateMethod:'Wikidata-P625',wikidataId:e.id,coordinatePrecision:coords.precision,sourceName:'Wikidata',location:'Buenos Aires, Argentina',sources:[{key,recordId:e.id}]};
 tourism.sources.push(source);tourism.places.push(place);
 selections[place.id]=e.id==='Q1029566'?'File:Caminito Tango, Buenos Aires ARG.jpg':'File:'+e.claims.P18[0].mainsnak.datavalue.value;
}
await writeFile('src/data/tourismPlaces.json',JSON.stringify(tourism,null,2));
const reviews=await read('data/photo-batches/reviews.json');
for(const[id,file]of Object.entries(selections)){
 if(state.records[id]?.status === 'verified-photo') continue;
 const page=pages.find(p=>p.title===file);if(!page)throw Error('No metadata '+file);
 const candidate=normalize(page);const place=[...cache.places,...tourism.places].find(p=>p.id===id);
 const fingerprint=createHash('sha256').update(JSON.stringify([place.id,place.title,place.address,place.lat,place.lon])).digest('hex');
 const query='manual-exact-file:'+file,searchKey=createHash('sha256').update(query).digest('hex');
 const record={id,originalName:place.title,address:place.address,category:place.category,lat:place.lat,lon:place.lon,fingerprint,searchKey,status:'awaiting-review',checkedAt:new Date().toISOString()};
 const response=Object.entries(data.responses).find(([,b])=>Object.values(b.query?.pages||{}).some(p=>p.title===file));
 state.searches[searchKey]={endpoint:response[0],query,checkedAt:record.checkedAt,candidates:[candidate]};
 state.records[id]=record;if(!state.queue.some(r=>r.id===id))state.queue.push(record);
 if(!reviews.some(r=>r.id===id))reviews.push({id,file});
 console.log(JSON.stringify({id,name:place.title,lat:place.lat,lon:place.lon,address:place.address,file,gps:candidate.gps,description:candidate.description,license:candidate.license}));
}
state.cap=state.queue.length;await writeFile('data/photo-batches/progress.json',JSON.stringify(state,null,2));await writeFile('data/photo-batches/reviews.json',JSON.stringify(reviews,null,2));
