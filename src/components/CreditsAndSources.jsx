import { useEffect, useRef, useState } from 'react';
import PlacePhotoCredit from './PlacePhotoCredit';
import pilot from '../data/baDataPilot.json';
import photos from '../data/baDataPhotos.json';

// Keep credits independent of the asynchronous catalog and its active filters.
const entries = [...new Map([...pilot.entries, ...photos.entries]
  .filter((entry) => entry.photo && entry.photo.license !== 'Public domain')
  .map((entry) => [entry.id, entry])).values()]
  .sort((a, b) => a.originalName.localeCompare(b.originalName, 'es'));

export default function CreditsAndSources() {
  const dialog = useRef(null);
  const [open, setOpen] = useState(false);
  const dialogId = 'creditos-y-fuentes';
  const titleId = `${dialogId}-title`;
  useEffect(() => { if (open && !dialog.current.open) dialog.current.showModal(); }, [open]);
  return <>
    <footer className="credits-footer">
      <a href="#creditos-y-fuentes" aria-haspopup="dialog" onClick={(event) => { event.preventDefault(); setOpen(true); }}>Licencias</a>
    </footer>
    {open && <dialog ref={dialog} id={dialogId} aria-labelledby={titleId} className="modal-content plan-detail-modal credits-dialog" onClose={() => setOpen(false)} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current.close();
    }}>
      <div className="modal-header"><h2 id={titleId}>Licencias</h2><button type="button" className="modal-close" aria-label="Cerrar licencias" onClick={() => dialog.current.close()}>×</button></div>
      <p>Datos adaptados de <a href="https://data.buenosaires.gob.ar/" target="_blank" rel="noreferrer">BA Data · Gobierno de la Ciudad de Buenos Aires</a> · <a href="https://creativecommons.org/licenses/by/2.5/ar/" target="_blank" rel="noreferrer">CC BY 2.5 AR</a>.</p>
      <p>Recursos de BA Data: <a href="https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos" target="_blank" rel="noreferrer">Oferta gastronómica</a>, <a href="https://data.buenosaires.gob.ar/dataset/espacios-culturales" target="_blank" rel="noreferrer">Espacios culturales</a>, <a href="https://data.buenosaires.gob.ar/dataset/espacios-verdes" target="_blank" rel="noreferrer">Espacios verdes</a> y <a href="https://data.buenosaires.gob.ar/dataset/barrios" target="_blank" rel="noreferrer">Barrios</a>.</p>
      <p>Fotografías redimensionadas y encuadradas para la web.</p>
      <ul className="credits-list">{entries.map((entry) => <li key={entry.id} data-credit-plan-id={entry.id}>
        <h3>{entry.originalName}</h3>
        {entry.photo.commonsTitle && <p>{entry.photo.commonsTitle.replace(/^File:/, '')}</p>}
        <p><PlacePhotoCredit plan={{ imageKind: 'photograph', photograph: entry.photo }} /></p>
      </li>)}</ul>
    </dialog>}
  </>;
}
