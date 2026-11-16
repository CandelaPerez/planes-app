import test from 'node:test';
import assert from 'node:assert/strict';
import { itineraryUpdates } from '../src/utils/itineraryEditing.js';
const a={id:'a',title:'A',image:'/a.jpg'}, b={id:'b',title:'B'}, c={id:'c',title:'C'};
const original={id:'same-id',type:'itinerary',title:'Original',items:[a,b,c],description:'Protected',scheduledAt:'2027-01-01T12:00:00Z',image:'/a.jpg',location:'Original location',favorite:true};
test('rename and remove preserves snapshots, order and every unrelated field',()=>{
  const before=structuredClone(original);
  const updates=itineraryUpdates(original,{title:' New name ',items:[{...a,title:'tampered'},c],description:'tampered',scheduledAt:null});
  assert.deepEqual(updates,{title:'New name',items:[a,c]});
  const merged={...original,...updates};
  for(const key of ['id','description','scheduledAt','image','location','favorite']) assert.deepEqual(merged[key],original[key]);
  assert.deepEqual(original,before);
});
test('adding, reordering, duplicating and blank titles are rejected',()=>{
  for(const items of [[b,a],[a,a],[{id:'new'}]]) assert.throws(()=>itineraryUpdates(original,{title:'Name',items}));
  assert.throws(()=>itineraryUpdates(original,{title:' ',items:[a]}));
});
test('one, several or all activities can be removed',()=>{
  for(const items of [[a,b],[c],[]]) assert.deepEqual(itineraryUpdates(original,{title:'Original',items}),{title:'Original',items});
});
test('unchanged legacy snapshots need no catalog access',()=>{
  assert.deepEqual(itineraryUpdates(original,{title:'Original',items:original.items}).items,original.items);
});
