import legacyIds from '../data/legacyCatalogIds.json' with { type: 'json' };

export const LEGACY_CATALOG_IDS = new Set(legacyIds);
const modernId = (id) => typeof id === 'string'
  && (/^badata-(food|culture|green|bus)-\d+$/.test(id) || /^tourism-wikidata-q\d+$/.test(id));
const uuid = (id = '') => /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id);

function explicitCustom(plan) {
  if (plan.savedOrigin === 'custom') return true;
  // Earlier local loading inferred catalogId from a matching title. Do not
  // hide an unmarked UUID custom record that lacks any catalog snapshot fields.
  return !plan.savedOrigin && uuid(plan.id) && LEGACY_CATALOG_IDS.has(plan.catalogId)
    && !['company', 'address', 'duration', 'officialUrl', 'sourceName', 'originalName'].some((key) => plan[key]);
}

export function savedCatalogId(plan) {
  if (plan.type === 'itinerary' || explicitCustom(plan)) return null;
  return [plan.catalogId, plan.externalId, plan.id].find((id) => modernId(id) || LEGACY_CATALOG_IDS.has(id)) || null;
}

export function savedPlanKind(plan) {
  if (plan.type === 'itinerary') return 'itinerary';
  if (explicitCustom(plan)) return 'custom';
  const id = savedCatalogId(plan);
  if (modernId(id)) return 'current-catalog';
  if (LEGACY_CATALOG_IDS.has(id) || plan.isCatalog === true) return 'legacy-catalog';
  // Unknown records are retained: a title alone is never evidence to hide data.
  return 'custom-or-unidentified';
}

export function reconcileSavedPlan(saved, catalogById) {
  if (savedPlanKind(saved) !== 'current-catalog') return saved;
  const catalogId = savedCatalogId(saved);
  const current = catalogById.get(catalogId);
  if (!current) return { ...saved, catalogId };
  const title = saved.userTitle || (saved.catalogTitleAtSave && saved.title === saved.catalogTitleAtSave
    ? current.title : saved.title || current.title);
  // Refresh public place fields only in the view; preserve every stored personal
  // field and document ID. This object is never written back automatically.
  return {
    ...saved, catalogId, title,
    originalName: current.originalName, description: current.description,
    category: current.category, location: current.location, address: current.address,
    lat: current.lat, lon: current.lon, barrio: current.barrio, ambaZone: current.ambaZone,
    budget: current.budget, image: current.image, imageKind: current.imageKind,
    photograph: current.photograph, imageSourceUrl: current.imageSourceUrl,
    sourceName: current.sourceName, sourceUrl: current.sourceUrl, sourceLicense: current.sourceLicense,
    sourceReferences: current.sourceReferences, coordinateMethod: current.coordinateMethod,
    openingHours: current.openingHours, phone: current.phone, wikidataId: current.wikidataId,
  };
}

export function savedPlansView(storedPlans, catalog) {
  const catalogById = new Map(catalog.map((plan) => [plan.id, plan]));
  const groups = new Map();
  const hiddenLegacy = [];
  const hiddenUnavailable = [];
  const hiddenItineraries = [];
  for (const stored of storedPlans) {
    if (savedPlanKind(stored) === 'legacy-catalog') { hiddenLegacy.push(stored); continue; }
    if (savedPlanKind(stored) === 'current-catalog' && !catalogById.has(savedCatalogId(stored))) {
      hiddenUnavailable.push(stored); continue;
    }
    let plan = reconcileSavedPlan(stored, catalogById);
    if (stored.type === 'itinerary') {
      const items = (stored.items || []).filter(item => catalogById.has(savedCatalogId(item)))
        .map(item => reconcileSavedPlan(item, catalogById));
      if (!items.length) { hiddenItineraries.push(stored); continue; }
      const personalCover = stored.image && !(stored.items || []).some(item => item.image === stored.image);
      plan = { ...stored, items, image: personalCover ? stored.image : items[0].image,
        location: [...new Set(items.map(item => item.location).filter(Boolean))].join(' · ') };
    }
    const key = savedPlanKind(plan) === 'current-catalog' ? `catalog:${savedCatalogId(plan)}` : `document:${plan.id}`;
    const previous = groups.get(key);
    // A stable representative prevents toggling a favorite/status from switching
    // the visible card to another historical duplicate. Never merge their data.
    const canonical = savedCatalogId(plan);
    if (!previous || (plan.id === canonical && previous.id !== canonical)
      || (previous.id !== canonical && String(plan.id).localeCompare(String(previous.id), 'en') < 0)) groups.set(key, plan);
  }
  return { plans: [...groups.values()], hiddenLegacy, hiddenUnavailable, hiddenItineraries,
    duplicateCount: storedPlans.length - hiddenLegacy.length - hiddenUnavailable.length - hiddenItineraries.length - groups.size, catalogById };
}

export function catalogPlanToSave(idea) {
  const snapshot = Object.fromEntries(Object.entries(idea)
    .filter(([key, value]) => value !== undefined && !['backups', 'source', 'credit'].includes(key)));
  return { ...snapshot, id: idea.id, catalogId: idea.id, savedOrigin: 'verified-catalog',
    catalogTitleAtSave: idea.title, status: 'pendiente', favorite: false, comment: '' };
}

export function verifiedSavedPhoto(plan) {
  const photo = plan.photograph;
  const catalogId = savedCatalogId(plan);
  return photo?.evidence && /^[a-f0-9]{64}$/.test(photo.sha256 || '')
    && photo.author && photo.license && photo.localPath?.endsWith(`/${catalogId}.jpg`)
    ? photo.localPath : '';
}

export function previewStorageBackup(storage) {
  const key = 'porhacer_saved_plans_backup_v1';
  if (storage.getItem(key) !== null) return;
  storage.setItem(key, JSON.stringify({ createdAt: new Date().toISOString(),
    preview: storage.getItem('porhacer_preview_plans'), legacy: storage.getItem('porhacer_user_plans') }));
}

export async function persistPreviewPlans(storage, plans) {
  previewStorageBackup(storage);
  storage.setItem('porhacer_preview_plans', JSON.stringify(plans));
}
