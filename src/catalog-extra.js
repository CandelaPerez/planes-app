const CATALOG_IDEAS_BASE = [
  { id: 'cat_21', title: 'Brunch frente al Rosedal', description: 'Desayuno tardío y paseo por los senderos de los Bosques de Palermo.', location: 'Palermo', category: 'Gastronomía', budget: '$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_22', title: 'Degustación de empanadas en San Telmo', description: 'Probar distintas variedades en los cafés y bodegones del barrio.', location: 'San Telmo', category: 'Gastronomía', budget: '$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1604467715878-83e57e8bc129?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_23', title: 'Merienda en una confitería notable', description: 'Disfrutar una merienda clásica en Las Violetas, edificio histórico de Almagro.', location: 'Almagro', category: 'Gastronomía', budget: '$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_24', title: 'Cocina porteña en el Mercado de Belgrano', description: 'Recorrer los puestos y elegir algo rico para almorzar en el mercado barrial.', location: 'Belgrano', category: 'Gastronomía', budget: '$$', company: 'Solo', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_25', title: 'Paseo en bici por la Costanera', description: 'Seguir el paseo ribereño en bicicleta y hacer una pausa junto al río.', location: 'Costanera Norte', category: 'Aire Libre', budget: '$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_26', title: 'Jardín Botánico Carlos Thays', description: 'Recorrer los senderos y colecciones de plantas del jardín histórico de Palermo.', location: 'Palermo', category: 'Aire Libre', budget: 'Gratis', company: 'Solo', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_27', title: 'Escapada a Colonia del Sacramento', description: 'Cruzar el Río de la Plata para caminar por el casco histórico y la rambla.', location: 'Colonia del Sacramento, Uruguay', category: 'Viajes', budget: '$$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_28', title: 'Fin de semana en las sierras de Córdoba', description: 'Elegir una base serrana y combinar caminatas, río y gastronomía regional.', location: 'Villa General Belgrano, Córdoba', category: 'Viajes', budget: '$$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_29', title: 'Descanso entre viñedos en Mendoza', description: 'Visitar una bodega del Valle de Uco y conocer los paisajes de montaña.', location: 'Valle de Uco, Mendoza', category: 'Viajes', budget: '$$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_30', title: 'Caminata por el Parque Nacional Iguazú', description: 'Organizar una visita a los circuitos y miradores de las Cataratas del Iguazú.', location: 'Puerto Iguazú, Misiones', category: 'Viajes', budget: '$$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_31', title: 'Paisajes de montaña en Bariloche', description: 'Planear una escapada para recorrer lagos, senderos y miradores de la Patagonia.', location: 'San Carlos de Bariloche, Río Negro', category: 'Viajes', budget: '$$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_32', title: 'Día de playa en Mar del Plata', description: 'Pasear por la costa, visitar el puerto y probar clásicos marplatenses.', location: 'Mar del Plata, Buenos Aires', category: 'Viajes', budget: '$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_33', title: 'Un día entre canales en Tigre', description: 'Pasear por el Puerto de Frutos y organizar una navegación por el Delta.', location: 'Tigre, Buenos Aires', category: 'Viajes', budget: '$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_34', title: 'Museo de Arte Latinoamericano de Buenos Aires', description: 'Recorrer la colección y las exposiciones temporales del MALBA.', location: 'Palermo', category: 'Cultura', budget: '$$', company: 'Solo', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_35', title: 'Visita al Teatro Colón', description: 'Conocer la sala, los salones y la historia del teatro en una visita guiada.', location: 'San Nicolás', category: 'Cultura', budget: '$$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_36', title: 'Paseo por Caminito y La Boca', description: 'Explorar las fachadas coloridas, el arte callejero y la historia del barrio.', location: 'La Boca', category: 'Cultura', budget: '$', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_37', title: 'Tarde de libros en El Ateneo Grand Splendid', description: 'Recorrer la librería instalada en un antiguo teatro y elegir una lectura.', location: 'Recoleta', category: 'Cultura', budget: '$', company: 'Solo', image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cat_38', title: 'Exposiciones en el Centro Cultural Recoleta', description: 'Descubrir muestras de arte contemporáneo y actividades culturales.', location: 'Recoleta', category: 'Cultura', budget: 'Gratis', company: 'Con amigos', image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=80' },
];

