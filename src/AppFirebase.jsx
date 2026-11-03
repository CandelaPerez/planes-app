import { useEffect, useMemo, useState } from 'react';
import CATALOG_IDEAS_EXTRA from './catalog-extra';
import { fetchDistinctPlanPhotos } from './planPhotos';
import { firebaseConfigured, firebaseRequested, startAnonymousSession, syncCatalog, watchCatalog, watchSavedPlans, watchRatings, savePlan, updateSavedPlan, removeSavedPlan, saveRating, migrateLegacyPlans, uploadPlanPhoto } from './firebase';
import './App.css';

const CATALOG_DETAILS = {
  cat_1: { title: 'Merienda en el Café Tortoni', location: 'Av. de Mayo 825, Monserrat, Ciudad de Buenos Aires', address: 'Av. de Mayo 825, C1084 CABA', openingHours: 'Todos los días, 08:00–21:00', officialUrl: 'https://www.cafetortoni.com.ar/', duration: '1 a 2 horas', visitTips: 'Es un café histórico; puede haber fila en horarios de merienda.' },
  cat_2: { location: 'Parque Centenario, Av. Díaz Vélez 4865, Caballito, Ciudad de Buenos Aires', address: 'Av. Díaz Vélez 4865, Caballito, CABA', duration: '1 a 3 horas', visitTips: 'Llevá manta y revisá el pronóstico antes de organizar el picnic.' },
  cat_3: { title: 'Museo del Cine Pablo Ducrós Hicken', location: 'Agustín R. Caffarena 51, La Boca, Ciudad de Buenos Aires', address: 'Agustín R. Caffarena 51, CABA', openingHours: 'Lunes, miércoles a viernes 11:00–19:00; sábados, domingos y feriados 11:00–20:00; martes cerrado.', officialUrl: 'https://buenosaires.gob.ar/gcaba_historico/cultura/museos/museodelcine', duration: '1 a 2 horas' },
  cat_4: { location: 'Parque Independencia, Tandil, Buenos Aires', address: 'Parque Independencia, Tandil, Buenos Aires', duration: '2 a 4 horas', visitTips: 'El parque es al aire libre; verificá el clima y el acceso a los atractivos internos.' },
  cat_5: { title: 'Taller de cerámica en Taller Mi Mundo', location: 'Vera 657, Villa Crespo, Ciudad de Buenos Aires', address: 'Vera 657, CABA', officialUrl: 'https://www.tallermimundo.com/', visitTips: 'Consultá disponibilidad de clases y reservá antes de ir.' },
  cat_6: { location: 'Reserva Ecológica Costanera Sur, Av. Dr. Tristán Achával Rodríguez 1550, Puerto Madero, CABA', address: 'Av. Dr. Tristán Achával Rodríguez 1550, CABA', openingHours: 'Martes a domingos y feriados 08:00–18:00 (abril–octubre) y 08:00–19:00 (noviembre–marzo). Puede cerrar por clima.', officialUrl: 'https://buenosaires.gob.ar/gcaba_historico/vicejefatura/ambiente/reservasecologicas/reserva-ecologica-costanera-sur', duration: '2 a 3 horas', visitTips: 'Llevá agua, repelente y calzado cómodo. El acceso puede cerrarse por lluvia o viento.' },
  cat_7: { title: 'Cena en Elena', location: 'Posadas 1086/88, Recoleta, Ciudad de Buenos Aires', address: 'Posadas 1086/88, CABA', officialUrl: 'https://elena-ponyline.com/elena/', visitTips: 'Revisá la carta, disponibilidad y reservas antes de ir.' },
  cat_9: { title: 'Jazz en vivo en Bebop Club', location: 'Uriarte 1658, Palermo, Ciudad de Buenos Aires', address: 'Uriarte 1658, Palermo, CABA', visitTips: 'La programación y los horarios dependen de cada función; revisá la cartelera y reservá.' },
  cat_10: { location: 'Jardín Botánico Carlos Thays, Av. Santa Fe 3951, Palermo, CABA', address: 'Av. Santa Fe 3951, CABA', duration: '1 a 2 horas' },
  cat_11: { title: 'Ramen en Nobiru Izakaya', location: 'Barrio Chino, Belgrano, Ciudad de Buenos Aires', address: 'Barrio Chino, Belgrano, CABA', officialUrl: 'https://nobiru.com.ar/', visitTips: 'Consultá horarios y disponibilidad de ramen en el sitio del restaurante.' },
  cat_12: { title: 'Arte contemporáneo en Galería Ruth Benzacar', location: 'Juan Ramírez de Velasco 1287, Villa Crespo, CABA', address: 'Juan Ramírez de Velasco 1287, CABA', openingHours: 'Martes a viernes 14:00–19:00; sábados 16:00–19:00. Feriados con cita previa.', officialUrl: 'https://ruthbenzacar.com/galeria/', duration: '1 a 2 horas' },
  cat_13: { location: 'Rosedal de Palermo, Av. Infanta Isabel 900, Palermo, CABA', address: 'Av. Infanta Isabel 900, CABA', duration: '1 a 2 horas' },
  cat_14: { location: 'Museo Nacional de Bellas Artes, Av. del Libertador 1473, Recoleta, CABA', address: 'Av. del Libertador 1473, CABA', duration: '1 a 3 horas' },
  cat_19: { location: 'Jardín Japonés, Av. Casares 3450, Palermo, CABA', address: 'Av. Casares 3450, CABA', duration: '1 a 2 horas' },
  cat_20: { location: 'Mercado de San Telmo, Defensa 963, San Telmo, CABA', address: 'Defensa 963, CABA' },
  cat_21: { title: 'Brunch en Malvón', location: 'Serrano 789, Villa Crespo, CABA', address: 'Serrano 789, CABA' },
  cat_22: { title: 'Empanadas en El Sanjuanino', location: 'Posadas 1515, Recoleta, CABA', address: 'Posadas 1515, CABA' },
  cat_23: { title: 'Merienda en Las Violetas', location: 'Av. Rivadavia 3899, Almagro, CABA', address: 'Av. Rivadavia 3899, CABA' },
  cat_24: { location: 'Mercado de Belgrano, Juramento 2527, Belgrano, CABA', address: 'Juramento 2527, CABA' },
  cat_25: { location: 'Paseo de la Costanera Norte, Av. Rafael Obligado 6745, CABA', address: 'Av. Rafael Obligado 6745, CABA' },
  cat_26: { title: 'Jardín Botánico Carlos Thays', location: 'Av. Santa Fe 3951, Palermo, CABA', address: 'Av. Santa Fe 3951, CABA' },
  cat_27: { location: 'Barrio Histórico, Colonia del Sacramento, Uruguay', address: 'Barrio Histórico, Colonia del Sacramento, Uruguay' },
  cat_28: { location: 'Villa General Belgrano, Córdoba', address: 'Villa General Belgrano, Córdoba' },
  cat_29: { title: 'Visita a Bodega Salentein en Valle de Uco', location: 'Ruta Provincial 89, Los Árboles, Tunuyán, Mendoza', address: 'Ruta Provincial 89, Los Árboles, Tunuyán, Mendoza' },
  cat_30: { location: 'Parque Nacional Iguazú, Ruta Nacional 101 km 142, Puerto Iguazú, Misiones', address: 'Ruta Nacional 101 km 142, Puerto Iguazú, Misiones', openingHours: 'Todos los días, 08:00–18:00; último ingreso 16:00. Circuitos sujetos a clima y mantenimiento.', officialUrl: 'https://iguazuargentina.com/planifica-tu-visita/', duration: 'Día completo', visitTips: 'Usá calzado cómodo y verificá el estado de los circuitos antes de salir.' },
  cat_31: { location: 'Centro de Bariloche, San Carlos de Bariloche, Río Negro', address: 'Centro de Bariloche, Río Negro' },
  cat_32: { location: 'Playa Varese, Av. Patricio Peralta Ramos 1000, Mar del Plata, Buenos Aires', address: 'Av. Patricio Peralta Ramos 1000, Mar del Plata' },
  cat_33: { location: 'Puerto de Frutos, Sarmiento 160, Tigre, Buenos Aires', address: 'Sarmiento 160, Tigre', openingHours: 'Todos los días, 10:00–18:00; los locales pueden variar.', officialUrl: 'https://vivitigre.gob.ar/actividades/puerto-de-frutos/' },
  cat_34: { location: 'MALBA, Av. Figueroa Alcorta 3415, Palermo, CABA', address: 'Av. Figueroa Alcorta 3415, CABA', openingHours: 'Miércoles 11:00–20:00; jueves a lunes 12:00–20:00; martes cerrado.', officialUrl: 'https://www.malba.org.ar/visitar/', duration: '1 a 3 horas' },
  cat_35: { location: 'Teatro Colón, Cerrito 628, San Nicolás, CABA', address: 'Cerrito 628, CABA', openingHours: 'Visitas guiadas todos los días, 10:00–16:45, con salidas cada 15 minutos. Puede variar por eventos.', officialUrl: 'https://teatrocolon.org.ar/visitas-guiadas/', duration: '50 minutos', visitTips: 'Comprá la entrada con anticipación y confirmá disponibilidad de visitas.' },
  cat_36: { location: 'Caminito, Av. Pedro de Mendoza 1900, La Boca, CABA', address: 'Av. Pedro de Mendoza 1900, CABA' },
  cat_37: { location: 'El Ateneo Grand Splendid, Av. Santa Fe 1860, Recoleta, CABA', address: 'Av. Santa Fe 1860, CABA' },
  cat_38: { location: 'Centro Cultural Recoleta, Junín 1930, Recoleta, CABA', address: 'Junín 1930, CABA' },
};

