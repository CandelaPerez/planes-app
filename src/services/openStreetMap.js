import { verifiedSnapshot as snapshot } from '../../data/verifiedPlaces';
import photoReferences from '../../data/place-photos.json';
import { placeIllustration } from '../utils/placeIllustration';

const CACHE_KEY = 'porhacer_openstreetmap_places_v4';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let requestInFlight;
let memoryCache;
let retryAfter = 0;

function classify(tags) {
  const amenity = tags.amenity || '';
  const tourism = tags.tourism || '';
  const leisure = tags.leisure || '';
  if (['restaurant', 'cafe', 'bar', 'pub', 'food_court', 'ice_cream'].includes(amenity)) return 'Gastronomía';
  if (['park', 'garden', 'playground', 'nature_reserve'].includes(leisure) || tags.place === 'square') return 'Aire Libre';
  if (['theatre', 'cinema'].includes(amenity)) return 'Entretenimiento';
  if (tourism === 'attraction') return 'Experiencias';
  if (['cinema', 'bowling_alley', 'nightclub', 'zoo', 'theme_park', 'aquarium'].includes(amenity) || ['zoo', 'theme_park', 'aquarium'].includes(tourism) || ['sports_centre', 'stadium', 'pitch', 'water_park', 'fitness_centre'].includes(leisure)) return 'Entretenimiento';
  if (['sports_centre', 'stadium'].includes(amenity)) return 'Entretenimiento';
  return 'Cultura';
}

function zoneForCoordinates(lat, lon) {
  if (lat >= -34.705 && lat <= -34.526 && lon >= -58.531 && lon <= -58.335) return 'CABA';
  if (lat >= -34.57 && lat <= -34.28 && lon >= -58.76 && lon <= -58.36) return 'Zona Norte';
  if (lat >= -34.82 && lat <= -34.54 && lon >= -58.78 && lon <= -58.51) return 'Zona Oeste';
  if (lat >= -34.91 && lat <= -34.70 && lon >= -58.57 && lon <= -58.34) return 'Zona Sur';
  return 'AMBA';
}

function normalizeElement(element) {
  const tags = element.tags || {};
  const verification = element.verification;
  const lat = Number(element.lat ?? element.center?.lat);
  const lon = Number(element.lon ?? element.center?.lon);
  if (typeof tags.name !== 'string' || !tags.name.trim() || !['node', 'way', 'relation'].includes(element.type) || !Number.isSafeInteger(element.id) || element.id <= 0 || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const category = classify(tags);
  const photo = photoReferences[`${element.type}/${element.id}`];
  const illustration = placeIllustration(category, `${element.type}/${element.id}`);
  const zone = zoneForCoordinates(lat, lon);
  const street = tags['addr:street'];
  const houseNumber = tags['addr:housenumber'];
  const address = street ? `${street}${houseNumber ? ` ${houseNumber}` : ''}${tags['addr:postcode'] ? `, ${tags['addr:postcode']}` : ''}` : '';
  const locality = tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || tags['addr:suburb'] || tags['addr:neighbourhood'] || '';
  const location = [locality, zone].filter(Boolean).filter((part, index, parts) => index === 0 || part !== parts[index - 1]).join(', ');
  const type = element.type === 'node' || element.type === 'way' || element.type === 'relation' ? element.type : 'node';
  const subtype = tags.amenity || tags.tourism || tags.leisure || tags.historic || '';
  return {
    id: `osm-${type}-${element.id}`,
    title: verification?.name || tags.name,
    description: tags.description || tags['description:es'] || `Lugar permanente registrado en OpenStreetMap (${subtype.replaceAll('_', ' ')}).`,
    category,
    subtype,
    budget: tags.fee === 'no' ? 'Gratis' : 'Sin información',
    image: photo ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(photo.file)}?width=1000` : illustration,
    imageFallback: illustration,
    imageType: photo ? 'verified-photo' : 'illustrative',
    photoReference: photo || null,
    ...(photo ? { source: photo.sourceUrl, credit: `${photo.author} · ${photo.license} · recorte de visualización` } : {}),
    address: verification?.address || address,
    location: location || zone,
    ambaZone: zone,
    lat,
    lon,
    openingHours: tags.opening_hours || '',
    officialUrl: verification?.officialUrl || tags.website || tags['contact:website'] || '',
    phone: tags.phone || tags['contact:phone'] || '',
    sourceName: 'OpenStreetMap',
    sourceUrl: `https://www.openstreetmap.org/${type}/${element.id}`,
    sourceLicense: 'ODbL',
    placeType: 'permanent',
    osmTimestamp: '',
    verifiedOn: verification?.verifiedOn || '',
    verification: verification || null,
    provenance: element.provenance || null,
  };
}

