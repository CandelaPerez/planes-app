export const categoryIllustrations = {
  'Gastronomía': '/images/ba-data/gastronomia.svg',
  Cultura: '/images/ba-data/cultura.svg',
  'Aire Libre': '/images/ba-data/aire-libre.svg',
  Viajes: '/images/ba-data/viajes.svg',
};

const validUrl = (value) => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

export function placeImage(place) {
  const image = place.photoUrl || place.imageUrl;
  const source = place.photoSourceUrl || place.imageSourceUrl;
  if (validUrl(image) && validUrl(source)) return { image, imageKind: 'photograph', imageSourceUrl: source };
  return { image: categoryIllustrations[place.category] || '/images/plan-placeholder.svg', imageKind: 'illustration' };
}

// Preserve every record and the existing order within equally complete groups.
// Round-robin avoids alphabetical bus-stop names dominating the first page.
export function variedBaDataOrder(plans) {
  if (!plans.length || !plans.every((plan) => plan.sourceName)) return plans;
  const groups = new Map(Object.keys(categoryIllustrations).map((category) => [category, []]));
  for (const plan of plans) {
    if (!groups.has(plan.category)) groups.set(plan.category, []);
    groups.get(plan.category).push(plan);
  }
  const completeness = (plan) => Number(Boolean(plan.title?.trim())) + Number(Boolean(plan.address?.trim()));
  const queues = [...groups.values()].map((group) => group.sort((a, b) => completeness(b) - completeness(a) || (a.pilotOrder ?? Infinity) - (b.pilotOrder ?? Infinity)));
  const result = [];
  for (let index = 0; result.length < plans.length; index += 1) {
    for (const queue of queues) if (queue[index]) result.push(queue[index]);
  }
  return result;
}
