const endpoint = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving';
let pending = Promise.resolve();

export function requestWalkingRoute(origin, destination, signal) {
  async function request() {
    signal.throwIfAborted();
    const release = new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const points = [origin, destination].map(([lat, lon]) => `${lon},${lat}`).join(';');
      const response = await fetch(`${endpoint}/${points}?overview=full&geometries=geojson&generate_hints=false`, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
        cache: 'no-store',
      });
      if (response.status === 429) throw new Error('Route rate limit exceeded');
      const result = await response.json();
      if (result.code === 'NoRoute' || result.code === 'NoSegment') return null;
      const geometry = result.routes?.[0]?.geometry;
      if (!response.ok || result.code !== 'Ok' || geometry?.type !== 'LineString'
        || !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2
        || !geometry.coordinates.every(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat))) {
        throw new Error('Invalid route response');
      }
      return geometry;
    } finally {
      await release;
    }
  }

  // Share the interval across tabs on this origin when Web Locks is available.
  if (navigator.locks) return navigator.locks.request('porhacer-fossgis-routing', { signal }, request);
  const result = pending.then(request);
  pending = result.catch(() => {});
  return result;
}
