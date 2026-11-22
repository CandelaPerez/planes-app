import { hasPlanCoordinates } from './planCoordinates.js';

const radians = (degrees) => degrees * Math.PI / 180;

export function distanceKm(from, to) {
  const lat = radians(to.lat - from.lat);
  const lon = radians(to.lon - from.lon);
  const a = Math.sin(lat / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export function rankNearbyPlans(catalog, reference) {
  const seen = new Set();
  return catalog.flatMap((plan) => {
    if (!hasPlanCoordinates(plan) || seen.has(plan.id)) return [];
    seen.add(plan.id);
    return [{ plan, distance: distanceKm(reference, plan) }];
  }).sort((a, b) => a.distance - b.distance || a.plan.id.localeCompare(b.plan.id)).slice(0, 12);
}
