import assert from 'node:assert/strict';import {test} from 'node:test';import {readFile} from 'node:fs/promises';
import{catalogPlanToSave,savedCatalogId,savedPlanKind,savedPlansView,reconcileSavedPlan,persistPreviewPlans,LEGACY_CATALOG_IDS,verifiedSavedPhoto}from'../src/utils/savedPlans.js';
import{toPlanCards}from'../src/services/baData.js';
const catalog=toPlanCards(JSON.parse(await readFile('public/data/ba-data.json','utf8'))),place=catalog.find(p=>p.id==='badata-food-1362');
const custom={id:'6bd8c5bb-26d8-419a-9ce4-67b22fbde01a',title:'Merienda en el Café Tortoni',description:'Mi evento privado',image:'data:image/png;base64,cGVyc29uYWw=',location:'Mi casa',status:'pendiente'};

test('legacy detection uses stable IDs and preserves custom, ambiguous and itinerary records',()=>{
 assert.equal(LEGACY_CATALOG_IDS.size,129);
 assert.equal(savedPlanKind({id:'old-doc',catalogId:'cat_1'}),'legacy-catalog');
 assert.equal(savedPlanKind({id:'coverage_1_1_1'}),'legacy-catalog');
 assert.equal(savedPlanKind({id:'old-doc',externalId:'cat_2'}),'legacy-catalog');
 assert.equal(savedPlanKind({id:'old-preloaded',isCatalog:true}),'legacy-catalog');
 assert.equal(savedPlanKind({...custom,savedOrigin:'custom',isCatalog:true}),'custom');
 assert.equal(savedPlanKind({...custom,catalogId:'cat_1'}),'custom','Repair historical title-inferred links without hiding UUID custom records');
 assert.equal(savedPlanKind({...custom,id:'cat_1',savedOrigin:'custom'}),'custom');
 assert.equal(savedPlanKind(custom),'custom-or-unidentified');
 assert.equal(savedPlanKind({...custom,id:'trip',type:'itinerary',catalogId:'cat_1',items:[{id:'cat_1'}]}),'itinerary');
 assert.equal(savedPlanKind({id:place.id}),'current-catalog');
 assert.equal(savedCatalogId({id:'firebase-random-id',externalId:place.id}),place.id);
});

test('saved view hides legacy records without deleting or changing raw personal data',()=>{
 const old={id:'old-doc',catalogId:'cat_1',status:'realizado',favorite:true,comment:'Recuerdo antiguo',scheduledAt:'2027-01-02T12:00:00Z',image:'personal.jpg',rating:5};
 const current={...catalogPlanToSave(place),image:'https://example.com/stale-generic.jpg',favorite:true,comment:'Mi recuerdo',scheduledAt:'2027-02-03T13:00:00Z',status:'realizado',rating:4};
 const itinerary={id:'trip',type:'itinerary',title:'Viaje original',items:[old,current],status:'pendiente',image:'itinerary.jpg'};
 const raw=[old,current,custom,itinerary],before=structuredClone(raw),view=savedPlansView(raw,catalog);
 assert.equal(view.hiddenLegacy.length,1);
 assert.equal(view.plans.length,3);
 assert.equal(view.plans.find(p=>p.id===place.id).image,place.image);
 assert.deepEqual(view.plans.find(p=>p.id===custom.id),custom);
 assert.equal(view.plans.find(p=>p.id==='trip').items.length,1);
 assert.equal(view.plans.find(p=>p.id==='trip').items[0].id,current.id);
 for(const key of ['favorite','comment','scheduledAt','status','rating'])assert.equal(view.plans.find(p=>p.id===place.id)[key],current[key]);
 assert.deepEqual(raw,before);
});

