import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { PILOT } from './ba-data/pilot-places.js';

const reviewedDirectory = globalThis.process.argv.find((arg) => arg.startsWith('--from-reviewed-dir='))?.slice(20);
const root = new URL('../', import.meta.url);
const plain = (value = '') => value.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
const request = async (url) => {
  const response = await fetch(url, { headers: { 'User-Agent': 'PorHacerAcademicPilot/1.0 (12 manually reviewed places)' }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}; refresh stopped, no automatic retries`);
  return response;
};

try {
  const catalog = JSON.parse(await readFile(new URL('public/data/ba-data.json', root), 'utf8'));
  const files = [...new Set(PILOT.flatMap((entry) => entry.file ? [entry.file] : []))];
  const params = new URLSearchParams({ action: 'query', titles: files.join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata|user|timestamp|size', iiurlwidth: '960', format: 'json' });
  const endpoint = `https://commons.wikimedia.org/w/api.php?${params}`;
  const response = reviewedDirectory ? JSON.parse(await readFile(join(reviewedDirectory, 'selected.json'), 'utf8')) : await (await request(endpoint)).json();
  if (response.error || !response.query?.pages) throw new Error('Invalid Commons response');
  const pages = Object.values(response.query.pages);
  const entries = [], assets = [];
  for (const [index, spec] of PILOT.entries()) {
    const place = catalog.places.find((item) => item.id === spec.id);
    if (!place) throw new Error(`Missing approved BA Data record: ${spec.id}`);
    const entry = { id: place.id, originalName: place.title, title: spec.title, category: place.category, address: place.address, status: 'no-verified-photo', reason: spec.reason || '', order: index };
    const kind = { 'Gastronomía': 'Conocé este establecimiento gastronómico', Cultura: 'Descubrí este museo', 'Aire Libre': 'Disfrutá un paseo por este espacio verde', Viajes: 'Ubicá esta parada del bus turístico' }[place.category];
    entry.description = `${kind}${place.barrio ? ` en ${place.barrio}` : ' en Buenos Aires'}.`;
    if (spec.file) {
      const page = pages.find((item) => item.title === spec.file), info = page?.imageinfo?.[0], meta = info?.extmetadata;
      const license = meta?.LicenseShortName?.value;
      if (!info || !/^(CC BY-SA (2.0|3.0|4.0)|Public domain)$/.test(license || '') || meta.Restrictions?.value) throw new Error(`Unapproved license/restrictions: ${spec.file}`);
      const licenseUrl = license === 'Public domain' ? 'https://creativecommons.org/publicdomain/mark/1.0/' : meta.LicenseUrl?.value?.replace(/^http:/, 'https:');
      if (!licenseUrl?.startsWith('https://creativecommons.org/')) throw new Error('License URL missing');
      const url = new URL(info.thumburl || info.url); url.search = '';
      if (!['thumb.wikimedia.org', 'upload.wikimedia.org'].includes(url.hostname) || url.protocol !== 'https:') throw new Error('Unexpected image host');
      const candidateIndex = pages.indexOf(page);
      let bytes;
      if (reviewedDirectory) bytes = await readFile(join(reviewedDirectory, `photo-${candidateIndex}.jpg`));
      else {
        const image = await request(url);
        if (!image.headers.get('content-type')?.startsWith('image/jpeg')) throw new Error('Expected JPEG photograph');
        bytes = new Uint8Array(await image.arrayBuffer());
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      if (sha256 !== spec.reviewedSha256) throw new Error(`${spec.file}: image changed; manual visual review required`);
      const localPath = `/images/ba-data-pilot/${place.id}.jpg`;
      assets.push({ path: new URL(`public${localPath}`, root), bytes });
      entry.status = 'verified-photo';
      entry.photo = { localPath, url: url.href, originalUrl: info.url, sourceUrl: info.descriptionurl, commonsTitle: page.title, author: plain(meta.Artist?.value), authorMetadata: meta.Artist?.value || '', uploader: info.user, license, licenseUrl, photoDate: plain(meta.DateTimeOriginal?.value), description: plain(meta.ImageDescription?.value), verifiedAt: new Date().toISOString(), evidence: spec.evidence, sha256, bytes: bytes.length, presentation: 'Encuadre adaptado a la tarjeta mediante CSS; archivo sin editar.' };
    }
    entries.push(entry);
  }
  if (entries.length !== 12) throw new Error('Pilot must contain exactly twelve records');
  await mkdir(new URL('public/images/ba-data-pilot/', root), { recursive: true });
  for (const asset of assets) await writeFile(asset.path, asset.bytes);
  const temporary = new URL('src/data/baDataPilot.json.tmp', root);
  await writeFile(temporary, JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), endpoint, entries }, null, 2));
  await rename(temporary, new URL('src/data/baDataPilot.json', root));
  console.log(JSON.stringify({ pilot: entries.length, verifiedPhotos: assets.length, illustrations: entries.length - assets.length, bytes: assets.reduce((sum, asset) => sum + asset.bytes.length, 0), catalogChanged: false }));
} catch (error) {
  console.error(`Photo pilot refresh stopped; previous manifest preserved: ${error.message}`);
  globalThis.process.exitCode = 1;
}
