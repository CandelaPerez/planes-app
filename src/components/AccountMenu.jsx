import { useEffect, useId, useRef, useState } from 'react';

export default function AccountMenu({ onSignOut }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const root = useRef(null);
  const trigger = useRef(null);
  const item = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    item.current?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const keyboard = event => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    const viewport = window.matchMedia('(max-width: 760px)');
    const resized = () => { if (!viewport.matches) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keyboard);
    viewport.addEventListener('change', resized);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', keyboard);
      viewport.removeEventListener('change', resized);
    };
  }, [open]);

  const signOut = async () => {
    setBusy(true); setError('');
    try { await onSignOut(); setOpen(false); }
    catch { setError('No se pudo cerrar sesi\u00f3n. Intent\u00e1 nuevamente.'); }
    finally { setBusy(false); }
  };

  return <>
    <button className="btn btn-secondary desktop-sign-out" onClick={onSignOut}>Cerrar sesion</button>
    <div className="mobile-account-menu" ref={root} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button ref={trigger} type="button" className="account-menu-trigger" aria-label="Mi cuenta" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
        onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); } }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></svg>
      </button>
      {open && <div id={id} role="menu" aria-label="Mi cuenta" className="account-menu-dropdown">
        <button ref={item} type="button" role="menuitem" disabled={busy} onClick={signOut}>{busy ? 'Cerrando\u2026' : 'Cerrar sesi\u00f3n'}</button>
        {error && <p role="alert">{error}</p>}
      </div>}
    </div>
  </>;
}
