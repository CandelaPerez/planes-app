import { useEffect, useRef, useState } from 'react';
import { itineraryItemId } from '../utils/itineraryEditing.js';

export default function ItineraryEditor({ plan, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({ title: plan.title || '', items: [...(plan.items || [])] }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector('input')?.focus();
    return () => previous?.focus();
  }, []);

  const close = () => { if (!saving) onClose(); };
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
          <h3>Actividades del itinerario</h3>
          {!draft.items.length && <p role="status">No quedan actividades en este itinerario.</p>}
          <ol className="itinerary-editor-items">{draft.items.map((item, index) => {
            return <li key={`${itineraryItemId(item)}-${index}`}><div><strong>{item.title}</strong><span>{item.address || item.location}</span>
            </div><div className="itinerary-item-actions">
              <button type="button" className="btn btn-secondary" aria-label={`Quitar ${item.title}`} onClick={() => setDraft({ ...draft, items: draft.items.filter((_, position) => position !== index) })}>Quitar</button>
            </div></li>;
          })}</ol>
        </fieldset>
        {error && <p role="alert" className="itinerary-unavailable">{error}</p>}
        <div className="modal-actions"><button type="button" className="btn btn-secondary" disabled={saving} onClick={close}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button></div>
      </form>
    </section>
  </div>;
}
