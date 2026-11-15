import { verifiedSnapshot as snapshot } from '../data/verifiedPlaces.js';

// The snapshot is a persistent cache included in the build and every cold start.
// Only scripts/refresh-osm.js queries external services; visits never do.
export default function placesHandler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }
  if (String(req.url || '').includes('?')) {
    res.statusCode = 400;
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'query_parameters_not_supported' }));
    return;
  }
  res.statusCode = 200;
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.end(JSON.stringify(snapshot));
}
