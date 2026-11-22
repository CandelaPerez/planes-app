export function hasPlanCoordinates(plan) {
  if (!plan || plan.type === 'itinerary') return false;

  const { lat, lon } = plan;
  return Number.isFinite(lat) && Math.abs(lat) <= 90
    && Number.isFinite(lon) && Math.abs(lon) <= 180
    && (lat !== 0 || lon !== 0);
}
