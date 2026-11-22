import { catalogImages } from '../data/catalog';

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
function zoneFor(location, ambaZone = '') {
  if (ambaZone) return ambaZone;
  const place = location.toLocaleLowerCase('es');
  const normalizedPlace = place.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (place.includes('uruguay') || place.includes('colonia')) return 'Internacional';
  if (['tigre', 'san isidro', 'vicente lopez', 'olivos', 'san fernando', 'pilar', 'escobar', 'malvinas argentinas', 'san miguel'].some((name) => normalizedPlace.includes(name))) return 'Zona Norte';
  if (['moron', 'ituzaingo', 'hurlingham', 'merlo', 'ramos mejia', 'haedo', 'castelar', 'la matanza', 'tres de febrero'].some((name) => normalizedPlace.includes(name))) return 'Zona Oeste';
  if (['lomas de zamora', 'lanus', 'quilmes', 'avellaneda', 'banfield', 'temperley', 'berazategui', 'ezeiza', 'adrogue', 'almirante brown'].some((name) => normalizedPlace.includes(name))) return 'Zona Sur';
  if (place.includes('tandil') || place.includes('mar del plata')) return 'Interior de Buenos Aires';
  if (place.includes('córdoba') || place.includes('mendoza') || place.includes('valle de uco')) return 'Centro y Cuyo';
  if (place.includes('iguazú') || place.includes('misiones')) return 'Litoral y Norte';
  if (place.includes('bariloche') || place.includes('río negro')) return 'Patagonia';
  if (place.includes('ciudad de buenos aires') || place.includes('caba') || ['palermo', 'san telmo', 'recoleta', 'caballito', 'villa crespo', 'puerto madero', 'san nicolas', 'belgrano', 'chacarita', 'almagro', 'la boca', 'costanera', 'rosedal', 'parque centenario'].some((name) => normalizedPlace.includes(name))) return 'CABA';
  return 'CABA';
}
const priceRank = (budget) => ({ Gratis: 0, '$': 1, Bajo: 1, '$$': 2, Medio: 2, '$$$': 3, Alto: 3 }[budget] ?? 4);
const priceLabel = (budget) => !budget || budget.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLocaleLowerCase('es') === 'sin informacion' ? null : budget === 'Gratis' ? 'Gratis' : budget === '$' ? '$ Bajo' : budget === '$$' ? '$$ Medio' : budget === '$$$' ? '$$$ Alto' : budget;
const categoryClass = (category = 'varios') => category.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, '');
const budgetLevel = (budget) => !budget || budget.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es') === 'sin informacion' ? 'Sin información' : priceRank(budget) <= 1 ? 'Bajo' : priceRank(budget) === 2 ? 'Medio' : priceRank(budget) === 3 ? 'Alto' : 'Sin información';
const ratingDescriptions = ['No me gustó', 'Estuvo bien, pero no fue lo que esperaba', 'Estuvo bien', 'Me gustó mucho', 'Fue una experiencia excelente'];
const aggregateRating = (ratings, planId) => {
  const values = ratings.filter((rating) => rating.planId === planId).map((rating) => Number(rating.value)).filter((value) => value >= 1 && value <= 5);
  return { count: values.length, average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0 };
};
function ideaImageFallback(event, idea) {
  const image = event.currentTarget;
  if (idea.sourceName) {
    image.onerror = null;
    image.hidden = true;
    const credit = image.closest('.plan-card, .modal-content')?.querySelector('[data-photo-credit]');
    if (credit) credit.textContent = 'No se pudo cargar la fotografía verificada.';
    return;
  }
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
  if (plan.sourceName) { ideaImageFallback(event, plan); return; }
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
  return Array.isArray(saved) ? saved : [];
}

function imageFallback(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = '/images/plan-placeholder.svg';
}

export { cityFor, zoneFor, priceRank, priceLabel, categoryClass, budgetLevel, ratingDescriptions, aggregateRating, ideaImageFallback, planPhotoFallback, localDateValue, readLocalJson, loadPreviewPlans, imageFallback };

export function visiblePlanDescription(plan) {
  return plan.sourceName ? plan.description?.replace('Tipo publicado:', 'Tipo de lugar:') : plan.description;
}
