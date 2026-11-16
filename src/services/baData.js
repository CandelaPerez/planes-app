import { describePlace } from '../utils/baDataPresentation.js';
import pilot from '../data/baDataPilot.json' with { type: 'json' };
import photos from '../data/baDataPhotos.json' with { type: 'json' };
import tourism from '../data/tourismPlaces.json' with { type: 'json' };

const pilotById = new Map(pilot.entries.map((entry) => [entry.id, entry]));
const photosById = new Map(photos.entries.map((entry) => [entry.id, entry]));

let cachedRequest;

export function toPlanCards(cache) {
  if (cache.version !== 1 || !Array.isArray(cache.places) || !cache.sources?.length) throw new Error('La copia local de BA Data no tiene el formato esperado.');
  const sources = new Map([...cache.sources, ...tourism.sources].map((source) => [source.key, source]));
  if (!cache.places.length || new Set(cache.places.map((place) => place.id)).size !== cache.places.length) throw new Error('La copia local está vacía o contiene identificadores duplicados.');
  const places = [...cache.places, ...tourism.places];
  if (new Set(places.map((place) => place.id)).size !== places.length) throw new Error('El catálogo contiene identificadores duplicados.');
  return places.flatMap((place) => {
    const source = sources.get(place.sources?.[0]?.key);
    if (!source || !place.title || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) throw new Error('La copia contiene un registro sin procedencia o ubicación válida.');
    const sample = pilotById.get(place.id);
    const approved = sample?.status === 'verified-photo' ? sample : photosById.get(place.id);
    const photo = approved?.originalName === place.title && approved.address === place.address && approved.category === place.category ? approved.photo : null;
    if (approved && ((approved.lat !== undefined && approved.lat !== place.lat) || (approved.lon !== undefined && approved.lon !== place.lon))) return [];
    if (!photo || !photo.evidence || !photo.verifiedAt || !photo.sha256 || !photo.author || !photo.license || !photo.licenseUrl?.startsWith('https://creativecommons.org/') || !photo.sourceUrl?.startsWith('https://commons.wikimedia.org/wiki/File:') || !/^\/images\/ba-data-(pilot|batches)\/[a-z0-9-]+\.jpg$/.test(photo.localPath)) return [];
    const card = {
      ...place, location: [place.barrio, 'CABA'].filter(Boolean).join(', '), ambaZone: 'CABA',
      budget: 'Sin información',
      ...describePlace(place),
      ...(photo ? { image:photo.localPath, imageKind:'photograph', imageSourceUrl:photo.sourceUrl, photograph:photo } : {}),
      sourceName: place.wikidataId ? 'Wikidata — datos abiertos' : 'BA Data — GCBA', sourceUrl: source.datasetUrl, sourceLicense: source.license,
      resourceUrl: source.url, sourceUpdatedAt: source.resourceLastModified, fetchedAt: source.downloadedAt,
      sourceReferences: place.sources.map((reference) => ({ ...reference, ...sources.get(reference.key) })),
    };
    // Do not reuse a reviewed photograph if the underlying place has changed.
    if (!sample || sample.originalName !== place.title || sample.address !== place.address || sample.category !== place.category) return [card];
    return [{
      ...card, originalName: place.title, title: sample.title, description: sample.description, pilotOrder: sample.order,
      ...(sample.status === 'verified-photo' ? { image: sample.photo.localPath, imageKind: 'photograph', imageSourceUrl: sample.photo.sourceUrl, photograph: sample.photo } : {}),
    }];
  });
}

export function loadBaDataPreview() {
  if (!cachedRequest) {
    cachedRequest = fetch('/data/ba-data.json', { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`No se pudo cargar la copia local (HTTP ${response.status}).`);
        const cache = await response.json();
        const plans = toPlanCards(cache);
        if (!plans.length) throw new Error('El catálogo fotográfico no contiene fotografías verificadas disponibles.');
        return { ...cache, plans };
      })
      .catch((error) => { cachedRequest = null; throw error; });
  }
  return cachedRequest;
}
