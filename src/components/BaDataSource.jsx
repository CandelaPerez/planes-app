const date = (value) => value ? new Date(value).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'No informada';

export default function BaDataSource({ plan }) {
  if (!plan.sourceName) return null;
  return <div className="photo-credit">
    <p>Imagen ilustrativa; no es una fotografía del lugar. No se informa presupuesto.</p>
    <p>Fuente: BA Data · Gobierno de la Ciudad de Buenos Aires · <a href="https://creativecommons.org/licenses/by/2.5/ar/" target="_blank" rel="noreferrer">CC BY 2.5 AR</a>.</p>
    {plan.sourceReferences?.map((source) => <p key={`${source.key}-${source.recordId}`}><a href={source.url} target="_blank" rel="noreferrer">{source.dataset} · Registro {source.recordId}</a><br />Archivo: {date(source.resourceLastModified)} · Descarga: {date(source.downloadedAt)}. La fecha del archivo no confirma la vigencia de cada lugar.</p>)}
    <p>Coordenadas: {plan.lon}, {plan.lat}.{plan.coordinateMethod === 'published-boundary-vertex' && ' Referencia del límite del espacio verde, no de una entrada.'}</p>
  </div>;
}
