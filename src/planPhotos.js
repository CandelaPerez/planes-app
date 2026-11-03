const PHOTO_SEARCHES = [
  { key: 'food', query: 'filetype:bitmap (food OR cafe OR coffee OR restaurant OR pastry) photograph' },
  { key: 'outdoors', query: 'filetype:bitmap (park OR garden OR nature OR flowers OR beach OR waterfall) photograph' },
  { key: 'culture', query: 'filetype:bitmap (museum OR art OR gallery OR books OR music OR pottery) photograph' },
  { key: 'travel', query: 'filetype:bitmap (travel OR mountain OR city OR landmark OR landscape) photograph' },
];

function searchKey(idea) {
  const category = String(idea.category || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (category.includes('gastronomia')) return 'food';
  if (category.includes('aire libre')) return 'outdoors';
  if (category.includes('cultura')) return 'culture';
  return 'travel';
}

async function fetchPhotoSet({ key, query }) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '500',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|sha1',
    iiurlwidth: '1200',
    format: 'json',
    origin: '*',
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!response.ok) throw new Error(`No se pudieron buscar fotos de ${key}.`);
  const data = await response.json();
  return Object.values(data.query?.pages || []).flatMap((page) => {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl || !/^image\/(jpeg|png|webp)$/i.test(info.mime || '')) return [];
    const metadata = info.extmetadata || {};
    const author = String(metadata.Artist?.value || 'Wikimedia Commons').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#0*39;/g, "'").trim();
    return [{
      id: info.sha1 || String(page.pageid),
      image: info.thumburl,
      source: `https://commons.wikimedia.org/?curid=${page.pageid}`,
      credit: `${author} · ${metadata.LicenseShortName?.value || 'Wikimedia Commons'}`,
    }];
  });
}

export async function fetchDistinctPlanPhotos(ideas, excludedPhotoIds = []) {
  const photoSets = await Promise.all(PHOTO_SEARCHES.map(async (search) => {
    try { return await fetchPhotoSet(search); } catch { return []; }
  }));
  const uniquePhotos = new Map();
  photoSets.flat().forEach((photo) => {
    if (!excludedPhotoIds.includes(photo.id) && !uniquePhotos.has(photo.id)) uniquePhotos.set(photo.id, photo);
  });
  ideas.forEach((idea) => {
    const image = String(idea.image || '').split(/[?#]/)[0];
    if (!image) return;
    const id = `catalog:${image}`;
    if (!excludedPhotoIds.includes(id) && !uniquePhotos.has(id)) {
      uniquePhotos.set(id, { id, image: idea.image, source: 'https://unsplash.com/license', credit: 'Unsplash' });
    }
  });
  const photosByTopic = new Map(PHOTO_SEARCHES.map(({ key }) => [
    key,
    photoSets[PHOTO_SEARCHES.findIndex((search) => search.key === key)]
      .filter((photo, index, list) => list.findIndex((candidate) => candidate.id === photo.id) === index),
  ]));
  const unusedPhotos = [...uniquePhotos.values()];
  const assignments = {};

  ideas.forEach((idea) => {
    const topicPhotos = photosByTopic.get(searchKey(idea)) || [];
    let photo = topicPhotos.find((candidate) => unusedPhotos.some((unused) => unused.id === candidate.id));
    if (!photo) photo = unusedPhotos[0];
    if (!photo) throw new Error('No se encontraron suficientes fotos distintas para los planes.');
    const usedIndex = unusedPhotos.findIndex((candidate) => candidate.id === photo.id);
    unusedPhotos.splice(usedIndex, 1);
    const backups = [];
    for (let index = 0; index < 2 && unusedPhotos.length; index += 1) {
      const nextTopicPhoto = topicPhotos.find((candidate) => unusedPhotos.some((unused) => unused.id === candidate.id));
      const fallbackPhoto = nextTopicPhoto || unusedPhotos[0];
      backups.push(fallbackPhoto);
      unusedPhotos.splice(unusedPhotos.findIndex((candidate) => candidate.id === fallbackPhoto.id), 1);
    }
    assignments[idea.id] = { ...photo, backups };
  });

  return assignments;
}
