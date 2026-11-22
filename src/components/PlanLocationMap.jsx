import { useEffect, useRef } from 'react';
import { circleMarker, featureGroup, geoJSON, marker } from 'leaflet';
import { hasPlanCoordinates } from '../utils/planCoordinates.js';
import { createPlanMap, destinationIcon } from '../utils/leafletMap.js';

export default function PlanLocationMap({ plan, origin, route }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const hasCoordinates = hasPlanCoordinates(plan);
  const { lat, lon, title, coordinateMethod } = plan;

  useEffect(() => {
    if (!hasCoordinates) return;

    const destination = [lat, lon];
    const locationMap = createPlanMap(mapRef.current).setView(destination, 16);
    mapInstance.current = locationMap;
    marker(destination, { icon: destinationIcon, title, alt: title }).addTo(locationMap);

    const resize = new ResizeObserver(() => locationMap.invalidateSize({ pan: false }));
    resize.observe(mapRef.current);
    return () => {
      resize.disconnect();
      mapInstance.current = null;
      locationMap.remove();
    };
  }, [hasCoordinates, lat, lon, title]);

  useEffect(() => {
    const locationMap = mapInstance.current;
    if (!locationMap || !origin) return;

    const layers = featureGroup().addTo(locationMap);
    if (route) {
      geoJSON(route, { style: { color: '#fff', weight: 9, opacity: 1 } }).addTo(layers);
      geoJSON(route, { style: { color: '#623390', weight: 5, opacity: 1 } }).addTo(layers);
    }
    circleMarker(origin, { radius: 8, color: '#fff', weight: 3, fillColor: '#623390', fillOpacity: 1 })
      .bindTooltip('Tu ubicación').addTo(layers);
    locationMap.fitBounds(layers.getBounds().extend([lat, lon]), { padding: [32, 32], maxZoom: 17 });
    return () => layers.remove();
  }, [origin, route, lat, lon, title]);

  return (
    <section className="plan-detail-location" aria-labelledby="plan-location-title">
      <h3 id="plan-location-title">Ubicación en el mapa</h3>
      {hasCoordinates ? (
        <>
          <div className="plan-location-map" ref={mapRef} role="region" aria-label={`Mapa de ${title}`} />
          {coordinateMethod === 'published-boundary-vertex' && <p>El marcador señala un punto del perímetro del espacio verde.</p>}
        </>
      ) : <p>Este plan no tiene coordenadas precisas para mostrar su ubicación en el mapa.</p>}
    </section>
  );
}
