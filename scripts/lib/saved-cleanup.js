import { LEGACY_CATALOG_IDS, savedCatalogId, savedPlanKind } from '../../src/utils/savedPlans.js';

export function cleanupDecision(plan, currentIds) {
  const kind = savedPlanKind(plan);
  const catalogId = savedCatalogId(plan);
  if (kind === 'itinerary' || kind === 'custom') return { action: 'keep', reason: kind, catalogId };
  if (currentIds.has(catalogId)) return { action: 'keep', reason: 'current-catalog', catalogId };
  // A flag or a similar name is not sufficient evidence for permanent deletion.
  if (!LEGACY_CATALOG_IDS.has(catalogId)) return {
    action: kind === 'current-catalog' || plan.isCatalog ? 'review' : 'keep',
    reason: kind === 'current-catalog' ? 'retired-modern-catalog' : 'unconfirmed-origin', catalogId,
  };
  const personal = [];
  for (const key of Object.keys(plan)) {
    if (['id', 'catalogId', 'externalId', 'title', 'description', 'location', 'category', 'budget',
      'company', 'image', 'status', 'favorite', 'comment', 'rating', 'scheduledAt', 'photoDate',
      'userTitle', 'isCatalog', 'savedOrigin', 'createdAt', 'updatedAt', 'address', 'duration',
      'openingHours', 'officialUrl', 'visitTips', 'originalName', 'sourceName', 'sourceUrl',
      'sourceLicense', 'photograph', 'imageKind', 'imageSourceUrl', 'lat', 'lon'].includes(key)) continue;
    if (plan[key] !== null && plan[key] !== undefined && plan[key] !== '') personal.push(`unreviewed-field:${key}`);
  }
  if (plan.status && plan.status !== 'pendiente') personal.push('status');
  for (const key of ['comment', 'rating', 'scheduledAt', 'photoDate', 'userTitle']) {
    if (plan[key] !== null && plan[key] !== undefined && plan[key] !== '') personal.push(key);
  }
  // Only an exact original image is safe to discard. Any other image needs review.
  if (plan.image && plan.image !== plan.originalCatalogImage) personal.push('image-needs-comparison');
  return { action: personal.length ? 'review' : 'candidate', reason: 'confirmed-legacy-absent', catalogId, personal };
}

function references(value, ids, trail = '', found = []) {
  if (!value || typeof value !== 'object') return found;
  for (const [key, child] of Object.entries(value)) {
    const path = trail ? `${trail}.${key}` : key;
    if (['id', 'catalogId', 'externalId', 'planId', 'savedPlanId'].includes(key) && ids.has(child)) found.push(path);
    if (child && typeof child === 'object') references(child, ids, path, found);
  }
  return found;
}

export function cleanupReport(records, catalog, { ratings = [], originalImages = new Map(), source = 'fixture' } = {}) {
  if (!catalog.length || new Set(catalog.map(p => p.id)).size !== catalog.length) throw Error('Invalid current catalog');
  const currentIds = new Set(catalog.map(p => p.id));
  const entries = records.map(record => {
    const plan = record.data;
    const decision = cleanupDecision(plan, currentIds);
    const documentId = record.path.split('/').at(-1);
    if (currentIds.has(documentId)) {
      decision.action = 'keep';
      decision.reason = 'current-document-id';
    } else if (LEGACY_CATALOG_IDS.has(documentId) && decision.catalogId && documentId !== decision.catalogId
      && decision.action === 'candidate') {
      decision.action = 'review';
      decision.personal.push('conflicting-document-id');
    }
    if (decision.personal?.includes('image-needs-comparison') && originalImages.get(savedCatalogId(plan)) === plan.image) {
      decision.personal = decision.personal.filter(p => p !== 'image-needs-comparison');
      if (decision.reason === 'confirmed-legacy-absent') decision.action = decision.personal.length ? 'review' : 'candidate';
    }
    const refs = [];
    if (decision.reason === 'confirmed-legacy-absent' || decision.reason === 'retired-modern-catalog') {
      const ids = new Set([plan.id, decision.catalogId, record.path.split('/').at(-1)].filter(Boolean));
      for (const other of records) {
        if (other.uid === record.uid && other.path !== record.path) {
          const fields = references(other.data, ids);
          if (fields.length) refs.push({ path: other.path, fields });
        }
      }
      for (const rating of ratings) {
        const parts = rating.path.split('/');
        if ((rating.data.userId === record.uid || parts.at(-1) === record.uid || parts[1] === record.uid)
          && (parts.some(part => ids.has(part)) || references(rating.data, ids).length)) refs.push({ path: rating.path, fields: ['rating'] });
      }
      if (record.subcollections?.length) refs.push({ path: record.path, fields: record.subcollections.map(s => `subcollection:${s}`) });
      if (refs.length) decision.action = 'review';
    }
    return { path: record.path, uid: record.uid, documentId: record.path.split('/').at(-1),
      title: plan.title || '', ...decision, references: refs, updateTime: record.updateTime || null };
  });
  return { version: 1, mode: 'dry-run', source, createdAt: new Date().toISOString(),
    currentCatalogIds: [...currentIds].sort(),
    totals: { scanned: entries.length, accounts: new Set(records.map(r => r.uid)).size,
      confirmedLegacy: entries.filter(e => e.reason === 'confirmed-legacy-absent').length,
      candidates: entries.filter(e => e.action === 'candidate').length,
      review: entries.filter(e => e.action === 'review').length,
      kept: entries.filter(e => e.action === 'keep').length, deleted: 0 }, entries };
}
