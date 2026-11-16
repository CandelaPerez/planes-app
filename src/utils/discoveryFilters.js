import geography from '../data/discoveryGeography.json' with { type: 'json' };

// Filter metadata is derived from published fields; it never changes the plans.
export const filterKey = (value = '') => String(value).normalize('NFD')
  .replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es').trim().replace(/\s+/g, ' ');

export function neighborhoodFor(plan) {
  const mapped = geography.entries[plan.id];
  const matches = mapped && mapped.lat === plan.lat && mapped.lon === plan.lon && mapped.originalName === (plan.originalName || plan.title);
  const barrio = plan.barrio || (matches ? mapped.barrio : '');
  const raw = typeof barrio === 'string' ? barrio.trim().replace(/\s+/g, ' ') : '';
  if (filterKey(raw) === 'boca') return 'La Boca';
  if (!raw) return '';
  if (filterKey(raw) === 'san nicolas') return 'San Nicolás';
  return raw.toLocaleLowerCase('es').replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase('es'));
}

// Navigation groups are based on explicit source types and the reviewed catalog category.
export function placeTypeFor(plan) {
  const subtype = filterKey(plan.subtype);
  if (plan.category === 'Gastronomía' || ['bar', 'cafe', 'cafeteria', 'restaurante'].includes(subtype)) return 'Gastronomía';
  if (plan.category === 'Aire Libre') return 'Espacios verdes';
  if (subtype === 'museo') return 'Museos';
  if (plan.category === 'Viajes' || plan.category === 'Cultura') return 'Sitios turísticos';
  return '';
}

export function regionFor(plan) {
  const barrio = filterKey(neighborhoodFor(plan));
  const key = { 'la boca': 'boca', montserrat: 'monserrat' }[barrio] || barrio;
  return geography.neighborhoods[key]?.zone || '';
}

function optionsFor(catalog, getValue) {
  const counts = new Map();
  for (const plan of catalog) {
    const name = getValue(plan);
    if (!name) continue;
    const key = filterKey(name);
    const option = counts.get(key) || { name, count: 0 };
    option.count += 1;
    counts.set(key, option);
  }
  return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function discoveryOptions(catalog) {
  const zoneOrder = ['Zona Norte', 'Zona Sur', 'Zona Centro'];
  const typeOrder = ['Museos', 'Gastronomía', 'Espacios verdes', 'Sitios turísticos'];
  return { zones: optionsFor(catalog, regionFor).sort((a, b) => zoneOrder.indexOf(a.name) - zoneOrder.indexOf(b.name)), placeTypes: optionsFor(catalog, placeTypeFor).sort((a, b) => typeOrder.indexOf(a.name) - typeOrder.indexOf(b.name)) };
}

export function matchesDiscoveryFilters(plan, { category = 'Todas', zone = 'Todas', placeType = 'Todos', search = '' }) {
  const text = filterKey([
    plan.title, plan.originalName, plan.location, plan.address, plan.category,
    plan.category === 'Viajes' ? 'Íconos de BA' : '', plan.subtype,
    neighborhoodFor(plan), regionFor(plan), placeTypeFor(plan),
  ].filter(Boolean).join(' '));
  return (category === 'Todas' || filterKey(plan.category) === filterKey(category))
    && (zone === 'Todas' || filterKey(regionFor(plan)) === filterKey(zone))
    && (placeType === 'Todos' || filterKey(placeTypeFor(plan)) === filterKey(placeType))
    && (!filterKey(search) || text.includes(filterKey(search)));
}
