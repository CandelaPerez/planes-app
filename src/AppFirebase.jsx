import { useEffect, useMemo, useState } from 'react';
import usePlanFilters from './hooks/usePlanFilters';
import { CATALOG, catalogImages, catalogRecords, categoryImages, planImage, categories } from './data/catalog';
import { cityFor, priceRank, priceLabel, categoryClass, aggregateRating, ideaImageFallback, planPhotoFallback, localDateValue, readLocalJson, loadPreviewPlans, imageFallback } from './utils/planUtils';
import Stars from './components/Stars';
import BaDataSource from './components/BaDataSource';
import { loadBaDataPreview } from './services/baData';
import { fetchDistinctPlanPhotos } from './services/planPhotos';
import { firebaseConfigured, firebaseRequested, watchAuth, registerAccount, loginAccount, logoutAccount, watchCatalog, watchSavedPlans, watchRatings, savePlan, updateSavedPlan, removeSavedPlan, saveRating, uploadPlanPhoto } from './services/firebase';
export default function AppFirebase() {
  const [activeTab, setActiveTab] = useState('home');
  const [calendarMonth, setCalendarMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1); });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => localDateValue(new Date()));
  const [schedulePlan, setSchedulePlan] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(() => localDateValue(new Date()));
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [userId, setUserId] = useState(firebaseConfigured ? '' : 'local-preview');
  const [authReady, setAuthReady] = useState(!firebaseConfigured);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [authBusy, setAuthBusy] = useState(false);
  const [fallbackCatalog, setFallbackCatalog] = useState(CATALOG);
  const [baCatalog, setBaCatalog] = useState(null);
  const [catalogNotice, setCatalogNotice] = useState('');
  const catalog = baCatalog || fallbackCatalog;
  const [planPhotos, setPlanPhotos] = useState(() => readLocalJson('porhacer_distinct_plan_photos_v2', {}));
  const [photoRetry, setPhotoRetry] = useState(0);
  const [userPlans, setUserPlans] = useState(() => firebaseConfigured ? [] : loadPreviewPlans());
  const [ratings, setRatings] = useState(() => firebaseConfigured ? [] : readLocalJson('porhacer_preview_ratings', []));
  const [loading, setLoading] = useState(firebaseConfigured);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [zone, setZone] = useState('Todas');
  const [budget, setBudget] = useState('Todos');
  const [sortBy, setSortBy] = useState('recommended');
  const [visibleIdeasPage, setVisibleIdeasPage] = useState({ filterKey: '', count: 6 });
  const [personalFilter, setPersonalFilter] = useState('all');
  const [personalSection, setPersonalSection] = useState('plans');
  const [randomIdea, setRandomIdea] = useState(null);
  const [itineraryCompany, setItineraryCompany] = useState('Todas');
  const [itinerary, setItinerary] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [focusPlanId, setFocusPlanId] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', location: '', category: 'Gastronomía', budget: '$', image: '' });

  useEffect(() => {
    let active = true;
    loadBaDataPreview().then(({ plans }) => {
      if (active) { setBaCatalog(plans); setCatalogNotice(''); }
    }).catch(() => {
      if (active) setCatalogNotice('No se pudo cargar la copia de BA Data. Mostramos temporalmente los 129 planes originales.');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) {
      return undefined;
    }
    return watchAuth((user) => {
      setUserId(user?.uid || '');
      setAuthReady(true);
      setLoading(Boolean(user));
    }, (reason) => { setError(reason.message); setAuthReady(true); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!firebaseConfigured || !userId) return undefined;
    const subscriptions = [];
    subscriptions.push(
      watchCatalog((ideas) => {
        const remoteById = new Map(ideas.map((idea) => [idea.id, idea]));
        setFallbackCatalog(CATALOG.map((idea) => ({ ...remoteById.get(idea.id), ...idea, id: idea.id })));
      }, (reason) => setError(reason.message)),
      watchSavedPlans(userId, (plans) => { setUserPlans(plans); setLoading(false); }, (reason) => { setError(reason.message); setLoading(false); }),
      watchRatings(setRatings, (reason) => setError(reason.message)),
    );
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, [userId]);

  useEffect(() => {
    if (!baCatalog && !catalogNotice) return undefined;
    const usedImageUrls = new Set();
    const missingPhotos = catalog.filter((idea) => {
      if (idea.sourceName) return false;
      const image = String(planPhotos[idea.id]?.image || '').split(/[?#]/)[0];
      if (!image || usedImageUrls.has(image)) return true;
      usedImageUrls.add(image);
      return false;
    });
    if (!missingPhotos.length || !catalog.length) return undefined;
    let active = true;
    let retryTimer;
    fetchDistinctPlanPhotos(missingPhotos, Object.values(planPhotos).flatMap((photo) => [photo.id, ...(photo.backups || []).map((backup) => backup.id)]))
      .then((photos) => {
        if (active) {
          const updatedPhotos = { ...planPhotos, ...photos };
          try { localStorage.setItem('porhacer_distinct_plan_photos_v2', JSON.stringify(updatedPhotos)); } catch { /* Storage is optional; keep the current session working. */ }
          setPlanPhotos(updatedPhotos);
        }
      })
      .catch(() => {
        if (active && photoRetry < 2) {
          retryTimer = window.setTimeout(() => setPhotoRetry((attempt) => attempt + 1), 3500);
        }
      });
    return () => {
      active = false;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [catalog, planPhotos, photoRetry, baCatalog, catalogNotice]);

  useEffect(() => {
    if (firebaseConfigured) return;
    localStorage.setItem('porhacer_preview_plans', JSON.stringify(userPlans));
  }, [userPlans]);

  useEffect(() => {
    if (firebaseConfigured) return;
    localStorage.setItem('porhacer_preview_ratings', JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (activeTab !== 'plans' || !focusPlanId) return undefined;
    const timeout = window.setTimeout(() => {
      document.getElementById(`saved-plan-${focusPlanId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    const clearFocusTimeout = window.setTimeout(() => setFocusPlanId(''), 3200);
    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(clearFocusTimeout);
    };
  }, [activeTab, focusPlanId, userPlans]);

  const ideaFilterKey = `${category}|${zone}|${budget}|${search}|${sortBy}`;
  const visibleIdeasCount = visibleIdeasPage.filterKey === ideaFilterKey ? visibleIdeasPage.count : 6;
  const { zones, visibleIdeas } = usePlanFilters({ catalog, category, zone, budget, search, sortBy, ratings, planPhotos });
  const plansInPersonalSection = userPlans.filter((plan) => (plan.type === 'itinerary') === (personalSection === 'itineraries'));
  const editingExistingPlan = Boolean(editing && editing !== 'new');
  const visibleUserPlans = plansInPersonalSection.filter((plan) => {
    if (personalFilter === 'pending') return plan.status !== 'realizado';
    if (personalFilter === 'done') return plan.status === 'realizado';
    if (personalFilter === 'favorites') return plan.favorite;
    return true;
  });
  const completedCount = userPlans.filter((plan) => plan.status === 'realizado').length;
  const calendarPlans = userPlans.filter((plan) => plan.scheduledAt).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const calendarDays = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [calendarMonth]);
  const calendarMonthPlans = calendarPlans.filter((plan) => { const date = new Date(plan.scheduledAt); return date.getFullYear() === calendarMonth.getFullYear() && date.getMonth() === calendarMonth.getMonth(); });
  const upcomingCalendarPlans = calendarPlans.filter((plan) => new Date(plan.scheduledAt) >= new Date()).slice(0, 2);
  const randomIdeaSaved = randomIdea && userPlans.some((plan) => plan.catalogId === randomIdea.id || plan.externalId === randomIdea.id);
  const itineraryKey = itinerary.map((idea) => idea.id).sort().join('|');
  const itinerarySaved = Boolean(itineraryKey) && userPlans.some((plan) => plan.type === 'itinerary' && plan.items?.map((item) => item.id).sort().join('|') === itineraryKey);

  async function perform(action, successMessage) {
    setBusy(true);
    setError('');
    try {
      await action();
      if (successMessage) setNotice(successMessage);
    } catch (reason) {
      setError(reason.message || 'Ocurrió un error al guardar los cambios.');
    } finally {
      setBusy(false);
    }
  }

  function openSavedPlan(planId) {
    setPersonalSection('plans');
    setPersonalFilter('all');
    setFocusPlanId(planId);
    setActiveTab('plans');
  }

  function openSchedule(plan) {
    setSchedulePlan(plan);
    const scheduledDate = plan.scheduledAt ? new Date(plan.scheduledAt) : new Date();
    setScheduleDate(plan.scheduledAt ? localDateValue(scheduledDate) : localDateValue(new Date()));
    setScheduleTime(plan.scheduledAt ? `${String(scheduledDate.getHours()).padStart(2, '0')}:${String(scheduledDate.getMinutes()).padStart(2, '0')}` : '12:00');
  }

  function changeCalendarMonth(offset) {
    const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
    setCalendarMonth(nextMonth);
    setSelectedCalendarDate(localDateValue(nextMonth));
  }

  function saveSchedule(event) {
    event.preventDefault();
    if (!schedulePlan || !scheduleDate || !scheduleTime) return;
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    const selectedDate = scheduleDate;
    const scheduledMonth = new Date(`${scheduleDate}T12:00:00`);
    if (!firebaseConfigured) {
      setUserPlans((plans) => plans.map((plan) => plan.id === schedulePlan.id ? { ...plan, scheduledAt } : plan));
      setNotice('Plan agregado al calendario.');
      setSchedulePlan(null);
      setCalendarMonth(new Date(scheduledMonth.getFullYear(), scheduledMonth.getMonth(), 1));
      setSelectedCalendarDate(selectedDate);
      setActiveTab('calendar');
      return;
    }
    perform(async () => {
      await updateSavedPlan(userId, schedulePlan.id, { scheduledAt });
      setSchedulePlan(null);
      setCalendarMonth(new Date(scheduledMonth.getFullYear(), scheduledMonth.getMonth(), 1));
      setSelectedCalendarDate(selectedDate);
      setActiveTab('calendar');
    }, 'Plan agregado al calendario.');
  }

  function addIdea(idea) {
    const savedPlan = userPlans.find((plan) => plan.catalogId === idea.id);
    if (savedPlan) {
      setNotice('Esta idea ya estaba en Mis planes.');
      return;
    }
    const ideaToSave = Object.fromEntries(Object.entries(idea).filter(([key, value]) => value !== undefined && !['backups', 'source', 'credit'].includes(key)));
    const savedFields = { catalogId: idea.id };
    if (!firebaseConfigured) {
      setUserPlans((plans) => [{ ...ideaToSave, ...savedFields, id: idea.id, status: 'pendiente', favorite: false, comment: '' }, ...plans]);
      setNotice('Idea guardada en Mis planes.');
      return;
    }
    perform(async () => {
      await savePlan(userId, { ...ideaToSave, ...savedFields, id: idea.sourceName ? idea.id : undefined, status: 'pendiente', favorite: false, comment: '' });
    }, 'Idea guardada en Mis planes.');
  }

  function toggleFavorite(plan) {
    if (!firebaseConfigured) {
      setUserPlans((plans) => plans.map((item) => item.id === plan.id ? { ...item, favorite: !item.favorite } : item));
      return;
    }
    perform(() => updateSavedPlan(userId, plan.id, { favorite: !plan.favorite }), plan.favorite ? 'Quitado de favoritos.' : 'Agregado a favoritos.');
  }

  function toggleStatus(plan) {
    const status = plan.status === 'realizado' ? 'pendiente' : 'realizado';
    if (!firebaseConfigured) {
      setUserPlans((plans) => plans.map((item) => item.id === plan.id ? { ...item, status, photoDate: status === 'realizado' ? new Date().toLocaleDateString('es-AR') : item.photoDate } : item));
      return;
    }
    perform(() => updateSavedPlan(userId, plan.id, { status, photoDate: status === 'realizado' ? new Date().toLocaleDateString('es-AR') : plan.photoDate }), status === 'realizado' ? '¡Plan marcado como realizado!' : 'Plan marcado como pendiente.');
  }

  function ratePlan(plan, value) {
    if (!firebaseConfigured) {
      if (plan.status !== 'realizado') return;
      const planId = plan.catalogId || plan.id;
      setRatings((current) => [...current.filter((rating) => !(rating.planId === planId && rating.userId === 'local-preview')), { planId, userId: 'local-preview', value }]);
      setUserPlans((plans) => plans.map((item) => item.id === plan.id ? { ...item, rating: value } : item));
      setNotice('Valoración guardada en esta vista previa.');
      return;
    }
    perform(() => saveRating(userId, plan.catalogId || plan.id, value, plan.id), 'Tu valoración quedó guardada.');
  }

  function openCreate() {
    setEditing(null);
    setForm({ title: '', description: '', location: '', category: 'Gastronomía', budget: '$', image: '' });
    setActiveTab('plans');
    setEditing('new');
  }

  function openEdit(plan) {
    setEditing(plan.id);
    setForm({ title: plan.title, description: plan.description || '', location: plan.location, category: plan.category, budget: plan.budget, image: plan.image || '' });
  }

  async function submitPlan(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError('Escribí un nombre para el plan o itinerario.');
      return;
    }
    const normalized = editingExistingPlan ? { title } : { ...form, title, description: form.description.trim(), location: form.location.trim() };
    if (!firebaseConfigured) {
      if (editing && editing !== 'new') setUserPlans((plans) => plans.map((plan) => plan.id === editing ? { ...plan, ...normalized } : plan));
      else {
        const id = crypto.randomUUID();
        setUserPlans((plans) => [{ ...normalized, id, image: normalized.image || categoryImages[normalized.category], status: 'pendiente', favorite: false, comment: '' }, ...plans]);
      }
      setEditing(null);
      setNotice('Plan guardado en esta vista previa.');
      return;
    }
    await perform(async () => {
      if (editing && editing !== 'new') await updateSavedPlan(userId, editing, normalized);
      else {
        const id = crypto.randomUUID();
        await savePlan(userId, { ...normalized, id, image: normalized.image || categoryImages[normalized.category], status: 'pendiente', favorite: false, comment: '' });
      }
      setEditing(null);
    }, editing === 'new' ? 'Tu plan personalizado fue creado.' : 'Cambios guardados.');
  }

  function deletePlan(plan) {
    if (window.confirm(`¿Eliminar “${plan.title}” de Mis planes?`)) {
      if (!firebaseConfigured) {
        setUserPlans((plans) => plans.filter((item) => item.id !== plan.id));
        setRatings((current) => current.filter((rating) => rating.planId !== (plan.catalogId || plan.id)));
        setNotice('Plan eliminado de esta vista previa.');
      } else perform(() => removeSavedPlan(userId, plan.id), 'Plan eliminado.');
    }
  }

  async function updateComment(plan, comment) {
    if (!firebaseConfigured) {
      setUserPlans((plans) => plans.map((item) => item.id === plan.id ? { ...item, comment } : item));
      return;
    }
    await perform(() => updateSavedPlan(userId, plan.id, { comment }), 'Recuerdo guardado.');
  }

  function changePlanPhoto(plan, file) {
    if (!file) return;
    if (!firebaseConfigured) {
      const reader = new FileReader();
      reader.onload = () => setUserPlans((plans) => plans.map((item) => item.id === plan.id ? { ...item, image: reader.result } : item));
      reader.readAsDataURL(file);
      return;
    }
    perform(() => uploadPlanPhoto(userId, plan.id, file), 'Fotografía actualizada.');
  }

  function suggestIdea() {
    const unsavedIdeas = visibleIdeas.filter((idea) => !userPlans.some((plan) => plan.catalogId === idea.id || plan.externalId === idea.id));
    if (!unsavedIdeas.length) {
      setRandomIdea(null);
      setNotice('Ya guardaste todas las ideas disponibles con estos filtros.');
      return;
    }
    setRandomIdea(unsavedIdeas[Math.floor(Math.random() * unsavedIdeas.length)]);
  }

  function makeItinerary() {
    // Use the full catalog, with its unique photo assignments, regardless of discovery filters.
    const matching = catalog
      .map((idea) => ({ ...idea, ...(planPhotos[idea.id] || {}), image: planPhotos[idea.id]?.image || idea.image }))
      .filter((idea) => itineraryCompany === 'Todas' || idea.company === itineraryCompany);
    const byCity = matching.reduce((groups, idea) => {
      const city = cityFor(idea.location);
      groups.set(city, [...(groups.get(city) || []), idea]);
      return groups;
    }, new Map());
    const sameCityPairs = [...byCity.values()].filter((ideas) => ideas.length >= 2);
    if (!sameCityPairs.length && matching.length < 2 && catalog.length < 2) {
      setItinerary([]);
      setNotice('No encontramos dos planes de la misma ciudad con esos filtros. Prueba con más opciones.');
      return;
    }
    const sameCityIdeas = sameCityPairs.length
      ? sameCityPairs[Math.floor(Math.random() * sameCityPairs.length)]
      : matching.length >= 2 ? matching : catalog;
    const byCategory = sameCityIdeas.reduce((groups, idea) => {
      groups.set(idea.category, [...(groups.get(idea.category) || []), idea]);
      return groups;
    }, new Map());
    const relatedIdeas = [...byCategory.values()].find((ideas) => ideas.length >= 2) || sameCityIdeas;
    setItinerary([...relatedIdeas].sort(() => Math.random() - 0.5).slice(0, 2));
  }

  function addItinerary() {
    if (!itinerary.length) return;
    const itineraryId = crypto.randomUUID();
    const itineraryPlan = {
      id: itineraryId,
      title: `Itinerario: ${itinerary.map((idea) => idea.title).join(' + ')}`,
      description: 'Un plan para realizar en conjunto. Estas son las actividades incluidas:',
      location: [...new Set(itinerary.map((idea) => idea.location))].join(' · '),
      category: 'Itinerario',
      budget: itinerary.some((idea) => idea.sourceName && idea.budget === 'Sin información') ? 'Sin información' : itinerary.reduce((highest, idea) => priceRank(idea.budget) > priceRank(highest) ? idea.budget : highest, 'Gratis'),
      image: itinerary[0].image,
      type: 'itinerary',
      items: itinerary.map((idea) => ({ ...idea })),
      status: 'pendiente',
      favorite: false,
      comment: '',
    };
    if (!firebaseConfigured) {
      setUserPlans((plans) => [itineraryPlan, ...plans]);
      setNotice('Itinerario guardado como un plan en Mis planes.');
      return;
    }
    perform(() => savePlan(userId, itineraryPlan), 'Itinerario guardado como un plan en Mis planes.');
  }

  const displayPlanImage = (plan) => plan.catalogId && planPhotos[plan.catalogId]?.image
    ? planPhotos[plan.catalogId].image
    : planImage(plan);

  async function submitAuth(event) {
    event.preventDefault();
    if (authMode === 'register' && authForm.password !== authForm.confirmPassword) {
      setError('Las contraseñas no coinciden. Revisalas antes de crear tu cuenta.');
      return;
    }
    setAuthBusy(true);
    setError('');
    try {
      if (authMode === 'register') await registerAccount(authForm.email.trim(), authForm.password);
      else await loginAccount(authForm.email.trim(), authForm.password);
    } catch (reason) {
      const messages = { 'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Inici? sesi?n.', 'auth/invalid-credential': 'Correo o contrase?a incorrectos.', 'auth/weak-password': 'La contrase?a debe tener al menos 6 caracteres.', 'auth/invalid-email': 'Escrib? un correo v?lido.', 'auth/too-many-requests': 'Hubo demasiados intentos. Prob? m?s tarde.' };
      setError(messages[reason.code] || reason.message || 'No se pudo completar el acceso.');
    } finally { setAuthBusy(false); }
  }
  if (firebaseRequested && !firebaseConfigured) return <main className="firebase-gate"><span className="welcome-tag">Por Hacer</span><h1>Revisa la configuración de Firebase</h1><p>VITE_USE_FIREBASE está activado, pero faltan variables de Firebase. Completa la configuración o desactiva la bandera para volver a la vista previa.</p><ol><li>Copia <code>.env.example</code> a <code>.env.local</code> en la raíz del proyecto.</li><li>Completa las variables VITE_FIREBASE_*.</li><li>Activa Email/Password en Authentication, y habilita Firestore y Storage en Firebase Console.</li></ol></main>;

  if (firebaseConfigured && !authReady) return <main className="auth-page"><div className="auth-card"><span className="brand-badge">PH</span><p>Cargando...</p></div></main>;
  if (firebaseConfigured && !userId) {
    const isRegister = authMode === 'register';
    const changeAuthMode = (mode) => {
      if (mode === authMode) return;
      setError('');
      setAuthForm((current) => ({ ...current, password: '', confirmPassword: '' }));
      setAuthMode(mode);
    };
    return <main className="auth-page"><section className="auth-card" aria-labelledby="auth-title">
      <span className="welcome-tag">Por Hacer</span>
      <div className="auth-mode-switch" role="group" aria-label="Elegir acceso">
        <button type="button" className={!isRegister ? 'is-active' : ''} aria-pressed={!isRegister} disabled={authBusy} onClick={() => changeAuthMode('login')}>Iniciar sesión</button>
        <button type="button" className={isRegister ? 'is-active' : ''} aria-pressed={isRegister} disabled={authBusy} onClick={() => changeAuthMode('register')}>Crear cuenta</button>
      </div>
      <h1 id="auth-title">{isRegister ? 'Creá tu cuenta' : 'Bienvenido de nuevo'}</h1>
      <p>{isRegister ? '¿Es tu primera vez? Registrate con tu correo para empezar a guardar tus planes.' : 'Ingresá con el correo y la contraseña de tu cuenta para ver tus planes guardados.'}</p>
      {error && <div className="app-alert error" role="alert">{error}</div>}
      <form onSubmit={submitAuth}>
        <label className="form-group">Correo electrónico<input type="email" autoComplete="email" required disabled={authBusy} value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /></label>
        <label className="form-group">{isRegister ? 'Elegí una contraseña' : 'Contraseña'}<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="6" required disabled={authBusy} aria-describedby={isRegister ? 'auth-password-help' : undefined} value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /></label>
        {isRegister && <>
          <small id="auth-password-help" className="auth-help">Usá al menos 6 caracteres.</small>
          <label className="form-group">Confirmá tu contraseña<input type="password" autoComplete="new-password" minLength="6" required disabled={authBusy} value={authForm.confirmPassword} onChange={(event) => setAuthForm({ ...authForm, confirmPassword: event.target.value })} /></label>
        </>}
        <button className="btn btn-primary auth-submit" type="submit" disabled={authBusy}>{authBusy ? (isRegister ? 'Creando tu cuenta…' : 'Ingresando…') : (isRegister ? 'Crear mi cuenta' : 'Entrar a mis planes')}</button>
      </form>
      <button className="auth-switch" type="button" disabled={authBusy} onClick={() => changeAuthMode(isRegister ? 'login' : 'register')}>{isRegister ? '¿Ya tenés cuenta? Iniciá sesión' : '¿Todavía no tenés cuenta? Creá una cuenta'}</button>
    </section></main>;
  }
  return <div className="app-container">
    <header className="navbar">
      <button type="button" className="nav-brand" aria-label="Ir a Home" onClick={() => setActiveTab('home')}><span className="brand-badge">PH</span><h1>Por Hacer</h1></button>
      <nav><ul className="nav-links">
        <li><button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Inicio</button></li>
        <li><button className={`nav-btn ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>Mis planes</button></li>
        <li><button className={`nav-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendario</button></li>
        <li><button className={`nav-btn ${activeTab === 'bitacora' ? 'active' : ''}`} onClick={() => setActiveTab('bitacora')}>Recuerdos</button></li>
      </ul></nav>
      <div className="nav-account">{firebaseConfigured && <button className="btn btn-secondary" onClick={() => logoutAccount()}>Cerrar sesion</button>}<button className="btn btn-primary" onClick={openCreate}>+ Crear plan</button></div>
    </header>

    <main className="main-content">
      {!firebaseConfigured && <div className="preview-banner" role="status"><strong>Vista previa local</strong><span>Los planes y valoraciones se guardan solo en este navegador. Activa Firebase cuando quieras conectar Firestore.</span></div>}
      {error && <div className="app-alert error" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Cerrar mensaje">×</button></div>}
      {notice && <div className="app-alert success" role="status">{notice}</div>}
      {loading && <div className="loading-message" role="status">Cargando tus planes…</div>}

      {activeTab === 'home' && <section>
        <div className="main-welcome-hero"><img src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2200&q=85" alt="Amigos compartiendo una salida" onError={imageFallback} /><div className="welcome-text"><span className="welcome-tag">Ideas para hacer lugar a momentos</span><h2>¿Qué te gustaría descubrir?</h2><p>Explora planes, guárdalos y deja tu valoración cuando los hayas vivido.</p><a className="btn btn-primary" href="#discover-plans">Descubrir planes</a></div></div>
        <div className="idea-tools-panel"><div className="idea-tools-heading"><h2>¿No sabes qué elegir?</h2><p>Encuentra una idea al azar o arma un itinerario para compartir el día.</p></div><div className="idea-tools"><div className={`idea-tool ${randomIdea ? 'idea-tool-with-result' : ''}`}><div><h3>Un plan al azar</h3><p>Deja que una idea te sorprenda.</p>{randomIdea && <div className="random-plan-result"><img src={randomIdea.image} alt={randomIdea.title} onError={(event) => ideaImageFallback(event, randomIdea)} /><div><p className="tool-result"><strong>{randomIdea.title}</strong><br />{randomIdea.address || randomIdea.location}</p><button type="button" className="btn btn-link" onClick={() => setSelectedIdea(randomIdea)}>Ver detalles</button></div></div>}</div><button className="btn btn-secondary btn-suggestion" onClick={suggestIdea}>Sugerir un plan</button>{randomIdea && <button className={`btn ${randomIdeaSaved ? 'btn-saved' : 'btn-primary'}`} onClick={() => addIdea(randomIdea)} disabled={busy || randomIdeaSaved}>{randomIdeaSaved ? 'Idea guardada' : 'Guardar idea'}</button>}</div><div className="idea-tool"><div><h3>Arma un itinerario</h3><p>Combina dos propuestas para compartir el día.</p></div><select aria-label="Compañía para el itinerario" value={itineraryCompany} onChange={(event) => setItineraryCompany(event.target.value)}><option>Todas</option><option>Solo</option><option>Para conocer gente</option><option>Con amigos</option></select><button className="btn btn-secondary btn-suggestion" onClick={makeItinerary}>Sugerir itinerario</button>{itinerary.length > 0 && <><ul className="itinerary-list">{itinerary.map((idea) => <li key={idea.id}><strong>{idea.title}</strong><span>{idea.location}</span></li>)}</ul><button className={`btn ${itinerarySaved ? 'btn-saved' : 'btn-primary'}`} onClick={addItinerary} disabled={busy || itinerarySaved}>{itinerarySaved ? 'Itinerario guardado' : 'Guardar itinerario'}</button></>}</div></div></div>
        <div className="discovery-section"><div className="section-header" id="discover-plans"><h2>Descubrir planes</h2><p>{catalog.length} {baCatalog ? "lugares de BA Data con nombre y ubicación publicada." : "ideas del catálogo original."}</p></div>
        {catalogNotice && <p className="photo-credit" role="status">{catalogNotice}</p>}{baCatalog && <p className="photo-credit">Fuente: BA Data, Gobierno de la Ciudad de Buenos Aires · <a href="https://creativecommons.org/licenses/by/2.5/ar/" target="_blank" rel="noreferrer">CC BY 2.5 AR</a>. Viajes: paradas del bus turístico.</p>}<div className="category-filter" role="group" aria-label="Filtrar por categoría">{categories.filter((item) => !['Entretenimiento', 'Experiencias'].includes(item)).map((item) => <button key={item} type="button" className={`category-filter-btn ${category === item ? 'active' : ''}`} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="filter-bar discovery-filters">
          <input aria-label="Buscar por nombre o ubicación" type="search" placeholder="Buscar plan o lugar…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Filtrar por zona" value={zone} onChange={(event) => setZone(event.target.value)}><option value="Todas">Todas las zonas</option>{zones.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>
          <select aria-label="Filtrar por presupuesto" value={budget} onChange={(event) => setBudget(event.target.value)}><option value="Todos">Todos los presupuestos</option><option value="Bajo">Bajo</option><option value="Medio">Medio</option><option value="Alto">Alto</option><option value={"Sin informaci\u00f3n"}>Sin informaci&oacute;n</option></select>
          <select aria-label="Ordenar planes" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="recommended">Recomendados</option><option value="top">Mejor puntuados</option><option value="most">Más valorados</option><option value="cheap">Menor presupuesto</option><option value="expensive">Mayor presupuesto</option><option value="alpha">Alfabéticamente</option></select>
        </div>
        
        {baCatalog && <p className="photo-credit" role="status">{visibleIdeas.length.toLocaleString('es-AR')} resultados</p>}
        {!loading && visibleIdeas.length === 0 ? <div className="empty-state"><h3>No encontramos planes con esos filtros</h3><p>Prueba otra búsqueda o limpia alguno de los filtros.</p><button className="btn btn-secondary" onClick={() => { setSearch(''); setCategory('Todas'); setZone('Todas'); setBudget('Todos'); }}>Limpiar filtros</button></div> : <div className="cards-grid">{visibleIdeas.slice(0, visibleIdeasCount).map((idea) => {
          const aggregate = aggregateRating(ratings, idea.id);
          const added = userPlans.some((plan) => plan.catalogId === idea.id || plan.externalId === idea.id);
          const savedPlan = userPlans.find((plan) => plan.catalogId === idea.id || plan.externalId === idea.id);
          return <article className="plan-card" key={idea.id}><div className="card-img-wrapper plan-card-image-trigger" role="button" tabIndex={0} aria-label={`Ver detalles de ${idea.title}`} onClick={() => setSelectedIdea(idea)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedIdea(idea); } }}><img src={idea.image} alt={idea.title} className="card-img" loading="lazy" onError={(event) => ideaImageFallback(event, idea)} /></div><div className="card-content"><div className="card-meta"><span className={`badge badge-${categoryClass(idea.category)}`}>{idea.category}</span><span className="budget-badge">{priceLabel(idea.budget)}</span></div><h3 className="card-title plan-card-title-trigger" onClick={() => setSelectedIdea(idea)}>{idea.title}</h3><p className="card-desc">{idea.description}</p>{idea.sourceName && <p className="photo-credit">Imagen ilustrativa · {idea.location}</p>}{idea.credit && <a className="photo-credit" href={idea.source} target="_blank" rel="noreferrer">Foto: {idea.credit}</a>}<div className="rating-summary"><Stars value={aggregate.average} /><span>{aggregate.count ? `${aggregate.average.toFixed(1)} · ${aggregate.count} ${aggregate.count === 1 ? 'valoración' : 'valoraciones'}` : 'Sin valoraciones'}</span></div><div className="card-info-row"><span>⌖ {idea.address || idea.location}</span></div><div className="card-footer plan-card-actions"><button className="btn btn-secondary" onClick={() => setSelectedIdea(idea)}>Ver detalles</button><button className={`btn ${added ? 'btn-secondary' : 'btn-primary'}`} onClick={() => added ? openSavedPlan(savedPlan.id) : addIdea(idea)} disabled={busy}>{added ? 'En mis planes' : '+ Agregar a mis planes'}</button></div></div></article>;
        })}</div>}{visibleIdeas.length > visibleIdeasCount && <div className="discovery-show-more"><button type="button" className="btn btn-secondary" onClick={() => setVisibleIdeasPage({ filterKey: ideaFilterKey, count: visibleIdeasCount + 6 })}>Ver más</button></div>}
        </div>
        <button type="button" className="calendar-teaser" onClick={() => setActiveTab('calendar')}><div className="calendar-teaser-header"><div><span className="calendar-teaser-kicker">Organiza tus salidas</span><h2>Tu calendario</h2><p>Una vista rápida de tus próximos planes.</p></div><span className="calendar-teaser-link">Abrir calendario <span aria-hidden="true">→</span></span></div>{upcomingCalendarPlans.length ? <div className="calendar-teaser-events">{upcomingCalendarPlans.map((plan) => <div className="calendar-teaser-event" key={plan.id}><img src={displayPlanImage(plan)} alt="" onError={(event) => planPhotoFallback(event, plan, planPhotos)} /><span className="calendar-teaser-date">{new Date(plan.scheduledAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {new Date(plan.scheduledAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span><strong>{plan.title}</strong></div>)}</div> : <div className="calendar-teaser-empty"><span className="calendar-teaser-icon" aria-hidden="true">▦</span><span>Tus planes agendados aparecerán aquí. Presiona para ver el calendario o agenda una salida desde Mis planes.</span></div>}</button>
      </section>}

      {activeTab === 'plans' && <section><div className="section-header"><h2>Mis planes</h2><p>Administra tus ideas y valora cada experiencia cuando la hayas realizado.</p></div>
        <div className="personal-section-switch" role="group" aria-label="Elegir planes o itinerarios">
            <button type="button" className={`personal-section-btn ${personalSection === 'plans' ? 'active' : ''}`} aria-pressed={personalSection === 'plans'} onClick={() => { setPersonalSection('plans'); setPersonalFilter('all'); }}>Planes <span>{userPlans.filter((plan) => plan.type !== 'itinerary').length}</span></button>
            <button type="button" className={`personal-section-btn ${personalSection === 'itineraries' ? 'active' : ''}`} aria-pressed={personalSection === 'itineraries'} onClick={() => { setPersonalSection('itineraries'); setPersonalFilter('all'); }}>Itinerarios <span>{userPlans.filter((plan) => plan.type === 'itinerary').length}</span></button>
        </div>
        <div className="personal-filter-panel"><strong>Filtrar por estado</strong>
          <div className="personal-filter" role="group" aria-label="Filtrar por estado">{[{ value: 'all', label: 'Todos' }, { value: 'pending', label: 'Pendientes' }, { value: 'done', label: 'Realizados' }, { value: 'favorites', label: 'Favoritos' }].map((item) => <button key={item.value} type="button" className={`category-filter-btn ${personalFilter === item.value ? 'active' : ''}`} aria-pressed={personalFilter === item.value} onClick={() => setPersonalFilter(item.value)}>{item.label}</button>)}</div>
        </div>
        {visibleUserPlans.length === 0 ? <div className="empty-state"><h3>{plansInPersonalSection.length ? 'No hay elementos en este filtro' : personalSection === 'itineraries' ? 'Todavía no guardaste ningún itinerario' : 'Todavía no guardaste ningún plan'}</h3><p>Descubre propuestas o crea tu propio plan para empezar.</p><button className="btn btn-primary" onClick={() => setActiveTab('home')}>Explorar planes</button></div> : <div className="cards-grid">{visibleUserPlans.map((plan) => {
          const aggregate = aggregateRating(ratings, plan.catalogId || plan.id);
          return <article id={`saved-plan-${plan.id}`} className={`plan-card ${plan.id === focusPlanId ? 'plan-card-focused' : ''}`} key={plan.id}><div className="card-img-wrapper"><img className="card-img" src={displayPlanImage(plan)} alt={plan.title} loading="lazy" onError={(event) => planPhotoFallback(event, plan, planPhotos)} /><button type="button" className="plan-edit-action" onClick={() => openEdit(plan)} aria-label="Editar plan" title="Editar plan" /><button className={`fav-btn ${plan.favorite ? 'is-favorite' : ''}`} aria-label={plan.favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'} onClick={() => toggleFavorite(plan)}>{plan.favorite ? '♥' : '♡'}</button><button type="button" className="btn btn-danger saved-plan-delete" onClick={() => deletePlan(plan)} disabled={busy}>Eliminar</button></div><div className="card-content"><div className="card-meta"><span className={`badge badge-${categoryClass(plan.category)}`}>{plan.category}</span><span className={`status-label ${plan.status === 'realizado' ? 'done' : ''}`}>{plan.status === 'realizado' ? 'Realizado' : 'Pendiente'}</span></div><h3 className="card-title">{plan.title}</h3><p className="card-desc">{plan.description}</p>{plan.type === 'itinerary' && <ul className="itinerary-plan-items">{(plan.items || []).map((item) => <li key={item.id}><img src={item.image && !item.image.includes('picsum.photos') ? item.image : catalogImages.get(item.id) || categoryImages[item.category] || '/images/plan-placeholder.svg'} alt={item.title} loading="lazy" onError={imageFallback} /><div><strong>{item.title}</strong><span>{item.location}</span></div></li>)}</ul>}<div className="card-info-row"><span>⌖ {plan.type === 'itinerary' ? plan.location : catalogRecords.get(plan.catalogId)?.address || plan.location}</span><span>{priceLabel(plan.budget)}</span></div>
            <div className="rating-summary"><span>Puntuación general</span><Stars value={aggregate.average} /><span>{aggregate.count ? `${aggregate.average.toFixed(1)} (${aggregate.count})` : 'Sin valoraciones'}</span></div>
            {activeTab === 'plans' && <div className="card-footer plan-actions"><div className="plan-primary-actions"><button className="btn btn-secondary" onClick={() => { const catalogRecord = catalogRecords.get(plan.catalogId); setSelectedIdea({ ...catalogRecord, ...plan, address: catalogRecord?.address || plan.address || plan.location, openingHours: catalogRecord?.openingHours || plan.openingHours, duration: catalogRecord?.duration || plan.duration, visitTips: catalogRecord?.visitTips || plan.visitTips, officialUrl: catalogRecord?.officialUrl || plan.officialUrl, image: displayPlanImage(plan), isSavedPlan: true }); }}>Ver detalles</button><button type="button" className={`btn plan-calendar-action ${plan.scheduledAt ? 'is-scheduled' : ''}`} onClick={() => openSchedule(plan)} aria-label={plan.scheduledAt ? 'Cambiar fecha del calendario' : 'Agregar a calendario'} title={plan.scheduledAt ? 'Cambiar fecha del calendario' : 'Agregar a calendario'}>{plan.scheduledAt ? 'Cambiar fecha' : 'Agregar a calendario'}</button></div><button className={`btn plan-status-action ${plan.status === 'realizado' ? 'btn-status-done' : 'btn-secondary'}`} onClick={() => toggleStatus(plan)} disabled={busy}>{plan.status === 'realizado' ? 'Marcar pendiente' : 'Realizado'}</button></div>}
          </div></article>;
        })}</div>}
      </section>}

      {activeTab === 'calendar' && <section className="calendar-section">
        <div className="section-header"><h2>Calendario</h2><p>Organiza tus planes y consulta lo que tienes programado.</p></div>
        <div className="calendar-layout"><div className="calendar-month-view"><div className="calendar-toolbar"><button type="button" className="btn btn-secondary" aria-label="Mes anterior" onClick={() => changeCalendarMonth(-1)}>‹</button><h3>{calendarMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</h3><button type="button" className="btn btn-secondary" aria-label="Mes siguiente" onClick={() => changeCalendarMonth(1)}>›</button><button type="button" className="btn btn-secondary calendar-today" onClick={() => { const today = new Date(); setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedCalendarDate(localDateValue(today)); }}>Hoy</button></div>
        <div className="calendar-grid" role="grid" aria-label="Calendario mensual">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <div className="calendar-weekday" role="columnheader" key={day}>{day}</div>)}{calendarDays.map((day) => {
          const dayKey = localDateValue(day);
          const dayPlans = calendarPlans.filter((plan) => localDateValue(new Date(plan.scheduledAt)) === dayKey);
          const inMonth = day.getMonth() === calendarMonth.getMonth();
          return <button type="button" role="gridcell" key={dayKey} className={`calendar-day ${inMonth ? '' : 'outside-month'} ${selectedCalendarDate === dayKey ? 'selected' : ''} ${dayPlans.length ? 'has-events' : ''}`} aria-label={`${day.toLocaleDateString('es-AR')} · ${dayPlans.length} planes`} aria-pressed={selectedCalendarDate === dayKey} onClick={() => setSelectedCalendarDate(dayKey)}><span className="calendar-day-number">{day.getDate()}</span>{dayPlans.slice(0, 2).map((plan) => <span className="calendar-day-event" key={plan.id}>{plan.title}</span>)}{dayPlans.length > 2 && <span className="calendar-more-events">+{dayPlans.length - 2} más</span>}</button>;
        })}</div></div>
        <div className="calendar-agenda"><div className="calendar-agenda-heading"><h3>{calendarMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</h3><span>{calendarMonthPlans.length} {calendarMonthPlans.length === 1 ? 'plan' : 'planes'}</span></div>{calendarMonthPlans.length === 0 ? <div className="empty-state calendar-empty"><h3>No tienes planes agendados este mes</h3><p>Agrega una fecha desde una tarjeta en Mis planes.</p><button className="btn btn-primary" onClick={() => setActiveTab('plans')}>Ir a Mis planes</button></div> : <div className="calendar-agenda-list">{calendarMonthPlans.map((plan) => <article className="calendar-event-card" key={plan.id}><img src={displayPlanImage(plan)} alt={plan.title} onError={(event) => planPhotoFallback(event, plan, planPhotos)} /><div className="calendar-event-info"><span className="calendar-event-date">{new Date(plan.scheduledAt).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</span><span className="calendar-event-time">{new Date(plan.scheduledAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span><h4>{plan.title}</h4><p>{plan.location}</p></div><button className="btn btn-secondary" onClick={() => { const catalogRecord = catalogRecords.get(plan.catalogId); setSelectedIdea({ ...catalogRecord, ...plan, address: catalogRecord?.address || plan.location, openingHours: catalogRecord?.openingHours, duration: catalogRecord?.duration, visitTips: catalogRecord?.visitTips, officialUrl: catalogRecord?.officialUrl, image: displayPlanImage(plan), isSavedPlan: true }); }}>Ver detalles</button></article>)}</div>}</div></div>
      </section>}

      {activeTab === 'bitacora' && <section><div className="section-header"><h2>Bitácora y recuerdos</h2><p>{completedCount} experiencias realizadas</p></div>{completedCount === 0 ? <div className="empty-state"><h3>Aún no hay experiencias realizadas</h3><p>Cuando completes un plan, aparecerá aquí.</p></div> : <div className="cards-grid">{userPlans.filter((plan) => plan.status === 'realizado').map((plan) => <article className="photo-card" key={plan.id}><div className="photo-wrapper"><img src={displayPlanImage(plan)} alt={plan.title} onError={(event) => planPhotoFallback(event, plan, planPhotos)} /><span className="photo-badge">{plan.category}</span></div><div className="photo-details"><h3>{plan.title}</h3><p>{plan.location} · {plan.photoDate || 'Reciente'}</p><label className="comment-label">Tu recuerdo<textarea rows="3" placeholder="Escribe un recuerdo de este día…" defaultValue={plan.comment || ''} onBlur={(event) => { if (event.target.value !== (plan.comment || '')) updateComment(plan, event.target.value); }} /></label><label className="btn btn-secondary photo-upload">Cambiar fotografía<input type="file" accept="image/*" onChange={(event) => changePlanPhoto(plan, event.target.files?.[0])} /></label><div className="personal-rating"><strong>Mi puntuación</strong><Stars value={plan.rating || 0} interactive disabled={busy} onChange={(value) => ratePlan(plan, value)} /></div></div></article>)}</div>}</section>}
    </main>

    {schedulePlan && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSchedulePlan(null); }}><section className="modal-content schedule-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title"><div className="modal-header"><h2 id="schedule-modal-title">Agregar al calendario</h2><button type="button" className="modal-close" onClick={() => setSchedulePlan(null)} aria-label="Cerrar">×</button></div><p className="schedule-plan-title">{schedulePlan.title}</p><form onSubmit={saveSchedule}><label className="form-group">Fecha<input type="date" required value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} /></label><label className="form-group">Hora<input type="time" required value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} /></label><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setSchedulePlan(null)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={busy}>Guardar en calendario</button></div></form></section></div>}

    {selectedIdea && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedIdea(null); }}><section className="modal-content plan-detail-modal" role="dialog" aria-modal="true" aria-labelledby="plan-detail-title"><div className="modal-header"><div><span className={`badge badge-${categoryClass(selectedIdea.category)}`}>{selectedIdea.category || 'Itinerario'}</span><h2 id="plan-detail-title">{selectedIdea.title}</h2></div><button className="modal-close" onClick={() => setSelectedIdea(null)} aria-label="Cerrar detalles">×</button></div><img className="plan-detail-image" src={selectedIdea.image || planImage(selectedIdea)} alt={selectedIdea.title} onError={imageFallback} /><p className="plan-detail-description">{selectedIdea.description}</p><dl className="plan-detail-facts"><div><dt>{selectedIdea.type === 'itinerary' ? 'Ciudad o zona' : 'Dirección o zona'}</dt><dd>{selectedIdea.address || selectedIdea.location}</dd></div>{selectedIdea.type === 'itinerary' && <div><dt>Planes incluidos</dt><dd><ul className="detail-itinerary-items">{(selectedIdea.items || []).map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.location}</span></li>)}</ul></dd></div>}{selectedIdea.phone && <div><dt>Tel&#233;fono</dt><dd>{selectedIdea.phone}</dd></div>}<div><dt>{selectedIdea.sourceName ? "Horario publicado (verificar vigencia)" : "Horario"}</dt><dd>{selectedIdea.openingHours || 'Consultá el horario actualizado antes de ir.'}</dd></div><div><dt>Duración sugerida</dt><dd>{selectedIdea.duration || (selectedIdea.sourceName ? 'No informada en el recurso.' : 'Entre 1 y 2 horas')}</dd></div><div><dt>Presupuesto estimado</dt><dd>{priceLabel(selectedIdea.budget)}</dd></div>{selectedIdea.visitTips && <div><dt>Para tener en cuenta</dt><dd>{selectedIdea.visitTips}</dd></div>}</dl><BaDataSource plan={selectedIdea} /><div className="modal-actions"><a className="btn btn-secondary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedIdea.title} ${selectedIdea.address || selectedIdea.location}`)}`} target="_blank" rel="noreferrer">Ver ubicación en Maps</a>{selectedIdea.officialUrl && <a className="btn btn-secondary" href={selectedIdea.officialUrl} target="_blank" rel="noreferrer">Sitio oficial</a>}{!selectedIdea.isSavedPlan && <button className="btn btn-primary" onClick={() => { const idea = selectedIdea; setSelectedIdea(null); addIdea(idea); }} disabled={userPlans.some((plan) => plan.catalogId === selectedIdea.id) || busy}>{userPlans.some((plan) => plan.catalogId === selectedIdea.id) ? 'En mis planes' : 'Agregar a mis planes'}</button>}</div></section></div>}

    {editing && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><div className="modal-content"><div className="modal-header"><h2>{editing === 'new' ? 'Crear plan' : 'Editar nombre'}</h2><button className="modal-close" onClick={() => setEditing(null)} aria-label="Cerrar">×</button></div><form onSubmit={submitPlan}><label className="form-group">Nombre<input required maxLength="100" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>{editingExistingPlan && <p className="form-hint">Solo pod?s cambiar el nombre del plan o itinerario. Los dem?s datos se conservan.</p>}{!editingExistingPlan && <><label className="form-group">Descripción<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="form-group">Ubicación<input required maxLength="100" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label className="form-group">Categoría<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-group">Presupuesto<select value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })}><option value="$">Bajo</option><option value="$$">Medio</option><option value="$$$">Alto</option></select></label>{editing === 'new' && <label className="form-group">URL de imagen<input type="url" placeholder="https://…" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></label>}</>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={busy}>Guardar</button></div></form></div></div>}
  </div>;
}
