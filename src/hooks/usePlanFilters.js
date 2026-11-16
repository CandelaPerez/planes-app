import { useMemo } from 'react';
import { zoneOrder } from '../data/catalog';
import { variedBaDataOrder } from '../utils/baDataPresentation.js';
import { aggregateRating, budgetLevel, priceRank, zoneFor } from '../utils/planUtils';
import { discoveryOptions, matchesDiscoveryFilters } from '../utils/discoveryFilters.js';

const categoryKey = (value = '') => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');

export default function usePlanFilters({ catalog, category, zone, budget = 'Todos', placeType, search, sortBy, ratings, planPhotos }) {
  // Legacy callers retain their regional/budget filters. Discovery explicitly
  // opts into published neighborhoods and place types with placeType.
  const discovery = placeType !== undefined;
  const { zones, placeTypes } = useMemo(() => {
    if (discovery) return discoveryOptions(catalog);
    const counts = catalog.reduce((result, plan) => {
      const region = zoneFor(plan.location, plan.ambaZone);
      result[region] = (result[region] || 0) + 1;
      return result;
    }, {});
    return { zones: zoneOrder.filter((region) => counts[region]).map((region) => ({ name: region, count: counts[region] })), placeTypes: [] };
  }, [catalog, discovery]);
  const visibleIdeas = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es');
    const filtered = catalog.filter((plan) => discovery
      ? matchesDiscoveryFilters(plan, { category, zone, placeType, search })
      :
      (category === 'Todas' || categoryKey(plan.category) === categoryKey(category))
      && (zone === 'Todas' || zoneFor(plan.location, plan.ambaZone) === zone)
      && (budget === 'Todos' || budgetLevel(plan.budget) === budget)
      && (!normalizedSearch || `${plan.title} ${plan.originalName || ''} ${plan.location} ${plan.address || ''} ${plan.category} ${plan.subtype || ''} ${plan.ambaZone || ''}`.toLocaleLowerCase('es').includes(normalizedSearch)),
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
        case 'alpha-desc': return b.title.localeCompare(a.title, 'es');
        default: return (bRating.count > 0) - (aRating.count > 0) || bRating.average - aRating.average || a.title.localeCompare(b.title, 'es');
      }
    });
    const ordered = (discovery && !sortBy) || sortBy === 'recommended' ? variedBaDataOrder(sorted) : sorted;
    return ordered.map((idea) => ({ ...idea, ...(!idea.sourceName ? planPhotos[idea.id] || {} : {}), sourceImage: idea.image, image: !idea.sourceName && planPhotos[idea.id]?.image || idea.image }));
  }, [catalog, category, zone, budget, placeType, search, sortBy, ratings, planPhotos, discovery]);
  return { zones, placeTypes, visibleIdeas };
}
