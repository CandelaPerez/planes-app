import { useLayoutEffect, useRef, useState } from 'react';
import PlanLocationMap from './PlanLocationMap';
import { requestWalkingRoute } from '../services/walkingRoute.js';

export default function PlanDirectionsModal({ plan, onClose }) {
  const dialogRef = useRef(null);
  const requestRef = useRef(null);
  const [origin, setOrigin] = useState(null);
  const [route, setRoute] = useState(null);
  const [status, setStatus] = useState('consent');

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      requestRef.current?.abort();
      dialog.close();
    };
  }, []);

  function calculateRoute() {
    if (requestRef.current) return;
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }

    const request = new AbortController();
    requestRef.current = request;
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      if (request.signal.aborted) return;
      const start = [coords.latitude, coords.longitude];
      setOrigin(start);
      setStatus('routing');
      try {
        const geometry = await requestWalkingRoute(start, [plan.lat, plan.lon], request.signal);
        if (request.signal.aborted) return;
        setRoute(geometry);
        setStatus(geometry ? 'ready' : 'noRoute');
      } catch {
        if (!request.signal.aborted) setStatus('serviceError');
      }
    }, (error) => {
      if (!request.signal.aborted) setStatus(error.code === 1 ? 'denied' : 'unavailable');
    }, { timeout: 10000 });
  }

  const messages = {
    locating: 'Esperando tu ubicación…',
    routing: 'Calculando el recorrido a pie…',
    ready: 'Recorrido a pie · Tu ubicación y destino aparecen marcados en el mapa.',
    denied: 'No diste permiso para compartir tu ubicación. Podés seguir viendo el destino en el mapa.',
    unavailable: 'No pudimos obtener tu ubicación. Podés seguir viendo el destino en el mapa.',
    noRoute: 'FOSSGIS no encontró un recorrido a pie. El destino sigue visible en el mapa.',
    serviceError: 'El servicio de rutas no está disponible en este momento. El destino sigue visible en el mapa.',
  };

  return (
    <dialog className="plan-directions-dialog" ref={dialogRef} aria-labelledby="plan-directions-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <section className="modal-content plan-detail-modal">
          <div className="modal-header">
            <div>
              <h2 id="plan-directions-title">Cómo llegar</h2>
              <p>{plan.title}</p>
            </div>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar cómo llegar">×</button>
          </div>
          {status === 'consent' ? (
            <div className="plan-directions-consent">
              <p>Para calcular el recorrido a pie, Por Hacer comparte tu ubicación actual con FOSSGIS. El proveedor registra las solicitudes de ruta.</p>
              <button type="button" className="btn btn-primary" onClick={calculateRoute}>Compartir ubicación y calcular</button>
            </div>
          ) : <p className="form-hint" role="status">{messages[status]}</p>}
          <PlanLocationMap plan={plan} origin={origin} route={route} />
          <p className="form-hint">
            Rutas de <a href="https://routing.openstreetmap.de/about.html">OSRM · FOSSGIS</a>
            {' · '}<a href={`https://www.openstreetmap.org/fixthemap?lat=${plan.lat}&lon=${plan.lon}&zoom=17`}>Corregir el mapa</a>
          </p>
        </section>
      </div>
    </dialog>
  );
}
