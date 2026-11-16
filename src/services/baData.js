let cachedRequest;

export function toPlanCards(cache) {
  if (cache.version !== 1 || !Array.isArray(cache.places) || !cache.sources?.length) throw new Error('La copia local de BA Data no tiene el formato esperado.');
  const sources = new Map(cache.sources.map((source) => [source.key, source]));
  if (!cache.places.length || new Set(cache.places.map((place) => place.id)).size !== cache.places.length) throw new Error('La copia local está vacía o contiene identificadores duplicados.');
  return cache.places.map((place) => {
    const source = sources.get(place.sources?.[0]?.key);
    if (!source || !place.title || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) throw new Error('La copia contiene un registro sin procedencia o ubicación válida.');
    return {
      ...place, location: [place.barrio, 'CABA'].filter(Boolean).join(', '), ambaZone: 'CABA',
      budget: 'Sin información', image: '/images/plan-placeholder.svg',
      description: place.subtype || '',
      sourceName: 'BA Data — GCBA', sourceUrl: source.datasetUrl, sourceLicense: source.license,
      resourceUrl: source.url, sourceUpdatedAt: source.resourceLastModified, fetchedAt: source.downloadedAt,
      sourceReferences: place.sources.map((reference) => ({ ...reference, ...sources.get(reference.key) })),
    };
  });
}

export function loadBaDataPreview() {
  if (!cachedRequest) {
    cachedRequest = fetch('/data/ba-data.json', { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`No se pudo cargar la copia local (HTTP ${response.status}).`);
        const cache = await response.json();
        return { ...cache, plans: toPlanCards(cache) };
      })
      .catch((error) => { cachedRequest = null; throw error; });
  }
  return cachedRequest;
}
