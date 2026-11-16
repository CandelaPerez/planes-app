export const canonical = (value) => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const hasName = (value) => canonical(value) && !['sin nombre', 'sin denominacion', 's n', 's d', 'null'].includes(canonical(value));
const inCabaBounds = ([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat) && lon >= -58.54 && lon <= -58.33 && lat >= -34.71 && lat <= -34.52;
const clean = (value) => String(value ?? '').trim();

export function parseCsv(text) {
  if (/^\s*</.test(text)) throw new Error('HTML received instead of CSV.');
  const rows = []; let row = [], value = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  const delimiter = text.slice(0, text.indexOf('\n')).includes(';') ? ';' : ',';
  for (let i = 0; i < text.length; i += 1) {
    const character = text[i];
    if (character === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i += 1; } else quoted = !quoted;
    } else if (character === delimiter && !quoted) { row.push(value); value = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[i + 1] === '\n') i += 1;
      row.push(value); if (row.some((cell) => cell.trim())) rows.push(row);
      row = []; value = '';
    } else value += character;
  }
  if (quoted) throw new Error('Incomplete quoted CSV field.');
  if (value || row.length) { row.push(value); rows.push(row); }
  const headers = rows.shift()?.map(clean);
  if (!headers?.length || !rows.length) throw new Error('Empty CSV.');
  return rows.map((values) => {
    if (values.length !== headers.length) throw new Error('CSV row has an unexpected number of columns.');
    return Object.fromEntries(headers.flatMap((header, index) => header ? [[header, values[index]]] : []));
  });
}

export function normalizeResource(text, source) {
  let records;
  if (source.format === 'geojson') {
    const collection = JSON.parse(text);
    if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) throw new Error('Invalid GeoJSON.');
    if (collection.crs && !/CRS84|4326/.test(JSON.stringify(collection.crs))) throw new Error('Unsupported coordinate reference system.');
    records = collection.features;
  } else records = parseCsv(text);
  const places = [];
  for (const record of records) {
    const r = source.key === 'green' ? record.properties : record;
    const title = clean(r?.nombre || r?.ESTABLECIMIENTO);
    if (!hasName(title)) continue;
    if (source.key === 'green' && (['CANTERO CENTRAL', 'BARRIO/COMPLEJO'].includes(r.clasificac) || ['plaza', 'plazoleta', 'parque', 'jardin'].includes(canonical(title)))) continue;
    const wkt = /POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/i.exec(r.geometry || '');
    // A vertex belongs to the published park boundary; it is not an invented
    // centroid or a claimed entrance. Preserve that distinction in the record.
    const boundary = source.key === 'green' ? record.geometry?.coordinates?.flat(Infinity).slice(0, 2) : null;
    const lon = Number(String(boundary?.[0] ?? r.long ?? r.LONGITUD ?? wkt?.[1]).replace(',', '.'));
    const lat = Number(String(boundary?.[1] ?? r.lat ?? r.LATITUD ?? wkt?.[2]).replace(',', '.'));
    const recordId = clean(r.id ?? r.fid ?? r.id_ev_pub);
    if (!recordId || !inCabaBounds([lon, lat])) continue;
    const address = clean(r.direccion_completa || r.DIRECCION || r.direccion || r.ubicacion);
    places.push({
      id: `badata-${source.key}-${recordId}`, title, category: source.category, address, lat, lon,
      barrio: clean(r.barrio || r.BARRIO), subtype: clean(r.categoria || r.FUNCION_PRINCIPAL || r.clasificac || (source.key === 'bus' ? 'Parada del bus turístico' : '')),
      ...(r.horario ? { openingHours: clean(r.horario) } : {}),
      ...(r.WEB ? { website: clean(r.WEB) } : {}),
      coordinateMethod: source.key === 'green' ? 'published-boundary-vertex' : 'published-point',
      sources: [{ key: source.key, recordId }],
    });
  }
  return { places, raw: records.length, eligible: places.length, discarded: records.length - places.length };
}

export function deduplicate(resources) {
  const places = [], keys = new Map();
  const statistics = [];
  for (const resource of resources) {
    let added = 0;
    for (const place of resource.places) {
      const name = canonical(place.title);
      const geo = `geo:${name}|${place.lat.toFixed(4)}|${place.lon.toFixed(4)}`;
      const address = canonical(place.address).replace(/ caba$/, '');
      const addressKey = address ? `address:${name}|${address}` : null;
      const match = keys.get(geo) ?? (addressKey ? keys.get(addressKey) : undefined);
      if (match !== undefined) places[match].sources.push(...place.sources);
      else { places.push(place); added += 1; }
      const index = match ?? places.length - 1;
      keys.set(geo, index); if (addressKey) keys.set(addressKey, index);
    }
    statistics.push({ key: resource.key, category: resource.category, raw: resource.raw, eligible: resource.eligible, discarded: resource.discarded, unique: added, duplicates: resource.eligible - added });
  }
  return { places, statistics };
}
