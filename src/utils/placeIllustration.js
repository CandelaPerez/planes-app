// Decorative category artwork, never a depiction of a specific establishment.
export function placeIllustration(category, id) {
  const seed = [...String(id)].reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) | 0, 0) >>> 0;
  const hue = seed % 360;
  const symbols = {
    Gastronomía: '<path d="M430 270h300v150a90 90 0 0 1-90 90H520a90 90 0 0 1-90-90z"/><path d="M730 300h55a60 60 0 0 1 0 120h-55M490 170v50m80-50v50m80-50v50"/>',
    Cultura: '<path d="M350 300l250-140 250 140zM390 530h420M430 330v170m110-170v170m110-170v170m110-170v170"/>',
    'Aire Libre': '<path d="M600 150L440 360h80l-130 130h420L680 360h80zM600 490v100"/>',
    Entretenimiento: '<path d="M370 220h460v300H370zM370 300h460M450 220l70 80m50-80l70 80m50-80l70 80M560 360l100 60-100 60z"/>',
    Experiencias: '<path d="M600 150a150 150 0 0 1 150 150c0 130-150 280-150 280S450 430 450 300a150 150 0 0 1 150-150z"/><circle cx="600" cy="300" r="55"/>',
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><rect width="1200" height="720" fill="hsl(${hue} 45% 91%)"/><circle cx="${180 + seed % 800}" cy="200" r="190" fill="hsl(${(hue + 35) % 360} 50% 85%)"/><g fill="none" stroke="hsl(${hue} 35% 32%)" stroke-width="16" stroke-linejoin="round" stroke-linecap="round">${symbols[category] || symbols.Cultura}</g><text x="600" y="650" text-anchor="middle" fill="hsl(${hue} 35% 25%)" font-family="sans-serif" font-size="28">Imagen ilustrativa · ${category}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
