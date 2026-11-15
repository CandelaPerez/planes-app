export default function OpenDataTodaySection() {
  return <section className="discovery-section api-today-preview" aria-labelledby="today-plans-title">
    <div className="section-header"><h2 id="today-plans-title">Planes para hacer hoy</h2><p>Eventos con fecha confirmada para hoy.</p></div>
    <div className="api-preview-notice" role="status"><strong>No hay eventos con fecha confirmada para hoy.</strong> Podés encontrar lugares permanentes en Descubrir planes.</div>
  </section>;
}