test('current metadata and photo refresh while edited titles and document IDs survive',()=>{
 const snapshot={...catalogPlanToSave(place),id:'existing-firestore-doc',userTitle:'Mi merienda favorita',title:'Mi merienda favorita',image:'old.jpg',comment:'Mi foto sigue en este documento'};
 const latest={...place,image:'/images/current-photo.jpg',description:'Descripción actual',category:'Gastronomía',location:'Ubicación actual',title:'Nombre actualizado'};
 const result=reconcileSavedPlan(snapshot,new Map([[place.id,latest]]));
 assert.equal(result.image,latest.image);assert.equal(result.description,latest.description);assert.equal(result.location,latest.location);
 assert.equal(result.title,snapshot.userTitle);assert.equal(result.id,snapshot.id);assert.equal(snapshot.image,'old.jpg');
 const automatic={...catalogPlanToSave(place)};
 assert.equal(reconcileSavedPlan(automatic,new Map([[place.id,latest]])).title,latest.title);
 const retired={...catalogPlanToSave(place),catalogId:'badata-food-999999',id:'saved-retired'};
 assert.equal(savedPlansView([retired],catalog).plans.length,0);
 assert.equal(savedPlansView([retired],catalog).hiddenUnavailable.length,1);
});

test('repeated catalog snapshots use the same stable key and duplicate views do not overwrite documents',()=>{
 const one=catalogPlanToSave(place),two=catalogPlanToSave(place);
 assert.equal(one.id,two.id);assert.equal(one.catalogId,place.id);assert.equal(one.savedOrigin,'verified-catalog');
 const raw=[one,{...two,id:'previous-document',comment:'Historia protegida',favorite:true}];
 const view=savedPlansView(raw,catalog);assert.equal(view.plans.length,1);assert.equal(view.duplicateCount,1);assert.equal(raw.length,2);
});

test('local persistence makes a reversible backup and retains hidden records in both storage keys',async()=>{
 const raw=[{id:'old-doc',catalogId:'cat_1'},custom,catalogPlanToSave(place)],original=JSON.stringify(raw);
 const values=new Map([['porhacer_user_plans',original]]);
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 await persistPreviewPlans(storage,raw);
 assert.equal(values.get('porhacer_user_plans'),original);
 assert.deepEqual(JSON.parse(values.get('porhacer_preview_plans')),raw);
 const backup=values.get('porhacer_saved_plans_backup_v1');assert.equal(JSON.parse(backup).legacy,original);
 await persistPreviewPlans(storage,[...raw,{id:'custom-new',savedOrigin:'custom'}]);
 assert.equal(values.get('porhacer_saved_plans_backup_v1'),backup);
 assert.equal(JSON.parse(values.get('porhacer_preview_plans')).filter(p=>p.catalogId==='cat_1').length,1);
 const broken={getItem:()=>null,setItem:()=>{throw Error('Quota');}};
 await assert.rejects(persistPreviewPlans(broken,raw),/Quota/);
});


test('a saved image is not considered a verified snapshot solely because its URL works',()=>{
 assert.equal(verifiedSavedPhoto(catalogPlanToSave(place)),place.image);
 assert.equal(verifiedSavedPhoto({id:'badata-food-999999',image:'https://example.com/works.jpg'}),'');
 assert.equal(verifiedSavedPhoto({...catalogPlanToSave(place),catalogId:'badata-food-999999'}),'','Reject a photograph whose local ID belongs to a different place');
});

test('all personal sections share a non-mutating view of current places and custom plans',()=>{
 const old={id:'cat_1',status:'realizado',scheduledAt:'2027-01-01T12:00:00Z',comment:'Protected'};
 const retired={...catalogPlanToSave(place),id:'retired',catalogId:'badata-food-999999',status:'realizado'};
 const current={...catalogPlanToSave(place),status:'realizado',scheduledAt:old.scheduledAt};
 const personal={...custom,status:'realizado',scheduledAt:old.scheduledAt};
 const mixed={id:'mixed',type:'itinerary',items:[old,current,custom,retired]};
 const empty={id:'empty',type:'itinerary',items:[old,custom]};
 const raw=[old,retired,current,personal,mixed,empty],before=structuredClone(raw);
 const view=savedPlansView(raw,catalog);
 assert.deepEqual(view.plans.map(p=>p.id),[current.id,personal.id,mixed.id]);
 assert.deepEqual(view.plans.find(p=>p.id==='mixed').items.map(p=>p.id),[current.id]);
 assert.deepEqual(view.plans.filter(p=>p.scheduledAt).map(p=>p.id),[current.id,personal.id]);
 assert.deepEqual(raw,before);
});
