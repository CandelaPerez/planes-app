import { savedCatalogId } from './savedPlans.js';

export function itineraryItemId(item) {
  return savedCatalogId(item) || item.id;
}

export function itineraryUpdates(original, draft) {
  if (original.type !== 'itinerary') throw Error('No se encontró el itinerario.');
  const title = draft.title.trim();
  if (!title) throw Error('Escribí un nombre para el itinerario.');
  const existing = original.items || [];
  let cursor = 0;
  const items = draft.items.map(item => {
    const id = itineraryItemId(item);
    while (cursor < existing.length && itineraryItemId(existing[cursor]) !== id) cursor++;
    if (!id || cursor === existing.length) throw Error('Solo podés quitar actividades del itinerario.');
    return existing[cursor++];
  });
  return { title, items };
}
