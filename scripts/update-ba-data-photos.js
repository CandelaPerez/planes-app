import { readFile, writeFile, mkdir, rename, open, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { variedBaDataOrder } from '../src/utils/baDataPresentation.js';

const root = new URL('../', import.meta.url);
const directory = new URL('data/photo-batches/', root);
const path = new URL('progress.json', directory), lockPath = new URL('progress.lock', directory);
const limit = Number(globalThis.process.argv.find((arg) => arg.startsWith('--limit='))?.slice(8) || 5);
const fingerprint = (place) => createHash('sha256').update(JSON.stringify([place.id, place.title, place.address, place.lat, place.lon])).digest('hex');
const plain = (value = '') => value.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
const priority = ['food-2554','food-2567','food-2231','food-1780','food-2340','food-2379','food-947','culture-2989','culture-2675','culture-2717','culture-2578','culture-1379','culture-1985','culture-2467','green-880','green-1106','green-610','green-872','green-873','green-874','green-882','green-906'];
let lock;
const persist = async (progress) => {
  await writeFile(new URL('progress.json.tmp', directory), JSON.stringify(progress, null, 2));
  await rename(new URL('progress.json.tmp', directory), path);
};
try {
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) throw new Error('--limit must be between 1 and 10');
  await mkdir(directory, { recursive: true });
  lock = await open(lockPath, 'wx');
  await lock.writeFile(JSON.stringify({ pid: globalThis.process.pid, startedAt: new Date().toISOString() }));
  const catalog = JSON.parse(await readFile(new URL('public/data/ba-data.json', root), 'utf8'));
  const pilot = JSON.parse(await readFile(new URL('src/data/baDataPilot.json', root), 'utf8'));
  let progress;
  try { progress = JSON.parse(await readFile(path, 'utf8')); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const excluded = new Set(pilot.entries.map((entry) => entry.id));
    const byId = new Map(catalog.places.map((place) => [place.id, place]));
    const alphabetical = [...catalog.places].sort((a,b) => a.title.localeCompare(b.title, 'es'));
    const recommended = variedBaDataOrder(alphabetical.map((place) => ({ ...place, sourceName: 'BA Data' })));
    const ordered = [...priority.map((id) => byId.get(`badata-${id}`)).filter(Boolean), ...recommended];
    const seen = new Set(excluded);
    const queue = ordered.filter((place) => !seen.has(place.id) && seen.add(place.id)).slice(0,100).map((place) => ({ id: place.id, originalName: place.title, address: place.address, category: place.category, lat: place.lat, lon: place.lon, fingerprint: fingerprint(place) }));
    progress = { version: 1, batch: 1, cap: 100, createdAt: new Date().toISOString(), queue, records: {}, searches: {}, lastRequestAt: 0 };
    await persist(progress);
  }
  if (progress.version !== 1 || progress.queue.length !== 100 || progress.cap !== 100) throw new Error('Invalid batch checkpoint');
  const byId = new Map(catalog.places.map((place) => [place.id, place]));
  const pending = progress.queue.filter((place) => !progress.records[place.id]);
  let queried = 0;
  for (const item of pending.slice(0,limit)) {
    const place = byId.get(item.id);
    if (!place || fingerprint(place) !== item.fingerprint) throw new Error(`${item.id}: source changed; review checkpoint before resuming`);
    const name = place.title.replace(/^\d+\.\s*/, '').replaceAll('"', ' ').trim();
    const query = place.category === 'Viajes' ? `"bus turístico" "${name}" "Buenos Aires"` : `"${name}" "Buenos Aires"`;
    const searchKey = createHash('sha256').update(query.toLocaleLowerCase('es')).digest('hex');
    let result = progress.searches[searchKey];
    if (!result) {
      const wait = Math.max(0, 6000 - (Date.now() - progress.lastRequestAt), (progress.notBefore || 0) - Date.now());
      if (wait > 60000) throw new Error(`Provider cooldown active until ${new Date(progress.notBefore).toISOString()}; resume later`);
      await new Promise((resolve) => setTimeout(resolve, wait));
      const params = new URLSearchParams({ action:'query', generator:'search', gsrsearch:query, gsrnamespace:'6', gsrlimit:'3', prop:'imageinfo', iiprop:'url|extmetadata|user|size|mime', iiurlwidth:'960', format:'json', maxlag:'5' });
      const endpoint = `https://commons.wikimedia.org/w/api.php?${params}`;
      progress.lastRequestAt = Date.now(); await persist(progress);
      const response = await fetch(endpoint, { headers: { 'User-Agent': globalThis.process.env.WIKIMEDIA_USER_AGENT || 'PorHacerAcademicPhotoBatch/1.0 (operator-assisted academic project)' }, signal: AbortSignal.timeout(20000) });
      if (!response.ok) {
        const retry = response.headers.get('retry-after');
        const retryTime = retry && /^\d+$/.test(retry) ? Date.now() + Number(retry) * 1000 : Date.parse(retry || '');
        progress.notBefore = Number.isFinite(retryTime) ? retryTime : Date.now() + 60000;
        progress.lastError = { status: response.status, retryAfter: retry, at:new Date().toISOString() };
        await persist(progress);
        throw new Error(`HTTP ${response.status}; stopped without automatic retries; Retry-After=${retry || 'not provided'}`);
      }
      const body = await response.json();
      if (body.error || body.warnings || (!body.query && body.batchcomplete === undefined)) throw new Error(`Commons: ${JSON.stringify(body.error || body.warnings || body)}`);
      const candidates = Object.values(body.query?.pages || {}).flatMap((page) => {
        const info = page.imageinfo?.[0], meta = info?.extmetadata;
        if (!info || !meta) return [];
        return [{ file:page.title, pageId:page.pageid, url:info.thumburl || info.url, originalUrl:info.url, sourceUrl:info.descriptionurl, author:plain(meta.Artist?.value), authorMetadata:meta.Artist?.value || '', uploader:info.user, license:meta.LicenseShortName?.value || '', licenseUrl:meta.LicenseUrl?.value || '', restrictions:plain(meta.Restrictions?.value), photoDate:plain(meta.DateTimeOriginal?.value), description:plain(meta.ImageDescription?.value), categories:meta.Categories?.value || '', gps:meta.GPSLatitude && meta.GPSLongitude ? {lat:Number(meta.GPSLatitude.value),lon:Number(meta.GPSLongitude.value)} : null, mime:info.mime, originalBytes:info.size }];
      });
      result = { endpoint, query, checkedAt:new Date().toISOString(), candidates };
      progress.searches[searchKey] = result; queried += 1;
    }
    progress.records[item.id] = { ...item, searchKey, status: result.candidates.length ? 'awaiting-review' : 'no-candidates', checkedAt: result.checkedAt };
    await persist(progress);
    console.log(JSON.stringify({ id:item.id, status:progress.records[item.id].status, processed:Object.keys(progress.records).length, cap:progress.cap }));
  }
  console.log(JSON.stringify({ batch:progress.batch, processed:Object.keys(progress.records).length, pending:progress.queue.length - Object.keys(progress.records).length, newQueries:queried, automaticallyPublished:0, stoppedAt100:pending.length <= limit }));
} catch (error) {
  console.error(`Photo batch stopped; progress retained: ${error.message}`);
  globalThis.process.exitCode = 1;
} finally {
  if (lock) { await lock.close(); await unlink(lockPath); }
}
