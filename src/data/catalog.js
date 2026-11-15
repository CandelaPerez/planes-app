import CATALOG_IDEAS_EXTRA from '../catalog-extra';

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

const categories = ['Todas', 'Gastronom\u00eda', 'Aire Libre', 'Cultura', 'Viajes', 'Entretenimiento', 'Experiencias'];
const zoneOrder = ['CABA', 'Zona Norte', 'Zona Oeste', 'Zona Sur', 'AMBA', 'Interior de Buenos Aires', 'Centro y Cuyo', 'Litoral y Norte', 'Patagonia', 'Internacional'];

export { CATALOG, catalogImages, catalogRecords, categoryImages, planImage, categories, zoneOrder };
