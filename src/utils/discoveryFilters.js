// Filter metadata is derived from published fields; it never changes the plans.
export const filterKey = (value = '') => String(value).normalize('NFD')
  .replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es').trim().replace(/\s+/g, ' ');

export function neighborhoodFor(plan) {
  const raw = typeof plan.barrio === 'string' ? plan.barrio.trim().replace(/\s+/g, ' ') : '';
  if (!raw) return '';
  if (filterKey(raw) === 'san nicolas') return 'San Nicolás';
  return raw.toLocaleLowerCase('es').replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase('es'));
}

const publishedTypes = new Map([
  ['museo', 'Museos'], ['cafe', 'Cafeterías'], ['cafeteria', 'Cafeterías'],
  ['restaurante', 'Restaurantes'], ['bar', 'Bares'],
  ['parque', 'Parques y plazas'], ['plaza', 'Parques y plazas'],
  ['jardin botanico', 'Jardines botánicos'], ['patio recreativo', 'Patios recreativos'],
  ['centro cultural', 'Centros culturales'], ['libreria', 'Librerías'],
  ['sala de teatro', 'Teatros'], ['monumentos y lugares historicos', 'Monumentos y lugares históricos'],
]);

export function placeTypeFor(plan) {
  const subtype = filterKey(plan.subtype);
  if (publishedTypes.has(subtype)) return publishedTypes.get(subtype);
  // Supplemental records publish a short description rather than a type code.
  // Only explicit type words are used; names and photographs are not guesses.
  if (!plan.wikidataId) return '';
  const explicitTypes = [
    [/^monumento historico\b/, 'Monumentos y lugares históricos'],
    [/^palacio\b/, 'Palacios'], [/^puente\b/, 'Puentes'],
    [/^estadio\b/, 'Estadios'], [/^edificio legislativo\b/, 'Edificios legislativos'],
    [/^(templo|basilica|iglesia)\b/, 'Templos'], [/^torre\b/, 'Torres'],
    [/^calle\b/, 'Calles'], [/^cementerio\b/, 'Cementerios'], [/^edificio\b/, 'Edificios'],
  ];
  return explicitTypes.find(([pattern]) => pattern.test(subtype))?.[1] || '';
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
  return { zones: optionsFor(catalog, neighborhoodFor), placeTypes: optionsFor(catalog, placeTypeFor) };
}

export function matchesDiscoveryFilters(plan, { category = 'Todas', zone = 'Todas', placeType = 'Todos', search = '' }) {
  const text = filterKey([
    plan.title, plan.originalName, plan.location, plan.address, plan.category,
    plan.category === 'Viajes' ? 'Íconos de BA' : '', plan.subtype,
    neighborhoodFor(plan), placeTypeFor(plan),
  ].filter(Boolean).join(' '));
  return (category === 'Todas' || filterKey(plan.category) === filterKey(category))
    && (zone === 'Todas' || filterKey(neighborhoodFor(plan)) === filterKey(zone))
    && (placeType === 'Todos' || filterKey(placeTypeFor(plan)) === filterKey(placeType))
    && (!filterKey(search) || text.includes(filterKey(search)));
}
