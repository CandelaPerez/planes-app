import { useEffect, useRef, useState } from 'react';
import { itineraryDateInput, itineraryItemId } from '../utils/itineraryEditing.js';
import { savedPlanKind } from '../utils/savedPlans.js';

export default function ItineraryEditor({ plan, catalog, catalogNotice, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({ title: plan.title || '', description: plan.description || '',
    items: [...(plan.items || [])], scheduledAt: itineraryDateInput(plan.scheduledAt), scheduleChanged: false }));
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const currentIds = new Set(catalog.map(item => item.id));
  const selected = new Set(draft.items.map(itineraryItemId));
  const available = catalog.filter(item => !selected.has(item.id)
    && `${item.title} ${item.originalName || ''} ${item.location || ''}`.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es')));

  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector('input')?.focus();
    return () => previous?.focus();
  }, []);

  const close = () => { if (!saving) onClose(); };
  const move = (index, offset) => setDraft(value => {
    const items = [...value.items];
    [items[index], items[index + offset]] = [items[index + offset], items[index]];
    return { ...value, items };
  });
  const keyboard = event => {
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try { await onSave(draft); onClose(); }
    catch (reason) { setError(reason.message || 'No se pudieron guardar los cambios. Intentá nuevamente.'); }
    finally { setSaving(false); }
  };

  return <div className="modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <section ref={dialog} className="modal-content itinerary-editor" role="dialog" aria-modal="true" aria-labelledby="itinerary-editor-title" onKeyDown={keyboard}>
      <div className="modal-header"><h2 id="itinerary-editor-title">Editar itinerario</h2><button type="button" className="modal-close" aria-label="Cerrar edición" disabled={saving} onClick={close}>×</button></div>
      <form onSubmit={submit}>
        <fieldset disabled={saving}>
          <label className="form-group">Nombre del itinerario<input required maxLength="500" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
          <label className="form-group">Descripción<textarea rows="3" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label>
          <label className="form-group">Fecha y hora programadas<input type="datetime-local" value={draft.scheduledAt} onChange={event => setDraft({ ...draft, scheduledAt: event.target.value, scheduleChanged: true })} /></label>
          <p className="form-hint">La fecha se muestra en tu hora local. Dejá el campo vacío para quitarla.</p>
          <h3>Actividades del itinerario</h3>
          {!draft.items.length && <p role="status">Todavía no hay actividades. Agregá una del catálogo.</p>}
          <ol className="itinerary-editor-items">{draft.items.map((item, index) => {
            const custom = ['custom', 'custom-or-unidentified'].includes(savedPlanKind(item));
            const unavailable = catalog.length > 0 && !currentIds.has(itineraryItemId(item)) && !custom;
            return <li key={`${itineraryItemId(item)}-${index}`}><div><strong>{item.title}</strong><span>{item.address || item.location}</span>
              {unavailable && <p className="itinerary-unavailable">Ya no está en el catálogo actual. Podés quitar esta actividad y agregar otra para reemplazarla.</p>}
              {custom && !currentIds.has(itineraryItemId(item)) && <span>Plan personalizado o sin vínculo confirmado con el catálogo; se conserva.</span>}
            </div><div className="itinerary-item-actions">
              <button type="button" className="btn btn-secondary" aria-label={`Subir ${item.title}`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
              <button type="button" className="btn btn-secondary" aria-label={`Bajar ${item.title}`} disabled={index === draft.items.length - 1} onClick={() => move(index, 1)}>↓</button>
              <button type="button" className="btn btn-secondary" aria-label={`Quitar ${item.title}`} onClick={() => setDraft({ ...draft, items: draft.items.filter((_, position) => position !== index) })}>Quitar</button>
            </div></li>;
          })}</ol>
          <h3>Agregar actividades</h3>
          <label className="form-group">Buscar en el catálogo actual<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nombre o ubicación" /></label>
          {catalogNotice && <p role="status">No se pudo cargar el catálogo. Podés editar las actividades guardadas; intentá recargar para agregar otras.</p>}
          {!catalog.length && !catalogNotice && <p role="status">Cargando catálogo…</p>}
          {catalog.length > 0 && !available.length && <p role="status">No hay más actividades que coincidan con tu búsqueda.</p>}
          <ul className="itinerary-editor-catalog">{available.map(item => <li key={item.id}><div><strong>{item.title}</strong><span>{item.address || item.location}</span></div><button type="button" className="btn btn-secondary" aria-label={`Agregar ${item.title}`} onClick={() => setDraft({ ...draft, items: [...draft.items, item] })}>Agregar</button></li>)}</ul>
        </fieldset>
        {error && <p role="alert" className="itinerary-unavailable">{error}</p>}
        <div className="modal-actions"><button type="button" className="btn btn-secondary" disabled={saving} onClick={close}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button></div>
      </form>
    </section>
  </div>;
}
