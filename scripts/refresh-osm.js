import { readFile, writeFile, rename } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { PROBE_QUERY, DEFAULT_ENDPOINTS, queryOverpass } from './overpass-client.js';
import { buildQuery, validPlace, elementsFromGeoJson } from '../server/osm.js';

const args = globalThis.process.argv.slice(2);
const option = (name, fallback = '') => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
const env = { ...loadEnv('development', globalThis.process.cwd(), 'OVERPASS_'), ...globalThis.process.env };
const endpoints = [env.OVERPASS_API_URL, env.OVERPASS_FALLBACK_URL, ...DEFAULT_ENDPOINTS].filter(Boolean);
const target = new URL('../data/osm-imports.json', import.meta.url);
async function persistStore(store) {
  const temporary = new URL('../data/osm-imports.json.tmp', import.meta.url);
  await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
  await rename(temporary, target);
}
try {
  const store = JSON.parse(await readFile(target, 'utf8'));
  const inputFile = option('file');
  const probe = args.includes('--probe');
  // Persist the attempt time even after failure: separate invocations cannot
  // accidentally hammer the public services. Offline import is not throttled.
  if (!inputFile && store.lastAttemptAt && Date.now() - Date.parse(store.lastAttemptAt) < 60_000) throw new Error('Wait at least 60 seconds between live updates.');
  let elements;
  let osmTimestamp;
  let datasetUrl;
  let query;
  if (inputFile) {
    const collection = JSON.parse((await readFile(inputFile, 'utf8')).replace(/^\uFEFF/, ''));
    datasetUrl = option('source-url');
    if (!/^https:\/\//.test(datasetUrl) || !/ODbL/i.test(collection.copyright || '')) throw new Error('Import requires --source-url=https://... and explicit ODbL provenance in the GeoJSON copyright.');
    osmTimestamp = collection.timestamp;
    elements = elementsFromGeoJson(collection);
  } else {
    store.lastAttemptAt = new Date().toISOString();
    await persistStore(store);
    query = probe ? PROBE_QUERY : buildQuery({ zone: option('zone', 'caba'), category: option('category', 'culture') });
    console.log(query);
    const result = await queryOverpass({ query, endpoints, validate: validPlace });
    console.log(JSON.stringify(result.attempts, null, 2));
    if (probe) {
      console.log(JSON.stringify(result.payload.elements.slice(0, 3).map(({ type, id, tags }) => ({ type, id, name: tags.name })), null, 2));
      globalThis.process.exit(0);
    }
    elements = result.payload.elements;
    osmTimestamp = result.payload.osm3s?.timestamp_osm_base;
    datasetUrl = result.endpoint;
  }
  if (!elements.length || !Number.isFinite(Date.parse(osmTimestamp))) throw new Error('No valid dated OSM records: existing data preserved.');
  const obtainedAt = new Date().toISOString();
  const acquisition = { obtainedAt, osmTimestamp, datasetUrl, method: inputFile ? 'geojson-import' : 'overpass', ...(query ? { query } : {}) };
  const byId = new Map(store.elements.map((element) => [`${element.type}/${element.id}`, element]));
  for (const element of elements) {
    const key = `${element.type}/${element.id}`;
    const previous = byId.get(key);
    if (!previous || previous.acquisition.osmTimestamp <= osmTimestamp) byId.set(key, { ...element, acquisition });
  }
  const updated = { ...store, revision: obtainedAt, batches: [...store.batches, { ...acquisition, count: elements.length }], elements: [...byId.values()] };
  await persistStore(updated);
  console.log(`Saved ${elements.length} source records, ${updated.elements.length} unique imported records. Original catalog and seed snapshot preserved. Nothing published.`);
} catch (error) {
  console.error(JSON.stringify({ message: error.message, attempts: error.attempts || [] }, null, 2));
  globalThis.process.exitCode = 1;
}