export function normalizePayload(payload) {
  const seen = new Set();
  return (payload.elements || []).map(normalizeElement).filter(Boolean).filter((place) => {
    const name = place.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, ' ').trim();
    const locationKey = `${place.lat.toFixed(4)},${place.lon.toFixed(4)}`;
    const key = `${name}|${locationKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((place) => ({
    ...place,
    osmTimestamp: place.provenance?.osmDataTimestamp || payload.osmTimestamp || '',
    obtainedAt: place.provenance?.obtainedAt || payload.fetchedAt || payload.importedOn || '',
    datasetUrl: place.provenance?.datasetUrl || payload.datasetUrl || '',
    description: place.verifiedOn
      ? `Lugar de origen OpenStreetMap. Nombre y ${place.verification.addressPrecision === 'street' ? 'calle' : 'dirección'} contrastados con fuentes institucionales el ${place.verifiedOn}.${place.verification.addressPrecision === 'street' ? ' Acceso exacto pendiente de confirmar.' : ''}`
      : `Lugar registrado en OpenStreetMap. Datos del ${(place.provenance?.osmDataTimestamp || payload.osmTimestamp || '').slice(0, 10)}; verificá los datos actuales antes de ir.`,
    visitTips: `${place.verifiedOn ? `Verificación institucional: ${place.verifiedOn}. ` : ''}Coordenadas del extracto OSM: ${(place.provenance?.osmDataTimestamp || payload.osmTimestamp || '').slice(0, 10) || 'fecha no informada'}. ${place.verification?.note || ''} Consultá los horarios y condiciones actuales en el sitio oficial.`,
  }));
}

function getCache() {
  if (memoryCache) return memoryCache;
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached?.revision === snapshot.revision && cached?.savedAt > 0 && Array.isArray(cached.places) && cached.places.length && cached.places.every((place) => place.sourceName === 'OpenStreetMap' && /^osm-(node|way|relation)-\d+$/.test(place.id) && typeof place.title === 'string' && Number.isFinite(place.lat) && Number.isFinite(place.lon))) {
      memoryCache = cached;
    }
  } catch { /* Ignore unavailable or malformed local cache. */ }
  memoryCache ||= { savedAt: 0, revision: snapshot.revision, osmTimestamp: snapshot.osmTimestamp, dataUpdatedAt: snapshot.dataUpdatedAt, verificationUpdatedOn: snapshot.verificationUpdatedOn, places: normalizePayload(snapshot) };
  return memoryCache;
}

export function loadStoredOpenStreetMapPlaces() {
  return getCache().places;
}

export async function fetchOpenStreetMapPlaces({ force = false } = {}) {
  const cached = getCache();
  if (!force && cached.savedAt && Date.now() - cached.savedAt < CACHE_TTL_MS) return cached.places;
  if (Date.now() < retryAfter) {
    return cached.places;
  }
  if (!requestInFlight) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    requestInFlight = fetch('/api/places', { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          const error = new Error(payload.message || 'No se pudo consultar OpenStreetMap.');
          error.retryAfterSeconds = payload.retryAfterSeconds || 0;
          retryAfter = Date.now() + Math.max(30, Number(error.retryAfterSeconds) || 0) * 1000;
          throw error;
        }
        if (payload.source !== 'OpenStreetMap' || !Array.isArray(payload.elements) || !Number.isFinite(Date.parse(payload.osmTimestamp))) throw new Error('La respuesta de OpenStreetMap no es válida.');
        const places = normalizePayload(payload);
        if (!places.length) throw new Error('No hay lugares válidos; se conserva el extracto anterior.');
        // Never replace a newer stored extract with an older server response.
        const older = (payload.dataUpdatedAt || '') < (cached.dataUpdatedAt || '') || payload.osmTimestamp < cached.osmTimestamp || (payload.osmTimestamp === cached.osmTimestamp && (payload.verificationUpdatedOn || '') < (cached.verificationUpdatedOn || ''));
        memoryCache = older ? { ...cached, savedAt: Date.now() } : { savedAt: Date.now(), revision: payload.revision, osmTimestamp: payload.osmTimestamp, dataUpdatedAt: payload.dataUpdatedAt, verificationUpdatedOn: payload.verificationUpdatedOn, places };
        retryAfter = 0;
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache)); } catch { /* Storage is optional. */ }
        return memoryCache.places;
      })
      .catch(() => {
        retryAfter = Math.max(retryAfter, Date.now() + 30_000);
        return cached.places;
      })
      .finally(() => { clearTimeout(timeout); requestInFlight = null; });
  }
  return requestInFlight;
}
