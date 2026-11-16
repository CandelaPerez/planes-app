import PlacePhotoCredit from './PlacePhotoCredit';
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
  const [budget, setBudget] = useState('Todos');
  const [sortBy, setSortBy] = useState('alpha');
  const [pagination, setPagination] = useState({ key: '', count: 24 });
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    let active = true;
    loadBaDataPreview().then((result) => { if (active) setData(result); }).catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, []);
  const catalog = useMemo(() => data?.plans || [], [data]);
  const { visibleIdeas, zones } = usePlanFilters({ catalog, search, category, zone, budget, sortBy, ratings: NO_RATINGS, planPhotos: NO_PHOTOS });
  const key = [category, search, zone, budget, sortBy].join('|');
  const count = pagination.key === key ? pagination.count : 24;
  return <div className="app-container">
    <header className="navbar"><button type="button" className="nav-brand" onClick={() => window.location.assign('/')}><span className="brand-badge">PH</span><h1>Por Hacer</h1></button><nav><a className="btn btn-secondary" href="/">Volver al catálogo original</a></nav></header>
    <main className="main-content">
      <div className="preview-banner" role="status"><strong>Vista previa BA Data</strong><span>Solo lectura. Tus 129 planes originales y tus datos de Firebase siguen intactos.</span></div>
      <div className="section-header"><h2>Descubrir planes · BA Data</h2><p>{data ? `${catalog.length.toLocaleString('es-AR')} planes con fotografía real verificada.` : 'Cargando la copia local de los recursos oficiales…'}</p></div>
      {error && <div className="app-alert error" role="alert">{error} Podés volver al catálogo original.</div>}
      {data && <>
        <div className="preview-banner"><strong>Fechas de los archivos, no de cada establecimiento</strong><span>{data.sources.map((source) => `${source.category}: ${date(source.resourceLastModified)}`).join(' · ')}. La fecha de descarga no acredita que el lugar siga abierto. Viajes contiene paradas del bus turístico; no ubicaciones de cada atractivo cercano.</span></div>
        <div className="category-filter" role="group" aria-label="Filtrar por categoría">{CATEGORIES.filter((item) => item === 'Todas' || catalog.some((plan) => plan.category === item)).map((item) => <button key={item} type="button" className={`category-filter-btn ${category === item ? 'active' : ''}`} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="filter-bar discovery-filters">
          <input aria-label="Buscar por nombre o ubicación" type="search" placeholder="Buscar lugar o barrio…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Filtrar por zona" value={zone} onChange={(event) => setZone(event.target.value)}><option value="Todas">Todas las zonas</option>{zones.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>
          <select aria-label="Filtrar por presupuesto" value={budget} onChange={(event) => setBudget(event.target.value)}><option value="Todos">Todos los presupuestos</option><option value="Sin información">Sin información</option><option value="Bajo">Bajo</option><option value="Medio">Medio</option><option value="Alto">Alto</option></select>
          <select aria-label="Ordenar planes" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="alpha">Alfabéticamente</option><option value="recommended">Recomendados</option></select>
        </div>
        <p className="photo-credit" role="status">{visibleIdeas.length.toLocaleString('es-AR')} resultados. Fuente: BA Data, Gobierno de la Ciudad de Buenos Aires · <a href="https://creativecommons.org/licenses/by/2.5/ar/" target="_blank" rel="noreferrer">CC BY 2.5 AR</a>.</p>
        {!visibleIdeas.length ? <div className="empty-state"><h3>No hay resultados para estos filtros</h3><p>Los recursos no publican presupuestos. No se asignaron precios estimados.</p></div> : <div className="cards-grid">{visibleIdeas.slice(0, count).map((place) => <article className="plan-card" key={place.id}>
          <div className="card-img-wrapper"><img className="card-img" src={place.image} alt={place.originalName || place.title} loading="lazy" onError={() => { setData((previous) => ({ ...previous, plans: previous.plans.filter((plan) => plan.id !== place.id) })); setError("No se pudo cargar una fotografía; se excluyó el plan afectado."); }} /></div>
          <div className="card-content"><div className="card-meta"><span className={`badge badge-${categoryClass(place.category)}`}>{place.category}</span><span className="budget-badge">{priceLabel(place.budget)}</span></div>
            <h3 className="card-title">{place.title}</h3>{place.subtype && <p className="card-desc">{place.subtype}</p>}
            <span className="photo-credit"><PlacePhotoCredit plan={place} /></span>
            <div className="card-info-row"><span>⌖ {place.address || `${place.lat}, ${place.lon}`}</span></div>
            <p className="photo-credit">Archivo: {date(place.sourceUpdatedAt)} · Descarga: {date(place.fetchedAt)}</p>
            <div className="card-footer plan-card-actions"><button type="button" className="btn btn-secondary" onClick={() => setSelected(place)}>Ver detalles</button><a className="btn btn-primary" href={place.sourceUrl} target="_blank" rel="noreferrer">Fuente oficial</a></div>
          </div>
        </article>)}</div>}
        {visibleIdeas.length > count && <div className="discovery-show-more"><button type="button" className="btn btn-secondary" onClick={() => setPagination({ key, count: count + 24 })}>Ver más</button></div>}
      </>}
    </main>
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
