import { validPlace } from '../server/osm.js';

export const PROBE_QUERY = '[out:json][timeout:10];nwr["tourism"="museum"]["name"](-34.62,-58.40,-34.59,-58.37);out center tags 12;';
export const CATALOG_QUERY = '[out:json][timeout:10];nwr["tourism"="museum"]["name"](-34.705,-58.531,-34.526,-58.335);out center tags 120;';
export const DEFAULT_ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

export function validMuseum(element) {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  return ['node', 'way', 'relation'].includes(element.type)
    && Number.isSafeInteger(element.id) && element.id > 0
    && typeof element.tags?.name === 'string' && element.tags.name.trim()
    && element.tags.tourism === 'museum'
    && Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -34.705 && lat <= -34.526 && lon >= -58.531 && lon <= -58.335;
}

// One request per independent provider, sequentially. No repeated polling.
export async function queryOverpass({ query = CATALOG_QUERY, endpoints = DEFAULT_ENDPOINTS, timeoutMs = 12_000, fetchImpl = globalThis.fetch, validate = validMuseum } = {}) {
  const attempts = [];
  const providers = endpoints.map((endpoint) => {
    const url = new URL(endpoint);
    if (url.hostname === 'overpass.kumi.systems') url.hostname = 'overpass.private.coffee';
    return url.href;
  });
  for (const endpoint of [...new Set(providers)].slice(0, 3)) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let httpStatus;
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'PorHacer/1.0 (manual CABA museum snapshot update)' },
        body: new URLSearchParams({ data: query }),
        signal: controller.signal,
      });
      httpStatus = response.status;
      if (!response.ok) {
        attempts.push({ endpoint, kind: 'http', httpStatus, retryAfter: response.headers?.get('retry-after') || null });
        continue;
      }
      const payload = await response.json();
      if (!payload || payload.remark || !Array.isArray(payload.elements) || !payload.elements.length || !payload.elements.every((element) => validPlace(element) && validate(element))) {
        attempts.push({ endpoint, kind: 'invalid_payload', httpStatus, message: payload?.remark || 'Empty or invalid CABA museum results' });
        continue;
      }
      attempts.push({ endpoint, kind: 'success', httpStatus, count: payload.elements.length });
      return { payload, endpoint, attempts };
    } catch (error) {
      const kind = controller.signal.aborted ? 'timeout' : error instanceof SyntaxError ? 'invalid_payload' : 'network';
      attempts.push({ endpoint, kind, ...(httpStatus ? { httpStatus } : {}), code: error.cause?.code || error.code || null, message: error.message });
    } finally {
      clearTimeout(timeout);
    }
  }
  const error = new Error('No provider returned a complete museum result. Existing snapshot was preserved.');
  error.attempts = attempts;
  throw error;
}
