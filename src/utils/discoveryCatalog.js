const normalizedName = (name) => String(name || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function mergeDiscoveryCatalog(catalog, places) {
  const names = new Set(catalog.map((idea) => normalizedName(idea.title).replace(/^(merienda|cena|visita|recorrido|paseo|picnic|noche|ruta) (en|por|de) /, '').trim()));
  const ids = new Set(catalog.map((idea) => idea.id));
  const additions = places.filter((place) => {
    const name = normalizedName(place.title);
    if (ids.has(place.id) || names.has(name)) return false;
    ids.add(place.id);
    names.add(name);
    return true;
  });
  return [...catalog, ...additions];
}
