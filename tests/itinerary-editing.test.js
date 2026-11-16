import test from 'node:test';
import assert from 'node:assert/strict';
import { itineraryDateInput, itineraryItemId, itineraryUpdates } from '../src/utils/itineraryEditing.js';

const first = { id: 'badata-food-1', title: 'Café', image: '/cafe.jpg', location: 'Palermo' };
const second = { id: 'badata-green-2', title: 'Parque', image: '/parque.jpg', location: 'Belgrano' };
const old = { id: 'cat_3', title: 'Actividad anterior', image: '/old.jpg' };
const custom = { id: 'my-event', catalogId: 'cat_3', savedOrigin: 'custom', title: 'Mi salida', image: '/personal.jpg' };
const original = { id: 'same-document', type: 'itinerary', title: 'Mi día', items: [first, old, custom],
  image: first.image, favorite: true, status: 'realizado', comment: 'Mi recuerdo', rating: 5, scheduledAt: '2027-01-01T12:00:00.123Z' };
const draft = { title: '  Otro nombre  ', description: '  Una descripción  ', items: [custom, second], scheduleChanged: false };

test('itinerary edit reorders, adds current activities, removes old ones and preserves personal fields', () => {
  const before = structuredClone(original);
  const updates = itineraryUpdates(original, draft, [first, second]);
  assert.equal(updates.title, 'Otro nombre');
  assert.equal(updates.description, 'Una descripción');
  assert.deepEqual(updates.items, [custom, second]);
  assert.equal(updates.image, custom.image);
  assert.equal(updates.scheduledAt, original.scheduledAt);
  assert.equal(itineraryItemId(custom), 'my-event');
  const merged = { ...original, ...updates };
  for (const field of ['id', 'type', 'favorite', 'status', 'comment', 'rating']) assert.deepEqual(merged[field], original[field]);
  assert.deepEqual(original, before);
});

test('existing unavailable or personal snapshots survive edits without silent replacement', () => {
  const personal = { ...original, image: '/my-cover.jpg' };
  const updates = itineraryUpdates(personal, { ...draft, items: [old, custom, first] }, [{ ...first, image: '/refreshed.jpg' }]);
  assert.deepEqual(updates.items, [old, custom, first]);
  assert.equal(updates.image, undefined);
});

test('new unavailable activities, duplicates, empty names and empty itineraries are rejected', () => {
  for (const change of [{ items: [] }, { title: ' ' }, { items: [second, second] }, { items: [{ id: 'cat_4' }] }]) {
    assert.throws(() => itineraryUpdates(original, { ...draft, ...change }, [first, second]));
  }
  assert.throws(() => itineraryUpdates({ type: 'custom' }, draft, [first]));
});

test('schedule editing supports changing, clearing and preserving an untouched timestamp', () => {
  const date = '2027-04-08T15:30';
  assert.equal(itineraryUpdates(original, { ...draft, scheduledAt: date, scheduleChanged: true }, [second]).scheduledAt, new Date(date).toISOString());
  assert.equal(itineraryUpdates(original, { ...draft, scheduledAt: '', scheduleChanged: true }, [second]).scheduledAt, null);
  assert.throws(() => itineraryUpdates(original, { ...draft, scheduledAt: 'invalid', scheduleChanged: true }, [second]));
  assert.equal(itineraryDateInput(null), '');
  assert.equal(itineraryDateInput('invalid'), '');
  const input = itineraryDateInput(original.scheduledAt);
  assert.equal(new Date(input).getTime(), Math.floor(new Date(original.scheduledAt).getTime() / 60000) * 60000);
});
