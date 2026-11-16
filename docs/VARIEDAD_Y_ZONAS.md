# Catálogo de 81 planes y filtros simplificados

Punto de recuperación: `10d3b58`. Se conservan los 53 planes anteriores y sus fotografías y se agregan 28 lugares revisados, hasta alcanzar 81. No se publicó en Vercel.

## Categorías

| Categoría | Antes | Ahora | Mínimo de 12 |
|---|---:|---:|---|
| Gastronomía | 12 | 20 | Alcanzado |
| Cultura | 13 | 21 | Alcanzado |
| Aire Libre | 14 | 23 | Alcanzado |
| Íconos de BA | 14 | 17 | Alcanzado |

## Zonas de CABA

| Zona | Antes de incorporar lugares | Ahora |
|---|---:|---:|
| Zona Norte | 16 | 24 |
| Zona Sur | 4 | 9 |
| Zona Centro | 33 | 48 |

Todas las zonas muestra 81 planes. Se priorizó reforzar Zona Sur: pasó de cuatro a nueve. Ninguna zona necesita fusionarse para alcanzar cinco resultados.

Las etiquetas Norte/Sur/Centro son una agrupación de navegación de Por Hacer; no se presentan como una división administrativa oficial. Se basan en las comunas de los barrios del [dataset oficial BA Data](https://data.buenosaires.gob.ar/dataset/barrios), con licencia [CC BY 2.5 AR](https://creativecommons.org/licenses/by/2.5/ar/).

- Zona Norte: comunas 2, 12, 13 y 14.
- Zona Sur: comunas 4, 8 y 9.
- Zona Centro: comunas 1, 3, 5, 6, 7, 10, 11 y 15.

El resto de la comuna 1, incluido Retiro y San Telmo, queda en Zona Centro bajo este criterio. Parque Chacabuco pertenece a la comuna 7 y también queda en Centro. La agrupación está explícita y se puede revisar sin alterar los registros originales.

Primero se usa el barrio publicado por BA Data. Para los registros suplementarios sin barrio se contrasta su punto publicado con los polígonos oficiales y se guarda la evidencia. El Puente de la Mujer cae en un dique, y el Transbordador en el Riachuelo: en esos dos casos se usan las fichas oficiales de Turismo ([Puerto Madero](https://turismo.buenosaires.gob.ar/es/node/49882), [extremo La Boca](https://turismo.buenosaires.gob.ar/es/otros-establecimientos/puente-transbordador)), no el barrio terrestre más cercano. Los 81 planes tienen una asignación trazable en `src/data/discoveryGeography.json`.

## Tipos de lugar

| Opción | Resultados |
|---|---:|
| Todos los lugares | 81 |
| Museos | 15 |
| Gastronomía | 20 |
| Espacios verdes | 23 |
| Sitios turísticos | 23 |

Las cuatro opciones agrupan los tipos publicados y las categorías revisadas: museos; bares/cafés/restaurantes; parques/plazas/jardines/reservas; y atractivos turísticos/culturales restantes (templos, puentes, monumentos, teatros y otros espacios culturales). Cada plan pertenece a un solo grupo. Sitios turísticos abarca más lugares que la categoría principal Íconos de BA.

Siete bares notables figuran en el recurso Espacios culturales de BA Data con tipo BAR. Se presentan en la categoría Gastronomía por su tipo real, conservando ID, nombre, dirección, categoría fuente Cultura y evidencia de clasificación. No se duplican ni se alteran los archivos originales.

Recomendados conserva el orden destacado; Nombre A-Z y Nombre Z-A ordenan todo el conjunto filtrado antes de paginar. Zonas y tipos se combinan con categorías y buscador. Cambiar un filtro reinicia la paginación, el contador refleja coincidencias y Ver más conserva la carga progresiva. Las combinaciones sin coincidencias muestran un mensaje y Limpiar filtros.

## Fotografías y decisiones

Las 28 nuevas fotos se inspeccionaron visualmente y se compararon con nombres, direcciones y coordenadas cuando existían. Se conservan autor, licencia, ficha Commons, descripción, evidencia, enlaces complementarios y SHA-256. Los archivos se sirven localmente, sin búsquedas durante las visitas.

- Se descartaron resultados de obras de arte, platos aislados, anuncios y homónimos sin relación con el establecimiento. No se usó la entidad de antiguos soldados persas sugerida por la búsqueda Los Inmortales.
- Parque Indoamericano usa una vista del sector recreativo del lugar, no la foto inicial centrada en una persona y una calesita. Es una imagen de archivo y no se afirma que las instalaciones temporales sigan disponibles.
- Manzana de las Luces usa la fachada fotografiada por el Ministerio de Cultura en 2023, con cartel identificatorio.
- Usina del Arte estaba pendiente por una descripción genérica. Ahora se agregó evidencia de identidad: la imagen exacta aparece como P18 de la entidad Wikidata Q6158147, con ubicación coincidente y revisión del edificio.
- Museo Histórico Sarmiento se incorpora una sola vez (Juramento 2180); el registro alternativo de la misma institución queda fuera para evitar duplicados.
- La Giralda usa el registro BA Data de Corrientes 1453 que coincide con la foto; no se fuerza la coincidencia con el registro gastronómico de Corrientes 1473.

Las decisiones están en `data/photo-batches/reviews.json`. La investigación y respuestas persistentes están en `variety-research.json`; los objetivos y archivos seleccionados, en `variety-targets.json` y `variety-selections.json`. La copia de límites de barrios y su licencia también se conservan en `data/photo-batches/`. Los puntos de espacios verdes pueden ser referencias del límite y no accesos. La foto y el registro histórico no acreditan horarios, precios ni apertura actual.

## Verificación

- Doce pruebas automatizadas correctas; una comprueba individualmente los 53 planes previos y todos sus metadatos fotográficos contra el punto de recuperación.
- Chrome decodificó las 81 imágenes sin roturas y comprobó las tres zonas y los cuatro tipos por separado, combinaciones con búsqueda/categoría, orden global, contador, ausencia de resultados y reinicio de Ver más.
- Chrome comprobó guardado, favoritos, calendario, recuerdos, planes personalizados e itinerarios en un perfil local aislado. Sin excepciones JavaScript.
- Se mantienen tres columnas, estilos y tipografías; sin desborde horizontal a 390 px. No se modificó ningún archivo CSS.
- Implementación Firebase y reglas sin cambios, comprobadas por huellas. No se hicieron pruebas remotas autenticadas ni escrituras en Firebase.
- ESLint y npm run build correctos; el build audita autor/licencia/evidencia, hashes, duplicados y asignación geográfica de todos los planes.

Comandos: `node --test tests/*.test.js`, `npm run lint`, `npm run build`, `node scripts/check-verified-browser.js --ba-data-home`. Las capturas están en `.browser-check/verified-desktop.png` y `.browser-check/verified-mobile.png`.

## Barrios por zona

### Zona Norte

belgrano, coghlan, colegiales, nunez, palermo, recoleta, saavedra, villa pueyrredon, villa urquiza.

### Zona Sur

barracas, boca, liniers, mataderos, nueva pompeya, parque avellaneda, parque patricios, villa lugano, villa riachuelo, villa soldati.

### Zona Centro

agronomia, almagro, balvanera, boedo, caballito, chacarita, constitucion, flores, floresta, monserrat, monte castro, parque chacabuco, parque chas, paternal, puerto madero, retiro, san cristobal, san nicolas, san telmo, velez sarsfield, versalles, villa crespo, villa del parque, villa devoto, villa gral. mitre, villa luro, villa ortuzar, villa real, villa santa rita.
