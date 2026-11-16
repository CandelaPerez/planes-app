import PlacePhotoCredit from './PlacePhotoCredit';

const date = (value) => value ? new Date(value).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'No informada';

export default function BaDataSource({ plan }) {
  if (!plan.sourceName) return null;
  return <div className="photo-credit">
    <p><PlacePhotoCredit plan={plan} /> No se informa presupuesto.</p>
    {plan.originalName && <p>Nombre original en {plan.wikidataId ? 'Wikidata' : 'BA Data'}: {plan.originalName}</p>}
    {plan.photograph && <p>{plan.photograph.presentation} Verificación: {date(plan.photograph.verifiedAt)}. La fotografía de archivo no garantiza el aspecto actual del lugar.</p>}
    {plan.wikidataId
      ? <p>Fuente de identidad y ubicación: <a href={plan.sourceUrl} target="_blank" rel="noreferrer">Wikidata · {plan.wikidataId}</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a>. La fotografía tiene su propia licencia, indicada arriba.</p>
      : <p>Fuente: BA Data · Gobierno de la Ciudad de Buenos Aires · <a href="https://creativecommons.org/licenses/by/2.5/ar/" target="_blank" rel="noreferrer">CC BY 2.5 AR</a>.</p>}
    {plan.sourceReferences?.map((source) => <p key={`${source.key}-${source.recordId}`}><a href={source.url} target="_blank" rel="noreferrer">{source.dataset} · Registro {source.recordId}</a><br />Archivo: {date(source.resourceLastModified)} · Descarga: {date(source.downloadedAt)}. La fecha del archivo no confirma la vigencia de cada lugar.</p>)}
    <p>Coordenadas: {plan.lon}, {plan.lat}.{plan.coordinateMethod === 'published-boundary-vertex' && ' Referencia del límite del espacio verde, no de una entrada.'}</p>
    {plan.wikidataId && !plan.address && <p>La fuente no aporta una dirección postal en esta copia; consultá la ubicación por coordenadas. No se informa acceso interior, horarios ni precios.</p>}
  </div>;
}
