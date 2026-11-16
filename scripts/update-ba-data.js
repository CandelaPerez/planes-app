import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { SOURCES } from './ba-data/sources.js';
import { normalizeResource, deduplicate } from './ba-data/normalize.js';

const inputDirectory = globalThis.process.argv.find((arg) => arg.startsWith('--from-dir='))?.slice(11);
const output = new URL('../public/data/ba-data.json', import.meta.url);
const loaded = [], manifest = [], diagnostics = [];
try {
  for (const source of SOURCES) {
    let text, downloadedAt, lastModified = null, metadataModified = null, resourceMetadataModified = null, ckanLastModified = null;
    let resourceUrl = source.url;
    if (inputDirectory) {
      const path = join(inputDirectory, source.file);
      text = await readFile(path, 'utf8'); downloadedAt = (await stat(path)).mtime.toISOString();
      try {
        const headers = JSON.parse(await readFile(`${path}.meta.json`, 'utf8'));
        if (headers.sourceUrl === source.url && headers.sha256 === createHash('sha256').update(text).digest('hex')) lastModified = headers.lastModified;
      } catch { /* A local file without matching verified headers has no known modification date. */ }
    } else {
      try {
        const url = `https://data.buenosaires.gob.ar/api/3/action/package_show?id=${encodeURIComponent(source.slug)}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        const body = await response.text();
        if (!response.ok || /^\s*</.test(body)) throw new Error(`HTTP ${response.status}: non-CKAN response`);
        const meta = JSON.parse(body);
        if (!meta.success || !meta.result?.resources) throw new Error('CKAN success/result missing');
        metadataModified = meta.result.metadata_modified || null;
        const resource = meta.result.resources.find((item) => item.id === source.resourceId);
        if (!resource) throw new Error('Expected CKAN resource missing');
        if (new URL(resource.url).hostname !== 'cdn.buenosaires.gob.ar' || new URL(resource.url).protocol !== 'https:') throw new Error('Unexpected resource host');
        resourceUrl = resource.url;
        resourceMetadataModified = resource.metadata_modified || null;
        ckanLastModified = resource.last_modified || null;
        diagnostics.push({ source: source.key, endpoint: 'package_show', status: 'metadata-readable', metadataModified: meta.result.metadata_modified });
      } catch (error) {
        diagnostics.push({ source: source.key, endpoint: 'package_show', status: 'unavailable', message: error.message });
        try {
          const response = await fetch(`https://data.buenosaires.gob.ar/api/3/action/resource_show?id=${encodeURIComponent(source.resourceId)}`, { signal: AbortSignal.timeout(15_000) });
          const body = await response.text();
          if (!response.ok || /^\s*</.test(body)) throw new Error(`HTTP ${response.status}: non-CKAN response`, { cause: error });
          const meta = JSON.parse(body), resource = meta.result;
          if (!meta.success || resource?.id !== source.resourceId || new URL(resource.url).hostname !== 'cdn.buenosaires.gob.ar' || new URL(resource.url).protocol !== 'https:') throw new Error('Invalid CKAN resource', { cause: error });
          resourceUrl = resource.url;
          resourceMetadataModified = resource.metadata_modified || null;
          ckanLastModified = resource.last_modified || null;
          diagnostics.push({ source: source.key, endpoint: 'resource_show', status: 'metadata-readable' });
        } catch (resourceError) { diagnostics.push({ source: source.key, endpoint: 'resource_show', status: 'unavailable', message: resourceError.message }); }
      }
      const response = await fetch(resourceUrl, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`${source.key}: HTTP ${response.status}`);
      if (Number(response.headers.get('content-length')) > 25_000_000) throw new Error('Source too large for this importer.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
      catch { text = new TextDecoder('windows-1252').decode(bytes); }
      downloadedAt = new Date().toISOString();
      if (text.length > 25_000_000 || /^\s*</.test(text)) throw new Error(`${source.key}: invalid/HTML resource`);
      const header = response.headers.get('last-modified');
      lastModified = header && Number.isFinite(Date.parse(header)) ? new Date(header).toISOString() : null;
    }
    const result = normalizeResource(text, source);
    if (!result.places.length) throw new Error(`${source.key}: no usable records; last valid cache preserved`);
    loaded.push({ ...result, key: source.key, category: source.category });
    const metadata = Object.fromEntries(Object.entries(source).filter(([key]) => !['observedLastModified', 'file'].includes(key)));
    manifest.push({ ...metadata, url: resourceUrl, downloadedAt, resourceLastModified: lastModified, metadataModified, resourceMetadataModified, ckanLastModified, sha256: createHash('sha256').update(text).digest('hex'), bytes: new TextEncoder().encode(text).byteLength });
  }
  const { places, statistics } = deduplicate(loaded);
  const cache = { version: 1, generatedAt: new Date().toISOString(), source: 'BA Data — Gobierno de la Ciudad de Buenos Aires', sources: manifest, statistics, diagnostics, places };
  await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
  const temporary = new URL('../public/data/ba-data.json.tmp', import.meta.url);
  await writeFile(temporary, JSON.stringify(cache), 'utf8');
  await rename(temporary, output);
  console.log(JSON.stringify({ total: places.length, statistics, output: 'public/data/ba-data.json', originalCatalogChanged: false }, null, 2));
} catch (error) {
  console.error(`BA Data update failed; existing cache preserved: ${error.message}`);
  globalThis.process.exitCode = 1;
}
