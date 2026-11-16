import { savedCatalogId } from './savedPlans.js';

export function itineraryItemId(item) {
  return savedCatalogId(item) || item.id;
}

export function itineraryUpdates(original, draft, catalog) {
  if (original.type !== 'itinerary') throw Error('No se encontró el itinerario.');
  const title = draft.title.trim();
  if (!title) throw Error('Escribí un nombre para el itinerario.');
  if (!draft.items.length) throw Error('Agregá al menos una actividad.');
  const current = new Map(catalog.map(item => [item.id, item]));
  const existing = new Map((original.items || []).map(item => [itineraryItemId(item), item]));
  const seen = new Set();
  const items = draft.items.map(item => {
    const id = itineraryItemId(item);
    if (!id || seen.has(id)) throw Error('El itinerario contiene actividades repetidas.');
    seen.add(id);
    // Existing snapshots (including custom activities) remain intact. New
    // activities must come from the currently loaded discovery catalog.
    if (existing.has(id)) return existing.get(id);
    if (!current.has(id)) throw Error('Esa actividad ya no está disponible en el catálogo.');
    return current.get(id);
  });
  let scheduledAt = original.scheduledAt || null;
  if (draft.scheduleChanged) {
    const date = draft.scheduledAt ? new Date(draft.scheduledAt) : null;
    if (date && Number.isNaN(date.getTime())) throw Error('Revisá la fecha del itinerario.');
    scheduledAt = date ? date.toISOString() : null;
  }
  const updates = { title, description: draft.description.trim(), items, scheduledAt,
    location: [...new Set(items.map(item => item.location).filter(Boolean))].join(' · ') };
  // Preserve a user's own cover photo; otherwise follow the new first activity.
  if (!original.image || original.image === original.items?.[0]?.image) updates.image = items[0].image || '';
  return updates;
}

export function itineraryDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
