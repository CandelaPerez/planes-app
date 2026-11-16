import { useEffect, useRef, useState } from 'react';
import PlacePhotoCredit from './PlacePhotoCredit';
import pilot from '../data/baDataPilot.json';
import photos from '../data/baDataPhotos.json';

// Keep credits independent of the asynchronous catalog and its active filters.
const entries = [...new Map([...pilot.entries, ...photos.entries]
  .filter((entry) => entry.photo)
  .map((entry) => [entry.id, entry])).values()]
  .sort((a, b) => a.originalName.localeCompare(b.originalName, 'es'));

export default function CreditsAndSources() {
  const dialog = useRef(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (open && !dialog.current.open) dialog.current.showModal(); }, [open]);
  return <>
    <footer className="credits-footer">
      <a href="#creditos-y-fuentes" onClick={(event) => { event.preventDefault(); setOpen(true); }}>Créditos y fuentes</a>
    </footer>
    {open && <dialog ref={dialog} id="creditos-y-fuentes" aria-labelledby="credits-title" className="modal-content plan-detail-modal credits-dialog" onClose={() => setOpen(false)} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current.close();
    }}>
      <div className="modal-header"><h2 id="credits-title">Créditos y fuentes</h2><button type="button" className="modal-close" aria-label="Cerrar créditos y fuentes" onClick={() => dialog.current.close()}>×</button></div>
      <p>Las fotografías pertenecen a sus autores y se reutilizan bajo las licencias indicadas para cada lugar.</p>
      <p>Datos de lugares y barrios: <a href="https://data.buenosaires.gob.ar/" target="_blank" rel="noreferrer">BA Data · Gobierno de la Ciudad de Buenos Aires</a> · <a href="https://creativecommons.org/licenses/by/2.5/ar/" target="_blank" rel="noreferrer">CC BY 2.5 AR</a>. Identidad y ubicación de atractivos adicionales: <a href="https://www.wikidata.org/" target="_blank" rel="noreferrer">Wikidata</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a>.</p>
      <p>Recursos de BA Data: <a href="https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos" target="_blank" rel="noreferrer">Oferta gastronómica</a>, <a href="https://data.buenosaires.gob.ar/dataset/espacios-culturales" target="_blank" rel="noreferrer">Espacios culturales</a>, <a href="https://data.buenosaires.gob.ar/dataset/espacios-verdes" target="_blank" rel="noreferrer">Espacios verdes</a> y <a href="https://data.buenosaires.gob.ar/dataset/barrios" target="_blank" rel="noreferrer">Barrios</a>.</p>
      <p>Los archivos se conservan sin editar. Su encuadre se adapta al espacio de las tarjetas mediante CSS. Las fotografías de archivo no garantizan el aspecto actual del lugar.</p>
      <ul className="credits-list">{entries.map((entry) => <li key={entry.id} data-credit-plan-id={entry.id}>
        <h3>{entry.originalName}</h3>
        <p><PlacePhotoCredit plan={{ imageKind: 'photograph', photograph: entry.photo }} /></p>
        <p><a href={entry.photo.originalUrl || entry.photo.url} target="_blank" rel="noreferrer">Archivo original</a></p>
      </li>)}</ul>
    </dialog>}
  </>;
}
