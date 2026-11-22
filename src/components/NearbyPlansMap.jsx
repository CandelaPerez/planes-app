import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { divIcon, featureGroup, marker } from 'leaflet';
import { createPlanMap, destinationIcon } from '../utils/leafletMap.js';
import { rankNearbyPlans } from '../utils/nearbyPlans.js';
import { hasPlanCoordinates } from '../utils/planCoordinates.js';
import { categoryClass, visiblePlanDescription } from '../utils/planUtils';

const obeliskId = 'tourism-wikidata-q831389';
const kilometers = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
const locationIcon = divIcon({ className: 'nearby-location-marker', iconSize: [18, 18] });
const referenceIcon = divIcon({ className: 'nearby-location-marker is-reference', iconSize: [20, 20] });
const position = ({ lat, lon }) => [lat, lon];
const referenceName = (plan) => plan.id === obeliskId ? 'Obelisco de Buenos Aires' : plan.title;

function focusAndScroll(target, top) {
  if (!target) return;
  const header = target.closest('.app-container')?.querySelector('.navbar');
  const offset = (header?.getBoundingClientRect().height || 0) + 12;
  target.focus({ preventScroll: true });
  window.scrollTo({
    top: top ?? window.scrollY + target.getBoundingClientRect().top - offset,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}

function planPopup({ plan }, onDetails, onDirections) {
  const card = document.createElement('div');
  card.className = 'nearby-popup';
  const title = document.createElement('strong');
  title.textContent = plan.title;
  card.append(title);
  const category = document.createElement('p');
  category.textContent = plan.category;
  card.append(category);
  const actions = document.createElement('div');
  actions.className = 'nearby-plan-actions';
  for (const [label, onClick] of [['Ver detalles', onDetails], ['Cómo llegar', onDirections]]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-secondary';
    button.textContent = label;
    button.addEventListener('click', () => onClick(plan));
    actions.append(button);
  }
  card.append(actions);
  return card;
}

function NearbyPlanDetails({ entry, fromLabel, detailsRef, onBack }) {
  const { plan, distance } = entry;
  const [photoFailed, setPhotoFailed] = useState(false);
  const facts = [
    ['Ubicación', plan.location || plan.barrio],
    ['Dirección', plan.address !== plan.location && plan.address],
    ['Tipo de lugar', plan.subtype],
    ['Distancia en línea recta', `${kilometers.format(distance)} km desde ${fromLabel}`],
    ['Horario', plan.openingHours],
    ['Teléfono', plan.phone],
    ['Duración sugerida', plan.duration],
    ['Para tener en cuenta', plan.visitTips],
  ];

  return (
    <article className="nearby-detail" ref={detailsRef} tabIndex={-1} aria-labelledby="nearby-detail-title">
      <div className="nearby-detail-photo">
        {plan.image && !photoFailed ? (
          <img className="plan-detail-image nearby-detail-image" src={plan.image} alt={plan.title} onError={() => setPhotoFailed(true)} />
        ) : <p className="form-hint">La fotografía del lugar no está disponible.</p>}
      </div>
      <div className="nearby-detail-content">
        <span className={`badge badge-${categoryClass(plan.category)}`}>{plan.category}</span>
        <h3 id="nearby-detail-title">{plan.title}</h3>
        {plan.description && <p className="plan-detail-description">{visiblePlanDescription(plan)}</p>}
        <dl className="plan-detail-facts nearby-detail-facts">
          {facts.filter(([, value]) => value).map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
        <button type="button" className="btn btn-primary" onClick={onBack}>Volver al mapa</button>
      </div>
    </article>
  );
}

export default function NearbyPlansMap({ catalog, onDirections }) {
  const container = useRef(null);
  const detailsRef = useRef(null);
  const returnFrame = useRef(0);
  const mapRef = useRef(null);
  const locationRequest = useRef(0);
  const [userPosition, setUserPosition] = useState(null);
  const [referenceId, setReferenceId] = useState('');
  const [status, setStatus] = useState('loading');
  const [selection, setSelection] = useState(null);
  const references = useMemo(() => catalog.filter(hasPlanCoordinates)
    .sort((a, b) => referenceName(a).localeCompare(referenceName(b), 'es')), [catalog]);
  const manualReference = references.find((plan) => plan.id === referenceId)
    || references.find((plan) => plan.id === obeliskId) || references[0];
  const reference = userPosition || manualReference;
  const nearby = useMemo(() => reference ? rankNearbyPlans(catalog, reference) : [], [catalog, reference]);
  const referenceLabel = userPosition ? 'Tu ubicación' : manualReference && referenceName(manualReference);
  const fromLabel = userPosition ? 'tu ubicación' : referenceLabel;
  const selectedEntry = nearby.find(({ plan }) => plan.id === selection?.id);

  useEffect(() => {
    if (selection) focusAndScroll(detailsRef.current);
    return () => cancelAnimationFrame(returnFrame.current);
  }, [selection]);

  function returnToMap() {
    cancelAnimationFrame(returnFrame.current);
    focusAndScroll(container.current, 0);
    const deadline = performance.now() + 1500;
    function hideWhenAtMap(now) {
      if (window.scrollY <= 1 || now >= deadline) {
        setSelection((current) => current === selection ? null : current);
      } else {
        returnFrame.current = requestAnimationFrame(hideWhenAtMap);
      }
    }
    returnFrame.current = requestAnimationFrame(hideWhenAtMap);
  }

  const locate = useCallback(() => {
    const request = ++locationRequest.current;
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (request !== locationRequest.current) return;
      setUserPosition({ lat: coords.latitude, lon: coords.longitude });
      setStatus('ready');
    }, (error) => {
      if (request === locationRequest.current) setStatus(error.code === 1 ? 'denied' : 'unavailable');
    }, { timeout: 10000 });
  }, []);

  useEffect(() => {
    const timer = setTimeout(locate, 0);
    return () => {
      clearTimeout(timer);
      locationRequest.current += 1;
    };
  }, [locate]);

  useEffect(() => {
    const instance = createPlanMap(container.current);
    mapRef.current = instance;
    const observer = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      mapRef.current = null;
      instance.remove();
    };
  }, []);

  useEffect(() => {
    if (!reference) return;
    const instance = mapRef.current;
    const layers = featureGroup().addTo(instance);
    for (const entry of nearby) {
      const { plan } = entry;
      marker(position(plan), { icon: destinationIcon, title: plan.title, alt: plan.title })
        .bindPopup(planPopup(entry, (selected) => setSelection({ id: selected.id }), onDirections), { maxWidth: 230 }).addTo(layers);
    }
    marker(position(reference), {
      icon: userPosition ? locationIcon : referenceIcon,
      title: referenceLabel,
      keyboard: false,
      zIndexOffset: -400,
    }).bindTooltip(referenceLabel, { direction: 'top', offset: [0, -12] }).addTo(layers);
    instance.fitBounds(layers.getBounds(), { padding: [30, 30], maxZoom: 16, animate: false });
    return () => layers.remove();
  }, [nearby, reference, referenceLabel, userPosition, onDirections]);

  return (
    <section className="nearby-section" aria-labelledby="nearby-title">
      <div className="section-header personal-page-heading"><h2 id="nearby-title">Explorá planes cerca tuyo</h2></div>
      {status === 'loading' && <p className="form-hint" role="status">Buscando tu ubicación…</p>}
      {status === 'denied' && <p className="form-hint" role="status">No diste permiso de ubicación. Podés elegir una referencia del catálogo.</p>}
      {status === 'unavailable' && <p className="form-hint" role="status">No pudimos obtener tu ubicación. Podés elegir una referencia del catálogo.</p>}
      <div className="nearby-controls">
        {userPosition ? (
          <button type="button" className="btn btn-secondary" onClick={() => mapRef.current?.setView(position(userPosition), 15)}>Centrar en mi ubicación</button>
        ) : <>
          {manualReference && (
            <label>Referencia
              <select value={manualReference.id} onChange={(event) => {
                locationRequest.current += 1;
                setReferenceId(event.target.value);
                if (status === 'loading') setStatus('manual');
              }}>
                {references.map((plan) => <option key={plan.id} value={plan.id}>{referenceName(plan)}</option>)}
              </select>
            </label>
          )}
          {status !== 'loading' && <button type="button" className="btn btn-secondary" onClick={locate}>Usar mi ubicación</button>}
        </>}
      </div>
      {fromLabel && <p className="nearby-origin">Distancias aproximadas en línea recta desde <strong>{fromLabel}</strong>.</p>}
      <div className="plan-location-map nearby-map" ref={container} role="region" tabIndex={0} aria-label="Mapa de planes cercanos" hidden={!reference} />
      {!catalog.length && <p className="form-hint" role="status">El catálogo todavía no está disponible.</p>}
      {selectedEntry && <NearbyPlanDetails key={selectedEntry.plan.id} entry={selectedEntry} fromLabel={fromLabel}
        detailsRef={detailsRef} onBack={returnToMap} />}
    </section>
  );
}