const CATALOG = [
  { id: 'cat_1', title: 'Merienda pastelera en una cafetería especial', description: 'Probar café de especialidad y acompañarlo con croissants artesanales.', location: 'Palermo Soho', category: 'Gastronomía', budget: '$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_2', title: 'Picnic al atardecer en el parque', description: 'Llevar manta, mate, frutas y libros para una tarde al aire libre.', location: 'Parque Centenario, Caballito', category: 'Aire Libre', budget: 'Gratis', company: 'Solo', image: 'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_3', title: 'Recorrido por el Museo del Cine', description: 'Explorar exposiciones sobre cine argentino y fotografía.', location: 'San Telmo', category: 'Cultura', budget: '$', company: 'Para conocer gente', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_4', title: 'Escapada de fin de semana a Tandil', description: 'Conocer el Parque Independencia y los paisajes serranos.', location: 'Tandil, Buenos Aires', category: 'Viajes', budget: '$$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_5', title: 'Taller de cerámica artesanal', description: 'Aprender modelado en arcilla y esmaltado en un estudio del barrio.', location: 'Villa Crespo', category: 'Cultura', budget: '$$', company: 'Para conocer gente', image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_6', title: 'Caminata por la Reserva Ecológica', description: 'Recorrer senderos y miradores entre la ciudad y el río.', location: 'Puerto Madero', category: 'Aire Libre', budget: 'Gratis', company: 'Solo', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_7', title: 'Cena y cata de vinos', description: 'Probar platos de estación con una selección de vinos argentinos.', location: 'Recoleta', category: 'Gastronomía', budget: '$$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_9', title: 'Noche de jazz en vivo', description: 'Disfrutar un concierto íntimo en un club de música porteño.', location: 'San Telmo', category: 'Cultura', budget: '$$', company: 'Para conocer gente', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_10', title: 'Lectura bajo los árboles del Botánico', description: 'Buscar una banca tranquila para leer en el Jardín Botánico Carlos Thays.', location: 'Palermo', category: 'Aire Libre', budget: 'Gratis', company: 'Solo', image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_11', title: 'Ruta de ramen por el Barrio Chino', description: 'Probar ramen y otras especialidades en restaurantes de Belgrano.', location: 'Belgrano', category: 'Gastronomía', budget: '$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_12', title: 'Galerías de arte independiente', description: 'Descubrir artistas locales y espacios creativos del barrio.', location: 'Chacarita', category: 'Cultura', budget: '$', company: 'Para conocer gente', image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_13', title: 'Paseo entre rosas en el Rosedal', description: 'Caminar por los jardines y cruzar el puente blanco de Palermo.', location: 'Bosques de Palermo', category: 'Aire Libre', budget: 'Gratis', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_14', title: 'Museo Nacional de Bellas Artes', description: 'Recorrer su colección de arte argentino e internacional.', location: 'Recoleta', category: 'Cultura', budget: 'Gratis', company: 'Solo', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_15', title: 'Feria de antigüedades de San Telmo', description: 'Curiosear puestos, diseño y artistas callejeros por el casco histórico.', location: 'San Telmo', category: 'Cultura', budget: '$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_16', title: 'Atardecer en Costanera Sur', description: 'Recorrer los senderos de la Reserva Ecológica y mirar el río desde sus miradores.', location: 'Puerto Madero', category: 'Aire Libre', budget: 'Gratis', company: 'Solo', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_17', title: 'Librerías y cafés de Avenida Corrientes', description: 'Elegir una lectura entre las librerías del centro y hacer una pausa en un café.', location: 'San Nicolás', category: 'Cultura', budget: '$', company: 'Para conocer gente', image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_18', title: 'Ruta de murales por Palermo', description: 'Descubrir arte urbano y fachadas coloridas caminando por el barrio.', location: 'Palermo', category: 'Cultura', budget: 'Gratis', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_19', title: 'Jardín Japonés de Buenos Aires', description: 'Visitar puentes, estanques y jardines; revisar horarios y entradas antes de ir.', location: 'Palermo', category: 'Aire Libre', budget: '$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_20', title: 'Mercado de San Telmo', description: 'Probar algo rico entre puestos de comida y recorrer el mercado histórico.', location: 'San Telmo', category: 'Gastronomía', budget: '$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1000&q=80' },
  ...CATALOG_IDEAS_EXTRA,
].map((idea) => ({ ...idea, ...CATALOG_DETAILS[idea.id] }));

const catalogImages = new Map(CATALOG.map((idea) => [idea.id, idea.image]));
const catalogRecords = new Map(CATALOG.map((idea) => [idea.id, idea]));
const categoryImages = {
  Gastronomía: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
  'Aire Libre': 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1000&q=80',
  Cultura: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=80',
  Viajes: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
};
const planImage = (plan) => {
  if (plan.catalogId) return plan.image && !plan.image.includes('picsum.photos') ? plan.image : catalogImages.get(plan.catalogId) || categoryImages[plan.category];
  if (plan.type === 'itinerary') {
    const firstItem = plan.items?.[0];
    return firstItem?.image && !firstItem.image.includes('picsum.photos')
      ? firstItem.image
      : catalogImages.get(firstItem?.id) || categoryImages[firstItem?.category] || categoryImages['Aire Libre'];
  }
  return plan.image && !plan.image.includes('picsum.photos') ? plan.image : categoryImages[plan.category] || '/images/plan-placeholder.svg';
};

const categories = ['Todas', 'Gastronomía', 'Aire Libre', 'Cultura', 'Viajes'];
const zoneOrder = ['Ciudad de Buenos Aires', 'Zona Norte del GBA', 'Interior de Buenos Aires', 'Centro y Cuyo', 'Litoral y Norte', 'Patagonia', 'Internacional'];
function cityFor(location) {
  const place = String(location || '').toLocaleLowerCase('es');
  if (place.includes('ciudad de buenos aires') || place.includes('caba')) return 'Ciudad de Buenos Aires';
  if (['palermo', 'san telmo', 'recoleta', 'caballito', 'villa crespo', 'puerto madero', 'san nicolás', 'belgrano', 'chacarita', 'almagro', 'la boca', 'costanera', 'rosedal', 'parque centenario'].some((name) => place.includes(name))) return 'Ciudad de Buenos Aires';
  if (place.includes('tigre')) return 'Tigre';
  if (place.includes('tandil')) return 'Tandil';
  if (place.includes('mar del plata')) return 'Mar del Plata';
  if (place.includes('córdoba')) return 'Córdoba';
  if (place.includes('mendoza') || place.includes('valle de uco')) return 'Mendoza';
  if (place.includes('iguazú') || place.includes('misiones')) return 'Puerto Iguazú';
  if (place.includes('bariloche') || place.includes('río negro')) return 'Bariloche';
  if (place.includes('colonia') || place.includes('uruguay')) return 'Colonia del Sacramento';
  return String(location || '').split(',')[0].trim();
}
function zoneFor(location) {
  const place = location.toLocaleLowerCase('es');
  if (place.includes('uruguay') || place.includes('colonia')) return 'Internacional';
  if (place.includes('tigre')) return 'Zona Norte del GBA';
  if (place.includes('tandil') || place.includes('mar del plata')) return 'Interior de Buenos Aires';
  if (place.includes('córdoba') || place.includes('mendoza') || place.includes('valle de uco')) return 'Centro y Cuyo';
  if (place.includes('iguazú') || place.includes('misiones')) return 'Litoral y Norte';
  if (place.includes('bariloche') || place.includes('río negro')) return 'Patagonia';
  return 'Ciudad de Buenos Aires';
}
const priceRank = (budget) => ({ Gratis: 0, '$': 1, Bajo: 1, '$$': 2, Medio: 2, '$$$': 3, Alto: 3 }[budget] ?? 1);
const priceLabel = (budget) => ({ Gratis: 'Gratis', '$': 'Bajo', '$$': 'Medio', '$$$': 'Alto' }[budget] ?? budget);
const budgetLevel = (budget) => priceRank(budget) <= 1 ? 'Bajo' : priceRank(budget) === 2 ? 'Medio' : 'Alto';
const ratingDescriptions = ['No me gustó', 'Estuvo bien, pero no fue lo que esperaba', 'Estuvo bien', 'Me gustó mucho', 'Fue una experiencia excelente'];
const aggregateRating = (ratings, planId) => {
  const values = ratings.filter((rating) => rating.planId === planId).map((rating) => Number(rating.value)).filter((value) => value >= 1 && value <= 5);
  return { count: values.length, average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0 };
};
function ideaImageFallback(event, idea) {
  const image = event.currentTarget;
  const retryCount = Number(image.dataset.imageRetry || 0);
  const fallback = idea.backups?.[retryCount];
  if (fallback) {
    image.dataset.imageRetry = String(retryCount + 1);
    image.src = fallback.image;
    const credit = image.closest('.plan-card')?.querySelector('.photo-credit');
    if (credit) {
      credit.href = fallback.source;
      credit.textContent = `Foto: ${fallback.credit}`;
    }
    return;
  }
  image.onerror = null;
  image.src = idea.sourceImage || '/images/plan-placeholder.svg';
}

function planPhotoFallback(event, plan, assignedPhotos) {
  const assignedPhoto = plan.catalogId && assignedPhotos[plan.catalogId];
  if (assignedPhoto) ideaImageFallback(event, { ...plan, ...assignedPhoto, sourceImage: plan.image || catalogImages.get(plan.catalogId) });
  else imageFallback(event);
}
const localDateValue = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function readLocalJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function loadPreviewPlans() {
  const saved = readLocalJson('porhacer_preview_plans', null) ?? readLocalJson('porhacer_user_plans', []);
  return saved.map((plan) => {
    const idea = CATALOG.find((item) => item.title.toLocaleLowerCase('es') === String(plan.title || '').toLocaleLowerCase('es'));
    return { ...plan, catalogId: plan.catalogId || idea?.id || null };
  });
}

function Stars({ value = 0, interactive = false, onChange, disabled = false }) {
  return <span className={`rating-stars ${interactive ? 'interactive' : ''}`} role={interactive ? 'group' : 'img'} aria-label={value ? `${value} de 5 estrellas` : 'Sin valoraciones'}>
    {[1, 2, 3, 4, 5].map((star) => interactive
      ? <button key={star} type="button" aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}: ${ratingDescriptions[star - 1]}`} title={ratingDescriptions[star - 1]} disabled={disabled} onClick={() => onChange(star)} className={star <= value ? 'star selected' : 'star'}>★</button>
      : <span key={star} className={star <= Math.round(value) ? 'star selected' : 'star'}>★</span>)}
  </span>;
}

function imageFallback(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = '/images/plan-placeholder.svg';
}

export default function AppFirebase() {
  const [activeTab, setActiveTab] = useState('home');
  const [calendarMonth, setCalendarMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1); });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => localDateValue(new Date()));
  const [schedulePlan, setSchedulePlan] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(() => localDateValue(new Date()));
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [userId, setUserId] = useState(firebaseConfigured ? '' : 'local-preview');
  const [catalog, setCatalog] = useState(() => firebaseConfigured ? [] : CATALOG);
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
  const [visibleIdeasCount, setVisibleIdeasCount] = useState(6);
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
    if (!firebaseConfigured) {
      return undefined;
    }
    let active = true;
    const subscriptions = [];
    startAnonymousSession()
      .then(async (user) => {
        if (!active) return;
        setUserId(user.uid);
        await migrateLegacyPlans(user.uid, CATALOG);
        await syncCatalog(CATALOG);
        if (!active) return;
        subscriptions.push(
          watchCatalog((ideas) => setCatalog(ideas.map((idea) => ({ ...idea, ...catalogRecords.get(idea.id), id: idea.id }))), (reason) => setError(reason.message)),
          watchSavedPlans(user.uid, setUserPlans, (reason) => setError(reason.message)),
          watchRatings(setRatings, (reason) => setError(reason.message)),
        );
      })
      .catch((reason) => setError(`No se pudo iniciar sesión o cargar Firestore: ${reason.message}`))
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(() => {
    const missingPhotos = catalog.filter((idea) => !planPhotos[idea.id]);
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
  }, [catalog, planPhotos, photoRetry]);

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
    setVisibleIdeasCount(6);
  }, [category, zone, budget, search, sortBy]);

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

  const zones = useMemo(() => {
    const counts = catalog.reduce((result, plan) => {
      const region = zoneFor(plan.location);
      result[region] = (result[region] || 0) + 1;
      return result;
    }, {});
    return zoneOrder.filter((region) => counts[region]).map((region) => ({ name: region, count: counts[region] }));
  }, [catalog]);
  const visibleIdeas = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es');
    const filtered = catalog.filter((plan) =>
      (category === 'Todas' || plan.category === category)
      && (zone === 'Todas' || zoneFor(plan.location) === zone)
      && (budget === 'Todos' || budgetLevel(plan.budget) === budget)
      && (!normalizedSearch || `${plan.title} ${plan.location}`.toLocaleLowerCase('es').includes(normalizedSearch)),
    );
    const sorted = filtered.sort((a, b) => {
      const aRating = aggregateRating(ratings, a.id);
      const bRating = aggregateRating(ratings, b.id);
      switch (sortBy) {
        case 'top': return (bRating.count > 0) - (aRating.count > 0) || bRating.average - aRating.average || bRating.count - aRating.count || a.title.localeCompare(b.title, 'es');
        case 'most': return bRating.count - aRating.count || bRating.average - aRating.average || a.title.localeCompare(b.title, 'es');
        case 'cheap': return priceRank(a.budget) - priceRank(b.budget) || a.title.localeCompare(b.title, 'es');
        case 'expensive': return priceRank(b.budget) - priceRank(a.budget) || a.title.localeCompare(b.title, 'es');
        case 'alpha': return a.title.localeCompare(b.title, 'es');
        default: return (bRating.count > 0) - (aRating.count > 0) || bRating.average - aRating.average || a.title.localeCompare(b.title, 'es');
      }
    });
    return sorted.map((idea) => ({ ...idea, ...(planPhotos[idea.id] || {}), sourceImage: idea.image, image: planPhotos[idea.id]?.image || idea.image }));
  }, [catalog, category, zone, budget, search, sortBy, ratings, planPhotos]);

  const plansInPersonalSection = userPlans.filter((plan) => (plan.type === 'itinerary') === (personalSection === 'itineraries'));
  const editingPredefinedPlan = editing !== 'new' && userPlans.some((plan) => plan.id === editing && Boolean(plan.catalogId));
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
  const selectedDatePlans = calendarPlans.filter((plan) => localDateValue(new Date(plan.scheduledAt)) === selectedCalendarDate);
  const upcomingCalendarPlans = calendarPlans.filter((plan) => new Date(plan.scheduledAt) >= new Date()).slice(0, 2);
  const randomIdeaSaved = randomIdea && userPlans.some((plan) => plan.catalogId === randomIdea.id);
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
    const ideaToSave = Object.fromEntries(Object.entries(idea).filter(([key]) => !['backups', 'source', 'credit'].includes(key)));
    if (!firebaseConfigured) {
      setUserPlans((plans) => [{ ...ideaToSave, id: idea.id, catalogId: idea.id, status: 'pendiente', favorite: false, comment: '' }, ...plans]);
      setNotice('Idea guardada en Mis planes.');
      return;
    }
    perform(async () => {
      await savePlan(userId, { ...ideaToSave, catalogId: idea.id, status: 'pendiente', favorite: false, comment: '' });
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
    const normalized = { ...form, title: form.title.trim(), description: form.description.trim(), location: form.location.trim() };
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
    if (visibleIdeas.length) setRandomIdea(visibleIdeas[Math.floor(Math.random() * visibleIdeas.length)]);
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
      budget: itinerary.reduce((highest, idea) => priceRank(idea.budget) > priceRank(highest) ? idea.budget : highest, 'Gratis'),
      image: itinerary[0].image,
      type: 'itinerary',
      items: itinerary.map(({ id, title, location, category, budget, image }) => ({ id, title, location, category, budget, image })),
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

  if (firebaseRequested && !firebaseConfigured) return <main className="firebase-gate"><span className="welcome-tag">Por Hacer</span><h1>Revisa la configuración de Firebase</h1><p>VITE_USE_FIREBASE está activado, pero faltan variables de Firebase. Completa la configuración o desactiva la bandera para volver a la vista previa.</p><ol><li>Copia <code>.env.example</code> a <code>.env.local</code> en la raíz del proyecto.</li><li>Completa las variables VITE_FIREBASE_*.</li><li>Activa Authentication anónima, Firestore y Storage en Firebase Console.</li></ol></main>;

  return <div className="app-container">
    <header className="navbar">
      <button type="button" className="nav-brand" aria-label="Ir a Home" onClick={() => setActiveTab('home')}><span className="brand-badge">PH</span><h1>Por Hacer</h1></button>
      <nav><ul className="nav-links">
        <li><button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Inicio</button></li>
        <li><button className={`nav-btn ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>Mis planes</button></li>
        <li><button className={`nav-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendario</button></li>
        <li><button className={`nav-btn ${activeTab === 'bitacora' ? 'active' : ''}`} onClick={() => setActiveTab('bitacora')}>Recuerdos</button></li>
      </ul></nav>
      <button className="btn btn-primary" onClick={openCreate}>+ Crear plan</button>
    </header>

    <main className="main-content">
      {!firebaseConfigured && <div className="preview-banner" role="status"><strong>Vista previa local</strong><span>Los planes y valoraciones se guardan solo en este navegador. Activa Firebase cuando quieras conectar Firestore.</span></div>}
      {error && <div className="app-alert error" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Cerrar mensaje">×</button></div>}
      {notice && <div className="app-alert success" role="status">{notice}</div>}
      {loading && <div className="loading-message" role="status">Cargando tus planes…</div>}

      {activeTab === 'home' && <section>
        <div className="main-welcome-hero"><img src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2200&q=85" alt="Amigos compartiendo una salida" onError={imageFallback} /><div className="welcome-text"><span className="welcome-tag">Ideas para hacer lugar a momentos</span><h2>¿Qué te gustaría descubrir?</h2><p>Explora planes, guárdalos y deja tu valoración cuando los hayas vivido.</p><a className="btn btn-primary" href="#discover-plans">Descubrir planes</a></div></div>
        <div className="idea-tools-panel"><div className="idea-tools-heading"><h2>¿No sabes qué elegir?</h2><p>Encuentra una idea al azar o arma un itinerario para compartir el día.</p></div><div className="idea-tools"><div className={`idea-tool ${randomIdea ? 'idea-tool-with-result' : ''}`}><div><h3>Un plan al azar</h3><p>Deja que una idea te sorprenda.</p>{randomIdea && <div className="random-plan-result"><img src={randomIdea.image} alt={randomIdea.title} onError={(event) => ideaImageFallback(event, randomIdea)} /><div><p className="tool-result"><strong>{randomIdea.title}</strong><br />{randomIdea.address || randomIdea.location}</p><button type="button" className="btn btn-link" onClick={() => setSelectedIdea(randomIdea)}>Ver detalles</button></div></div>}</div><button className="btn btn-secondary" onClick={suggestIdea}>Sugerir un plan</button>{randomIdea && <button className={`btn ${randomIdeaSaved ? 'btn-saved' : 'btn-primary'}`} onClick={() => addIdea(randomIdea)} disabled={busy || randomIdeaSaved}>{randomIdeaSaved ? 'Idea guardada' : 'Guardar idea'}</button>}</div><div className="idea-tool"><div><h3>Arma un itinerario</h3><p>Combina dos propuestas para compartir el día.</p></div><select aria-label="Compañía para el itinerario" value={itineraryCompany} onChange={(event) => setItineraryCompany(event.target.value)}><option>Todas</option><option>Solo</option><option>Para conocer gente</option><option>Con amigos</option></select><button className="btn btn-secondary" onClick={makeItinerary}>Generar itinerario</button>{itinerary.length > 0 && <><ul className="itinerary-list">{itinerary.map((idea) => <li key={idea.id}><strong>{idea.title}</strong><span>{idea.location}</span></li>)}</ul><button className={`btn ${itinerarySaved ? 'btn-saved' : 'btn-primary'}`} onClick={addItinerary} disabled={busy || itinerarySaved}>{itinerarySaved ? 'Itinerario guardado' : 'Guardar itinerario'}</button></>}</div></div></div>
        <div className="section-header" id="discover-plans"><h2>Descubrir planes</h2><p>{catalog.length} ideas con ubicaciones, categorías y presupuestos diversos.</p></div>
        <div className="category-filter" role="group" aria-label="Filtrar por categoría">{categories.map((item) => <button key={item} type="button" className={`category-filter-btn ${category === item ? 'active' : ''}`} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="filter-bar discovery-filters">
          <input aria-label="Buscar por nombre o ubicación" type="search" placeholder="Buscar plan o lugar…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Filtrar por zona" value={zone} onChange={(event) => setZone(event.target.value)}><option value="Todas">Todas las zonas</option>{zones.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>
          <select aria-label="Filtrar por presupuesto" value={budget} onChange={(event) => setBudget(event.target.value)}><option value="Todos">Todos los presupuestos</option><option value="Bajo">Bajo</option><option value="Medio">Medio</option><option value="Alto">Alto</option></select>
          <select aria-label="Ordenar planes" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="recommended">Recomendados</option><option value="top">Mejor puntuados</option><option value="most">Más valorados</option><option value="cheap">Menor presupuesto</option><option value="expensive">Mayor presupuesto</option><option value="alpha">Alfabéticamente</option></select>
        </div>
        
        {!loading && visibleIdeas.length === 0 ? <div className="empty-state"><h3>No encontramos planes con esos filtros</h3><p>Prueba otra búsqueda o limpia alguno de los filtros.</p><button className="btn btn-secondary" onClick={() => { setSearch(''); setCategory('Todas'); setZone('Todas'); setBudget('Todos'); }}>Limpiar filtros</button></div> : <div className="cards-grid">{visibleIdeas.slice(0, visibleIdeasCount).map((idea) => {
          const aggregate = aggregateRating(ratings, idea.id);
          const added = userPlans.some((plan) => plan.catalogId === idea.id);
          const savedPlan = userPlans.find((plan) => plan.catalogId === idea.id);
          return <article className="plan-card" key={idea.id}><div className="card-img-wrapper plan-card-image-trigger" role="button" tabIndex={0} aria-label={`Ver detalles de ${idea.title}`} onClick={() => setSelectedIdea(idea)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedIdea(idea); } }}><img src={idea.image} alt={idea.title} className="card-img" loading="lazy" onError={(event) => ideaImageFallback(event, idea)} /></div><div className="card-content"><div className="card-meta"><span className={`badge badge-${idea.category.toLowerCase().replace(' ', '')}`}>{idea.category}</span><span className="budget-badge">{priceLabel(idea.budget)}</span></div><h3 className="card-title plan-card-title-trigger" onClick={() => setSelectedIdea(idea)}>{idea.title}</h3><p className="card-desc">{idea.description}</p>{idea.credit && <a className="photo-credit" href={idea.source} target="_blank" rel="noreferrer">Foto: {idea.credit}</a>}<div className="rating-summary"><Stars value={aggregate.average} /><span>{aggregate.count ? `${aggregate.average.toFixed(1)} · ${aggregate.count} ${aggregate.count === 1 ? 'valoración' : 'valoraciones'}` : 'Sin valoraciones'}</span></div><div className="card-info-row"><span>⌖ {idea.address || idea.location}</span></div><div className="card-footer plan-card-actions"><button className="btn btn-secondary" onClick={() => setSelectedIdea(idea)}>Ver detalles</button><button className={`btn ${added ? 'btn-secondary' : 'btn-primary'}`} onClick={() => added ? openSavedPlan(savedPlan.id) : addIdea(idea)} disabled={busy}>{added ? 'En mis planes' : '+ Agregar a mis planes'}</button></div></div></article>;
        })}</div>}{visibleIdeas.length > visibleIdeasCount && <div className="discovery-show-more"><button type="button" className="btn btn-secondary" onClick={() => setVisibleIdeasCount((count) => count + 6)}>Ver más</button></div>}
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
          return <article id={`saved-plan-${plan.id}`} className={`plan-card ${plan.id === focusPlanId ? 'plan-card-focused' : ''}`} key={plan.id}><div className="card-img-wrapper"><img className="card-img" src={displayPlanImage(plan)} alt={plan.title} loading="lazy" onError={(event) => planPhotoFallback(event, plan, planPhotos)} /><button type="button" className="plan-edit-action" onClick={() => openEdit(plan)} aria-label="Editar plan" title="Editar plan" /><button className={`fav-btn ${plan.favorite ? 'is-favorite' : ''}`} aria-label={plan.favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'} onClick={() => toggleFavorite(plan)}>{plan.favorite ? '♥' : '♡'}</button><button type="button" className="btn btn-danger saved-plan-delete" onClick={() => deletePlan(plan)} disabled={busy}>Eliminar</button></div><div className="card-content"><div className="card-meta"><span className={`badge badge-${(plan.category || 'varios').toLowerCase().replace(' ', '')}`}>{plan.category}</span><span className={`status-label ${plan.status === 'realizado' ? 'done' : ''}`}>{plan.status === 'realizado' ? 'Realizado' : 'Pendiente'}</span></div><h3 className="card-title">{plan.title}</h3><p className="card-desc">{plan.description}</p>{plan.type === 'itinerary' && <ul className="itinerary-plan-items">{(plan.items || []).map((item) => <li key={item.id}><img src={item.image && !item.image.includes('picsum.photos') ? item.image : catalogImages.get(item.id) || categoryImages[item.category] || '/images/plan-placeholder.svg'} alt={item.title} loading="lazy" onError={imageFallback} /><div><strong>{item.title}</strong><span>{item.location}</span></div></li>)}</ul>}<div className="card-info-row"><span>⌖ {plan.type === 'itinerary' ? plan.location : catalogRecords.get(plan.catalogId)?.address || plan.location}</span><span>{priceLabel(plan.budget)}</span></div>
            <div className="rating-summary"><span>Puntuación general</span><Stars value={aggregate.average} /><span>{aggregate.count ? `${aggregate.average.toFixed(1)} (${aggregate.count})` : 'Sin valoraciones'}</span></div>
            {activeTab === 'plans' && <div className="card-footer plan-actions"><div className="plan-primary-actions"><button className="btn btn-secondary" onClick={() => { const catalogRecord = catalogRecords.get(plan.catalogId); setSelectedIdea({ ...catalogRecord, ...plan, address: catalogRecord?.address || plan.location, openingHours: catalogRecord?.openingHours, duration: catalogRecord?.duration, visitTips: catalogRecord?.visitTips, officialUrl: catalogRecord?.officialUrl, image: displayPlanImage(plan), isSavedPlan: true }); }}>Ver detalles</button><button type="button" className={`btn plan-calendar-action ${plan.scheduledAt ? 'is-scheduled' : ''}`} onClick={() => openSchedule(plan)} aria-label={plan.scheduledAt ? 'Cambiar fecha del calendario' : 'Agregar a calendario'} title={plan.scheduledAt ? 'Cambiar fecha del calendario' : 'Agregar a calendario'}>{plan.scheduledAt ? 'Cambiar fecha' : 'Agregar a calendario'}</button></div><button className={`btn plan-status-action ${plan.status === 'realizado' ? 'btn-status-done' : 'btn-secondary'}`} onClick={() => toggleStatus(plan)} disabled={busy}>{plan.status === 'realizado' ? 'Marcar pendiente' : 'Realizado'}</button></div>}
          </div></article>;
        })}</div>}
      </section>}

      {activeTab === 'calendar' && <section className="calendar-section">
        <div className="section-header"><h2>Calendario</h2><p>Organiza tus planes y consulta lo que tienes programado.</p></div>
        <div className="calendar-toolbar"><button type="button" className="btn btn-secondary" aria-label="Mes anterior" onClick={() => changeCalendarMonth(-1)}>‹</button><h3>{calendarMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</h3><button type="button" className="btn btn-secondary" aria-label="Mes siguiente" onClick={() => changeCalendarMonth(1)}>›</button><button type="button" className="btn btn-secondary calendar-today" onClick={() => { const today = new Date(); setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedCalendarDate(localDateValue(today)); }}>Hoy</button></div>
        <div className="calendar-grid" role="grid" aria-label="Calendario mensual">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <div className="calendar-weekday" role="columnheader" key={day}>{day}</div>)}{calendarDays.map((day) => {
          const dayKey = localDateValue(day);
          const dayPlans = calendarPlans.filter((plan) => localDateValue(new Date(plan.scheduledAt)) === dayKey);
          const inMonth = day.getMonth() === calendarMonth.getMonth();
          return <button type="button" role="gridcell" key={dayKey} className={`calendar-day ${inMonth ? '' : 'outside-month'} ${selectedCalendarDate === dayKey ? 'selected' : ''} ${dayPlans.length ? 'has-events' : ''}`} aria-label={`${day.toLocaleDateString('es-AR')} · ${dayPlans.length} planes`} aria-pressed={selectedCalendarDate === dayKey} onClick={() => setSelectedCalendarDate(dayKey)}><span className="calendar-day-number">{day.getDate()}</span>{dayPlans.slice(0, 2).map((plan) => <span className="calendar-day-event" key={plan.id}>{plan.title}</span>)}{dayPlans.length > 2 && <span className="calendar-more-events">+{dayPlans.length - 2} más</span>}</button>;
        })}</div>
        <div className="calendar-agenda"><div className="calendar-agenda-heading"><h3>{new Date(`${selectedCalendarDate}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3><span>{selectedDatePlans.length} {selectedDatePlans.length === 1 ? 'plan' : 'planes'}</span></div>{selectedDatePlans.length === 0 ? <div className="empty-state calendar-empty"><h3>No tienes planes para este día</h3><p>Agrega una fecha desde una tarjeta en Mis planes.</p><button className="btn btn-primary" onClick={() => setActiveTab('plans')}>Ir a Mis planes</button></div> : <div className="calendar-agenda-list">{selectedDatePlans.map((plan) => <article className="calendar-event-card" key={plan.id}><img src={displayPlanImage(plan)} alt={plan.title} onError={(event) => planPhotoFallback(event, plan, planPhotos)} /><div className="calendar-event-info"><span className="calendar-event-time">{new Date(plan.scheduledAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span><h4>{plan.title}</h4><p>{plan.location}</p></div><button className="btn btn-secondary" onClick={() => { const catalogRecord = catalogRecords.get(plan.catalogId); setSelectedIdea({ ...catalogRecord, ...plan, address: catalogRecord?.address || plan.location, openingHours: catalogRecord?.openingHours, duration: catalogRecord?.duration, visitTips: catalogRecord?.visitTips, officialUrl: catalogRecord?.officialUrl, image: displayPlanImage(plan), isSavedPlan: true }); }}>Ver detalles</button></article>)}</div>}</div>
      </section>}

      {activeTab === 'bitacora' && <section><div className="section-header"><h2>Bitácora y recuerdos</h2><p>{completedCount} experiencias realizadas</p></div>{completedCount === 0 ? <div className="empty-state"><h3>Aún no hay experiencias realizadas</h3><p>Cuando completes un plan, aparecerá aquí.</p></div> : <div className="cards-grid">{userPlans.filter((plan) => plan.status === 'realizado').map((plan) => <article className="photo-card" key={plan.id}><div className="photo-wrapper"><img src={displayPlanImage(plan)} alt={plan.title} onError={(event) => planPhotoFallback(event, plan, planPhotos)} /><span className="photo-badge">{plan.category}</span></div><div className="photo-details"><h3>{plan.title}</h3><p>{plan.location} · {plan.photoDate || 'Reciente'}</p><label className="comment-label">Tu recuerdo<textarea rows="3" placeholder="Escribe un recuerdo de este día…" defaultValue={plan.comment || ''} onBlur={(event) => { if (event.target.value !== (plan.comment || '')) updateComment(plan, event.target.value); }} /></label><label className="btn btn-secondary photo-upload">Cambiar fotografía<input type="file" accept="image/*" onChange={(event) => changePlanPhoto(plan, event.target.files?.[0])} /></label><div className="personal-rating"><strong>Mi puntuación</strong><Stars value={plan.rating || 0} interactive disabled={busy} onChange={(value) => ratePlan(plan, value)} /></div></div></article>)}</div>}</section>}
    </main>

    {schedulePlan && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSchedulePlan(null); }}><section className="modal-content schedule-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title"><div className="modal-header"><h2 id="schedule-modal-title">Agregar al calendario</h2><button type="button" className="modal-close" onClick={() => setSchedulePlan(null)} aria-label="Cerrar">×</button></div><p className="schedule-plan-title">{schedulePlan.title}</p><form onSubmit={saveSchedule}><label className="form-group">Fecha<input type="date" required value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} /></label><label className="form-group">Hora<input type="time" required value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} /></label><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setSchedulePlan(null)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={busy}>Guardar en calendario</button></div></form></section></div>}

    {selectedIdea && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedIdea(null); }}><section className="modal-content plan-detail-modal" role="dialog" aria-modal="true" aria-labelledby="plan-detail-title"><div className="modal-header"><div><span className={`badge badge-${(selectedIdea.category || 'varios').toLowerCase().replace(' ', '')}`}>{selectedIdea.category || 'Itinerario'}</span><h2 id="plan-detail-title">{selectedIdea.title}</h2></div><button className="modal-close" onClick={() => setSelectedIdea(null)} aria-label="Cerrar detalles">×</button></div><img className="plan-detail-image" src={selectedIdea.image || planImage(selectedIdea)} alt={selectedIdea.title} onError={imageFallback} /><p className="plan-detail-description">{selectedIdea.description}</p><dl className="plan-detail-facts"><div><dt>{selectedIdea.type === 'itinerary' ? 'Ciudad o zona' : 'Dirección o zona'}</dt><dd>{selectedIdea.address || selectedIdea.location}</dd></div>{selectedIdea.type === 'itinerary' && <div><dt>Planes incluidos</dt><dd><ul className="detail-itinerary-items">{(selectedIdea.items || []).map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.location}</span></li>)}</ul></dd></div>}<div><dt>Horario</dt><dd>{selectedIdea.openingHours || 'Consultá el horario actualizado antes de ir.'}</dd></div><div><dt>Duración sugerida</dt><dd>{selectedIdea.duration || 'Entre 1 y 2 horas'}</dd></div><div><dt>Presupuesto estimado</dt><dd>{priceLabel(selectedIdea.budget)} · puede variar según consumos, entradas y temporada.</dd></div>{selectedIdea.visitTips && <div><dt>Para tener en cuenta</dt><dd>{selectedIdea.visitTips}</dd></div>}</dl><div className="modal-actions"><a className="btn btn-secondary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedIdea.title} ${selectedIdea.address || selectedIdea.location}`)}`} target="_blank" rel="noreferrer">Ver ubicación en Maps</a>{selectedIdea.officialUrl && <a className="btn btn-secondary" href={selectedIdea.officialUrl} target="_blank" rel="noreferrer">Sitio oficial</a>}{!selectedIdea.isSavedPlan && <button className="btn btn-primary" onClick={() => { const idea = selectedIdea; setSelectedIdea(null); addIdea(idea); }} disabled={userPlans.some((plan) => plan.catalogId === selectedIdea.id) || busy}>{userPlans.some((plan) => plan.catalogId === selectedIdea.id) ? 'En mis planes' : 'Agregar a mis planes'}</button>}</div></section></div>}

    {editing && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><div className="modal-content"><div className="modal-header"><h2>{editing === 'new' ? 'Crear plan' : 'Editar plan'}</h2><button className="modal-close" onClick={() => setEditing(null)} aria-label="Cerrar">×</button></div><form onSubmit={submitPlan}><label className="form-group">Nombre<input required maxLength="100" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>{editingPredefinedPlan && <p className="form-hint">En los planes predeterminados solo puedes cambiar el nombre.</p>}{!editingPredefinedPlan && <><label className="form-group">Descripción<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="form-group">Ubicación<input required maxLength="100" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label className="form-group">Categoría<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-group">Presupuesto<select value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })}><option value="$">Bajo</option><option value="$$">Medio</option><option value="$$$">Alto</option></select></label>{editing === 'new' && <label className="form-group">URL de imagen<input type="url" placeholder="https://…" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></label>}</>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={busy}>Guardar</button></div></form></div></div>}
  </div>;
}
