export const ZONES = {
  caba: [-34.62, -58.41, -34.59, -58.37],
  norte: [-34.55, -58.52, -34.50, -58.46],
  oeste: [-34.67, -58.65, -34.62, -58.59],
  sur: [-34.75, -58.42, -34.70, -58.36],
};
export const CATEGORY_SELECTORS = {
  food: ['["amenity"~"^(cafe|restaurant)$"]'],
  culture: ['["tourism"~"^(museum|gallery)$"]', '["amenity"="arts_centre"]'],
  outdoors: ['["leisure"~"^(park|garden|nature_reserve)$"]', '["place"="square"]'],
  entertainment: ['["amenity"~"^(theatre|cinema)$"]'],
  experiences: ['["tourism"="attraction"]'],
};
export function buildQuery({ zone = 'caba', category = 'culture', limit = 40 } = {}) {
  if (!ZONES[zone] || !CATEGORY_SELECTORS[category]) throw new Error('Unknown zone/category.');
  const selections = CATEGORY_SELECTORS[category].map((selector) => `nwr["name"]${selector}(${ZONES[zone].join(',')});`).join('');
  return `[out:json][timeout:10];(${selections});out center tags ${Math.min(40, Math.max(1, limit))};`;
}
export function validPlace(element) {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  return ['node', 'way', 'relation'].includes(element.type) && Number.isSafeInteger(element.id) && element.id > 0
    && typeof element.tags?.name === 'string' && Boolean(element.tags.name.trim())
    && Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -34.91 && lat <= -34.28 && lon >= -58.78 && lon <= -58.335;
}

// Import only explicit point coordinates and original OSM IDs. Never guess a
// polygon centre or turn a non-OSM feature ID into an OSM identifier.
export function elementsFromGeoJson(collection) {
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) throw new Error('Expected GeoJSON FeatureCollection.');
  return collection.features.flatMap((feature) => {
    const match = /^(node|way|relation)\/(\d+)$/.exec(feature.properties?.['@id'] || feature.id || '');
    if (!match || feature.geometry?.type !== 'Point') return [];
    const [lon, lat] = feature.geometry.coordinates;
    const tags = Object.fromEntries(Object.entries(feature.properties || {}).filter(([key]) => !key.startsWith('@')));
    const element = { type: match[1], id: Number(match[2]), center: { lat, lon }, tags };
    return validPlace(element) ? [element] : [];
  });
}
