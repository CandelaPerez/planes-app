const paths = {
  home: 'M3 10.5 12 3l9 7.5M5 9v12h5v-7h4v7h5V9',
  plans: 'M6 3h12a2 2 0 0 1 2 2v16l-8-5-8 5V5a2 2 0 0 1 2-2Z',
  calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  memories: 'M4 4h16v16H4ZM4 15l5-5 4 4 3-3 4 4M16 8h.01',
  map: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
};

export default function NavigationIcon({ name, className = 'mobile-nav-icon' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
