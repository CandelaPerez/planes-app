import CreditsAndSources from './CreditsAndSources';
import { useEffect, useMemo, useState } from 'react';
import { loadBaDataPreview } from '../services/baData';
import usePlanFilters from '../hooks/usePlanFilters';
import { categoryClass, priceLabel } from '../utils/planUtils';

const CATEGORIES = ['Todas', 'Gastronomía', 'Cultura', 'Aire Libre', 'Viajes'];
const NO_RATINGS = [];
const NO_PHOTOS = {};
const date = (value) => value ? new Date(value).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'No informada';
const safeWebsite = (value) => {
  if (!value) return '';
  try { const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`); return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.') && !/\s/.test(value) ? url.href : ''; }
  catch { return ''; }
};

export default function BaDataPreview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('Todas');
  const [search, setSearch] = useState('');
  const [zone, setZone] = useState('Todas');
  const [placeType, setPlaceType] = useState('Todos');
  const [sortBy, setSortBy] = useState('');
  const [pagination, setPagination] = useState({ key: '', count: 24 });
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    let active = true;
    loadBaDataPreview().then((result) => { if (active) setData(result); }).catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, []);
  const catalog = useMemo(() => data?.plans || [], [data]);
  const { visibleIdeas, zones, placeTypes } = usePlanFilters({ catalog, search, category, zone, placeType, sortBy, ratings: NO_RATINGS, planPhotos: NO_PHOTOS });
  const key = [category, search, zone, placeType, sortBy].join('|');
  const count = pagination.key === key ? pagination.count : 24;
  const updateDiscoveryFilter = (setter, value) => { setter(value); setPagination({ key: '', count: 24 }); };
  return <div className="app-container">
    <header className="navbar"><button type="button" className="nav-brand" onClick={() => window.location.assign('/')}><span className="brand-badge">PH</span><h1>Por Hacer</h1></button><nav><a className="btn btn-secondary" href="/">Volver a Por Hacer</a></nav></header>
    <main className="main-content">
      <div className="preview-banner" role="status"><strong>Vista previa BA Data</strong><span>Solo lectura. Tus 129 planes originales y tus datos de Firebase siguen intactos.</span></div>
      <div className="section-header"><h2>Descubrir planes · BA Data</h2><p>Descubrí lugares y experiencias para disfrutar en Buenos Aires</p></div>
      {error && <div className="app-alert error" role="alert">{error} Podés volver a Por Hacer.</div>}
      {data && <>
        <div className="category-filter" role="group" aria-label="Filtrar por categoría">{CATEGORIES.map((item) => <button key={item} type="button" className={`category-filter-btn ${category === item ? 'active' : ''}`} aria-pressed={category === item} onClick={() => updateDiscoveryFilter(setCategory, item)}>{item === 'Viajes' ? 'Íconos de BA' : item}</button>)}</div>
        <div className="filter-bar discovery-filters">
          <input aria-label="Buscar por nombre o ubicación" type="search" placeholder="Buscar lugar o barrio…" value={search} onChange={(event) => updateDiscoveryFilter(setSearch, event.target.value)} />
          <select aria-label="Filtrar por zona" value={zone} onChange={(event) => updateDiscoveryFilter(setZone, event.target.value)}><option value="Todas">Todas las zonas</option>{zones.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>
          <select aria-label="Filtrar por tipo de lugar" value={placeType} onChange={(event) => updateDiscoveryFilter(setPlaceType, event.target.value)}><option value="Todos">Todos los lugares</option>{placeTypes.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>
          <select aria-label="Ordenar por" value={sortBy} onChange={(event) => updateDiscoveryFilter(setSortBy, event.target.value)}><option value="" disabled>Ordenar por</option><option value="recommended">Recomendados</option><option value="alpha">Nombre A-Z</option><option value="alpha-desc">Nombre Z-A</option></select>
        </div>
        <p className="photo-credit" role="status">{visibleIdeas.length.toLocaleString('es-AR')} resultados</p>
        {!visibleIdeas.length ? <div className="empty-state"><h3>No hay resultados para estos filtros</h3><p>Probá otro barrio, tipo de lugar o búsqueda.</p></div> : <div className="cards-grid">{visibleIdeas.slice(0, count).map((place) => <article className="plan-card" key={place.id}>
          <div className="card-img-wrapper"><img className="card-img" src={place.image} alt={place.originalName || place.title} loading="lazy" onError={() => { setData((previous) => ({ ...previous, plans: previous.plans.filter((plan) => plan.id !== place.id) })); setError("No se pudo cargar una fotografía; se excluyó el plan afectado."); }} /></div>
          <div className="card-content"><div className="card-meta"><span className={`badge badge-${categoryClass(place.category)}`}>{place.category}</span><span className="budget-badge">{priceLabel(place.budget)}</span></div>
            <h3 className="card-title">{place.title}</h3>{place.subtype && <p className="card-desc">{place.subtype}</p>}

            <div className="card-info-row"><span>⌖ {place.address || `${place.lat}, ${place.lon}`}</span></div>

            <div className="card-footer plan-card-actions"><button type="button" className="btn btn-secondary" onClick={() => setSelected(place)}>Ver detalles</button><a className="btn btn-primary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.originalName || place.title} ${place.address || place.location}`)}`} target="_blank" rel="noreferrer">Ver ubicación</a></div>
          </div>
        </article>)}</div>}
        {visibleIdeas.length > count && <div className="discovery-show-more"><button type="button" className="btn btn-secondary" onClick={() => setPagination({ key, count: count + 24 })}>Ver más</button></div>}
      </>}
    </main>
    <CreditsAndSources />
    {selected && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="modal-content plan-detail-modal" role="dialog" aria-modal="true" aria-labelledby="preview-detail-title">
      <div className="modal-header"><div><span className={`badge badge-${categoryClass(selected.category)}`}>{selected.category}</span><h2 id="preview-detail-title">{selected.title}</h2></div><button type="button" className="modal-close" aria-label="Cerrar detalles" onClick={() => setSelected(null)}>×</button></div>
      <dl className="plan-detail-facts">
        <div><dt>Dirección publicada</dt><dd>{selected.address || 'No informada; consultá las coordenadas.'}</dd></div>
        <div><dt>Coordenadas publicadas (longitud, latitud)</dt><dd>{selected.lon}, {selected.lat}{selected.coordinateMethod === 'published-boundary-vertex' && <p>Referencia del límite del espacio verde; no indica una entrada.</p>}</dd></div>
        <div><dt>Horario publicado</dt><dd>{selected.openingHours || 'No informado en el recurso.'}</dd></div>
        <div><dt>Presupuesto</dt><dd>No informado en el recurso.</dd></div>
        {selected.sourceReferences.map((source) => <div key={`${source.key}-${source.recordId}`}><dt>{source.dataset} · Registro {source.recordId}</dt><dd>{source.publisher}<br />Archivo: {date(source.resourceLastModified)} · Descarga: {date(source.downloadedAt)}<br />Ficha del portal: {date(source.metadataModified || source.resourceMetadataModified || source.portalUpdatedOn)} (no es fecha de actualización individual).<br /><a href={source.url} target="_blank" rel="noreferrer">Recurso original</a> · <a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.license}</a></dd></div>)}
      </dl>
      <div className="modal-actions">{safeWebsite(selected.website) && <a className="btn btn-secondary" href={safeWebsite(selected.website)} target="_blank" rel="noreferrer">Sitio informado por la fuente</a>}<button type="button" className="btn btn-primary" onClick={() => setSelected(null)}>Cerrar</button></div>
    </section></div>}
  </div>;
}
