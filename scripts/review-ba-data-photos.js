import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const state = JSON.parse(await readFile(new URL('data/photo-batches/progress.json', root), 'utf8'));
const reviews = JSON.parse(await readFile(new URL('data/photo-batches/reviews.json', root), 'utf8'));
const publishing = globalThis.process.argv.includes('--publish');
const catalog = JSON.parse(await readFile(new URL('public/data/ba-data.json', root), 'utf8'));
const output = new URL('src/data/baDataPhotos.json', root);
const candidatesDirectory = new URL('.browser-check/photo-batch/', root);
await mkdir(candidatesDirectory, { recursive:true });
const licenseAllowed = (candidate) => /^(CC BY(?:-SA)? (?:2\.0|2\.5(?: ar)?|3\.0|4\.0)|CC0|Public domain)$/.test(candidate.license) && !candidate.restrictions && candidate.mime === 'image/jpeg';
try {
  let manifest;
  try { manifest = JSON.parse(await readFile(output, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; manifest = {version:1,entries:[]}; }
  for (const review of reviews) {
    const record = state.records[review.id];
    if (!record) throw new Error(`Record not processed: ${review.id}`);
    const place = catalog.places.find((item) => item.id === record.id);
    const fingerprint = place && createHash('sha256').update(JSON.stringify([place.id, place.title, place.address, place.lat, place.lon])).digest('hex');
    if (fingerprint !== record.fingerprint || place.category !== record.category) throw new Error(`${review.id}: BA Data changed; review again`);
    const candidate = state.searches[record.searchKey].candidates.find((candidate) => candidate.file === review.file);
    if (!candidate || !licenseAllowed(candidate)) throw new Error(`Candidate or reusable JPEG license not approved: ${review.id}`);
    const url = new URL(candidate.url); url.search = '';
    if (url.protocol !== 'https:' || !['thumb.wikimedia.org','upload.wikimedia.org'].includes(url.hostname)) throw new Error('Unexpected photograph host');
    const licenseUrl = candidate.license === 'Public domain' ? 'https://creativecommons.org/publicdomain/mark/1.0/' : candidate.license === 'CC0' ? 'https://creativecommons.org/publicdomain/zero/1.0/' : candidate.licenseUrl.replace(/^http:/,'https:');
    if (!licenseUrl.startsWith('https://creativecommons.org/')) throw new Error('Missing license link');
    const localCandidate = new URL(`${review.id}.jpg`, candidatesDirectory);
    let bytes;
    try { bytes = await readFile(localCandidate); } catch (error) {
      if (error.code !== 'ENOENT' || publishing) throw error;
      const response = await fetch(url, {headers:{'User-Agent':'PorHacerAcademicPhotoBatch/1.0 (operator-assisted academic project)'},signal:AbortSignal.timeout(20000)});
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/jpeg')) throw new Error(`Photograph download failed: HTTP ${response.status}`, { cause: error });
      const chunks = []; let total = 0;
      for await (const chunk of response.body) { total += chunk.length; if (total > 1200000) throw new Error('Image exceeds 1.2 MB limit', { cause: error }); chunks.push(chunk); }
      bytes = new Uint8Array(total); let offset=0; for (const chunk of chunks) { bytes.set(chunk,offset); offset+=chunk.length; }
      await writeFile(localCandidate,bytes);
      await new Promise((resolve) => setTimeout(resolve,1500));
    }
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (publishing) {
      if (!review.evidence || review.approvedSha256 !== sha256) throw new Error(`${review.id}: visual approval/evidence required`);
      const localPath = `/images/ba-data-batches/${review.id}.jpg`;
      await mkdir(new URL('public/images/ba-data-batches/',root),{recursive:true});
      await writeFile(new URL(`public${localPath}`,root),bytes);
      const photo = {localPath,url:url.href,originalUrl:candidate.originalUrl,sourceUrl:candidate.sourceUrl,commonsTitle:candidate.file,author:candidate.author,authorMetadata:candidate.authorMetadata,uploader:candidate.uploader,license:candidate.license,licenseUrl,photoDate:candidate.photoDate,description:candidate.description,verifiedAt:new Date().toISOString(),evidence:review.evidence,sha256,bytes:bytes.length,presentation:'Encuadre adaptado a la tarjeta mediante CSS; archivo sin editar.',gps:candidate.gps};
      const entry = {id:record.id,originalName:record.originalName,address:record.address,category:record.category,lat:record.lat,lon:record.lon,fingerprint:record.fingerprint,photo};
      manifest.entries = manifest.entries.filter((item) => item.id !== record.id).concat(entry);
    }
    console.log(JSON.stringify({id:review.id,mode:publishing?'published':'prepared-for-visual-review',file:review.file,bytes:bytes.length,sha256}));
  }
  if (publishing) {
    manifest.generatedAt = new Date().toISOString();
    const temporary = new URL('src/data/baDataPhotos.json.tmp',root);
    await writeFile(temporary,JSON.stringify(manifest,null,2)); await rename(temporary,output);
    for (const review of reviews) state.records[review.id] = { ...state.records[review.id], status: 'verified-photo', reviewedAt: manifest.generatedAt };
    const checkpoint = new URL('data/photo-batches/progress.json.tmp', root);
    await writeFile(checkpoint, JSON.stringify(state, null, 2));
    await rename(checkpoint, new URL('data/photo-batches/progress.json', root));
    console.log(JSON.stringify({verifiedAdditional:manifest.entries.length}));
  }
} catch (error) { console.error(`Photo review stopped; previous published manifest retained: ${error.message}`);globalThis.process.exitCode=1; }