const coverageAreas = [
  {
    name: 'Buenos Aires',
    places: {
      Gastronomía: { name: 'Café Tortoni', address: 'Av. de Mayo 825, Monserrat, Ciudad de Buenos Aires', openingHours: 'Todos los días, 08:00–21:00', officialUrl: 'https://www.cafetortoni.com.ar/', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1000&q=80' },
      'Aire Libre': { name: 'Reserva Ecológica Costanera Sur', address: 'Av. Dr. Tristán Achával Rodríguez 1550, Puerto Madero, Ciudad de Buenos Aires', openingHours: 'Martes a domingos y feriados: 08:00–18:00 (abril–octubre) y 08:00–19:00 (noviembre–marzo). Puede cerrar por clima.', officialUrl: 'https://buenosaires.gob.ar/gcaba_historico/vicejefatura/ambiente/reservasecologicas/reserva-ecologica-costanera-sur', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80' },
      Cultura: { name: 'MALBA', address: 'Av. Figueroa Alcorta 3415, Palermo, Ciudad de Buenos Aires', openingHours: 'Miércoles 11:00–20:00; jueves a lunes 12:00–20:00; martes cerrado.', officialUrl: 'https://www.malba.org.ar/visitar/', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1000&q=80' },
      Viajes: { name: 'Plaza de Mayo y casco histórico', address: 'Plaza de Mayo, Monserrat, Ciudad de Buenos Aires', openingHours: 'Espacio público abierto; horarios de museos y visitas guiadas varían.', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80' },
    },
  },
  {
    name: 'Tigre',
    places: {
      Gastronomía: { name: 'Puerto de Frutos', address: 'Sarmiento 160, Tigre, Buenos Aires', openingHours: 'Todos los días, 10:00–18:00. Locales y paseos pueden variar.', officialUrl: 'https://vivitigre.gob.ar/actividades/puerto-de-frutos/', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80' },
      'Aire Libre': { name: 'Paseo Victorica y ribera de Tigre', address: 'Av. Victorica, Tigre, Buenos Aires', openingHours: 'Paseo público; excursiones fluviales tienen horarios propios.', image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1000&q=80' },
      Cultura: { name: 'Museo de Arte Tigre (MAT)', address: 'Av. Victorica 972, Tigre, Buenos Aires', openingHours: 'Miércoles a viernes 13:00–18:00; sábados, domingos y feriados 12:00–18:00.', officialUrl: 'https://mat.gob.ar/', image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=80' },
      Viajes: { name: 'Estación Fluvial de Tigre y paseo por el Delta', address: 'Bartolomé Mitre 305, Tigre, Buenos Aires', openingHours: 'Las salidas dependen de cada operador; consultar antes de viajar.', image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1000&q=80' },
    },
  },
  {
    name: 'Mar del Plata',
    places: {
      Gastronomía: { name: 'Banquina de Pescadores del Puerto', address: 'Puerto de Mar del Plata, Av. de los Pescadores, Mar del Plata, Buenos Aires', openingHours: 'Los restaurantes y puestos tienen horarios propios; consultar la ficha antes de ir.', image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1000&q=80' },
      'Aire Libre': { name: 'Playa Varese', address: 'Av. Patricio Peralta Ramos 1000, Mar del Plata, Buenos Aires', openingHours: 'Acceso a la playa abierto; servicios de playa según temporada.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80' },
      Cultura: { name: 'Museo MAR', address: 'Av. Félix U. Camet 799, Mar del Plata, Buenos Aires', openingHours: 'Horario estacional; consultar calendario y redes oficiales antes de ir.', officialUrl: 'https://www.gba.gob.ar/museo_mar', image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=80' },
      Viajes: { name: 'Torreón del Monje y paseo costero', address: 'Paseo Jesús de Galíndez s/n, Mar del Plata, Buenos Aires', openingHours: 'Paseo costero abierto; horarios del edificio y gastronomía pueden variar.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80' },
    },
  },
  {
    name: 'Córdoba',
    places: {
      Gastronomía: { name: 'Mercado Norte', address: 'Oncativo 50, Centro, Córdoba Capital', openingHours: 'Los puestos tienen horarios propios; consultar antes de ir.', image: 'https://images.unsplash.com/photo-1604467715878-83e57e8bc129?auto=format&fit=crop&w=1000&q=80' },
      'Aire Libre': { name: 'Parque Sarmiento', address: 'Av. Deodoro Roca s/n, Nueva Córdoba, Córdoba Capital', openingHours: 'Parque público; algunos sectores y servicios tienen horarios propios.', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1000&q=80' },
      Cultura: { name: 'Museo Evita – Palacio Ferreyra', address: 'Av. Hipólito Yrigoyen 511, Nueva Córdoba, Córdoba Capital', openingHours: 'Martes a domingos y feriados, 10:00–17:30. Confirmar horario estacional.', officialUrl: 'https://turismo.cordoba.gob.ar/palacio-ferreyra-museo-evita/', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1000&q=80' },
      Viajes: { name: 'Paseo del Buen Pastor y Nueva Córdoba', address: 'Av. Hipólito Yrigoyen 325, Nueva Córdoba, Córdoba Capital', openingHours: 'Espacio público; actividades y locales tienen horarios propios.', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80' },
    },
  },
  {
    name: 'Puerto Iguazú',
    places: {
      Gastronomía: { name: 'La Rueda 1975', address: 'Av. Córdoba 28, Puerto Iguazú, Misiones', openingHours: 'Consultar horarios y reservas en la ficha actualizada del restaurante.', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80' },
      'Aire Libre': { name: 'Parque Nacional Iguazú – Área Cataratas', address: 'Ruta Nacional 101, km 142, Puerto Iguazú, Misiones', openingHours: 'Todos los días, 08:00–18:00; último ingreso 16:00. Circuitos sujetos a clima y mantenimiento.', officialUrl: 'https://iguazuargentina.com/planifica-tu-visita/', image: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1000&q=80' },
      Cultura: { name: 'La Aripuca', address: 'Ruta Nacional 12, km 4.5, Puerto Iguazú, Misiones', openingHours: 'Consultar días y horarios vigentes antes de ir.', image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=1000&q=80' },
      Viajes: { name: 'Hito Tres Fronteras', address: 'Av. Tres Fronteras, Puerto Iguazú, Misiones', openingHours: 'Mirador público; consultar horarios de espectáculos y servicios.', image: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1000&q=80' },
    },
  },
  {
    name: 'Bariloche',
    places: {
      Gastronomía: { name: 'Cervecería Patagonia', address: 'Circuito Chico, km 24.7, San Carlos de Bariloche, Río Negro', openingHours: 'Consultar disponibilidad, horarios y reservas en su sitio antes de ir.', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1000&q=80' },
      'Aire Libre': { name: 'Cerro Campanario', address: 'Av. Exequiel Bustillo, km 17.5, San Carlos de Bariloche, Río Negro', openingHours: 'Puede cerrar por mantenimiento o clima; confirmar operación de aerosilla antes de ir.', officialUrl: 'https://www.barilocheturismo.gob.ar/es/actividades-cerro-campanario', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80' },
      Cultura: { name: 'Museo de la Patagonia Francisco P. Moreno', address: 'Centro Cívico, Mitre 531, San Carlos de Bariloche, Río Negro', openingHours: 'Consultar horario vigente y días de apertura antes de ir.', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1000&q=80' },
      Viajes: { name: 'Circuito Chico', address: 'Av. Exequiel Bustillo, San Carlos de Bariloche, Río Negro', openingHours: 'Recorrido abierto; transporte, excursiones y atractivos tienen horarios propios.', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80' },
    },
  },
  {
    name: 'Colonia del Sacramento',
    places: {
      Gastronomía: { name: 'El Drugstore', address: 'Ituzaingó 126, Barrio Histórico, Colonia del Sacramento, Uruguay', openingHours: 'Consultar horario actualizado del restaurante antes de ir.', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80' },
      'Aire Libre': { name: 'Rambla Costanera de Colonia', address: 'Rambla de las Américas, Colonia del Sacramento, Uruguay', openingHours: 'Paseo público abierto.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80' },
      Cultura: { name: 'Museo Portugués', address: 'Henríquez de la Peña 180, Barrio Histórico, Colonia del Sacramento, Uruguay', openingHours: 'Consultar días y horarios vigentes en la ficha del museo.', image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=80' },
      Viajes: { name: 'Barrio Histórico y Faro de Colonia', address: 'Barrio Histórico, Colonia del Sacramento, Uruguay', openingHours: 'Barrio abierto; horarios del faro y museos pueden variar.', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=80' },
    },
  },
];

const coverageCategories = [
  {
    name: 'Gastronomía',
    activities: ['Sabores de barrio', 'Café y algo rico', 'Cena para disfrutar'],
    details: ['probar platos y productos de la zona', 'hacer una pausa en una cafetería local', 'reservar una mesa y disfrutar una comida especial'],
    images: ['https://images.unsplash.com/photo-1604467715878-83e57e8bc129?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1000&q=80'],
  },
  {
    name: 'Aire Libre',
    activities: ['Paseo al aire libre', 'Parques y miradores', 'Aventura en la naturaleza'],
    details: ['recorrer espacios verdes y caminar sin apuro', 'conocer los paisajes y miradores de la zona', 'sumar una actividad guiada y pasar el día afuera'],
    images: ['https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80'],
  },
  {
    name: 'Cultura',
    activities: ['Paseo cultural', 'Museos y patrimonio', 'Experiencia artística'],
    details: ['descubrir rincones e historias locales', 'visitar un museo o edificio emblemático', 'sumarse a una visita guiada o actividad artística'],
    images: ['https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1000&q=80'],
  },
  {
    name: 'Viajes',
    activities: ['Escapada de un día', 'Una noche fuera', 'Fin de semana para explorar'],
    details: ['organizar una visita y volver en el día', 'pasar una noche y conocer el destino con calma', 'armar una escapada con alojamiento y actividades'],
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80'],
  },
];

const coverageBudgets = [
  { label: 'económico', value: '$' },
  { label: 'intermedio', value: '$$' },
  { label: 'especial', value: '$$$' },
];

const coverageIdeas = coverageAreas.flatMap((area, areaIndex) => coverageCategories.flatMap((category, categoryIndex) => coverageBudgets.map((budget, budgetIndex) => ({
  id: `coverage_${areaIndex + 1}_${categoryIndex + 1}_${budgetIndex + 1}`,
  title: `${category.activities[budgetIndex]} en ${area.places[category.name].name}`,
  description: `${category.details[budgetIndex]} en ${area.places[category.name].name}.`,
  location: area.places[category.name].address,
  address: area.places[category.name].address,
  openingHours: area.places[category.name].openingHours,
  duration: area.places[category.name].duration || 'Entre 1 y 3 horas; depende del recorrido y la actividad elegida.',
  visitTips: area.places[category.name].visitTips || 'Revisá horarios, disponibilidad y condiciones del lugar antes de salir.',
  officialUrl: area.places[category.name].officialUrl,
  category: category.name,
  budget: budget.value,
  company: budgetIndex === 0 ? 'Solo' : 'Con amigos',
  image: area.places[category.name].image || category.images[budgetIndex],
}))));

const CATALOG_IDEAS_EXTRA = [...CATALOG_IDEAS_BASE, ...coverageIdeas];

export default CATALOG_IDEAS_EXTRA;
