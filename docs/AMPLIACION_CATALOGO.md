# Ampliación del catálogo fotográfico

Punto de recuperación anterior a esta ampliación: `a26278e`. No se publicó en Vercel.

Se incorporaron 32 planes nuevos a los 21 anteriores: 18 registros BA Data adicionales y 14 atractivos de Wikidata. Total: **53 planes**. Se conservan los 6.670 registros BA Data, los 129 originales y los datos guardados de usuarios.

| Categoría | Disponibles | Mínimo de 12 |
|---|---:|---|
| Gastronomía | 12 | Alcanzado |
| Cultura | 13 | Alcanzado |
| Aire Libre | 14 | Alcanzado |
| Viajes | 14 | Alcanzado |

Los cinco filtros permanecen visibles durante la carga y ante errores; Aire Libre ya no depende de la cantidad de resultados para aparecer. El contador muestra 53 planes y los resultados filtrados muestran su cantidad correspondiente. Se conserva Ver más. No se modificó ningún archivo CSS.

Viajes incluye atractivos reales de la ciudad: monumentos, puentes, templos, palacios y otros espacios identificados individualmente. Los IDs `tourism-wikidata-q…` derivan de entidades Wikidata estables. La identidad, descripción breve y coordenadas proceden de una copia local de Wikidata (CC0); las fotos tienen licencias independientes de Commons y créditos por imagen. Las fichas distinguen ambas fuentes. No se inventaron direcciones postales faltantes, horarios, precios ni acceso interior.

## Verificación de imágenes

Las 53 fotografías tienen autor, licencia, enlace original, descripción, evidencia de identidad y SHA-256. Son archivos locales; no hay búsquedas durante visitas. La auditoría impide repetir el mismo archivo o la misma fotografía en planes diferentes. Las fotos anteriores se conservaron.

En la revisión se descartó una candidata de Caminito con coordenadas contradictorias fuera de Argentina y se cambió el encuadre de El Cuartito orientado al local de enfrente por una fotografía de su placa identificatoria. Plaza Rafael Hernández y Centro Cultural Recoleta usan alternativas con carteles legibles. Las decisiones y huellas están en `data/photo-batches/reviews.json`; las respuestas de investigación, en `data/photo-batches/expansion.json`. La evidencia completa está en `src/data/baDataPhotos.json`.

## Comprobaciones

- Ocho pruebas automatizadas correctas: integridad de registros y fotos, mínimos por categoría, procedencia turística, IDs estables, filtros y conservación de originales.
- ESLint sin errores; npm run build correcto, incluyendo auditoría fotográfica.
- Chrome decodificó las 53 imágenes locales sin roturas.
- Chrome verificó categorías, Aire Libre, búsqueda, Ver más, guardado de un atractivo de Viajes con sus metadatos y fuente visible en detalles.
- Chrome verificó favoritos, calendario, recuerdos, creación de planes personalizados e itinerarios en un perfil local aislado.
- El plan guardado permanece al bloquear la carga del catálogo. Aparece un error y no hay sustitución por ilustraciones.
- Tres columnas en escritorio y sin desborde horizontal a 390 px. Sin excepciones JavaScript.
- Catálogo original, implementación Firebase y reglas Firestore conservaron sus huellas. No se hicieron operaciones remotas autenticadas; la verificación funcional fue local.

Comandos: `node --test tests/*.test.js`, `npm run lint`, `npm run build`, `node scripts/check-verified-browser.js --ba-data-home`. Capturas en `.browser-check/verified-desktop.png` y `.browser-check/verified-mobile.png`.

## Planes disponibles

### Gastronomía

- BAR BRITANICO — `badata-food-2554` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:Bar_Britanico_Buenos_Aires.JPG).
- CAFE TORTONI — `badata-food-1362` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:Frente_Caf%C3%A9_Tortoni.jpg).
- EL CUARTITO — `badata-food-1985` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:Pizzer%C3%ADa_El_Cuartito_09.jpg).
- EL FEDERAL — `badata-food-2567` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:Bar_El_Federal,_Carlos_Calvo_599.jpg).
- EL GATO NEGRO — `badata-food-2231` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:Gato_negro.jpg).
- EL IMPERIO DE LA PIZZA — `badata-food-565` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:El_Imperio_de_la_Pizza_02.jpg).
- EL PREFERIDO DE PALERMO — `badata-food-170` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:Bar_El_Preferido_de_Palermo2.jpg).
- ESQUINA HOMERO MANZI — `badata-food-947` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:Cartel_Esquina_Homero_Manzi.jpg).
- GUERRIN — `badata-food-2296` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:Pizzer%C3%ADa_G%C3%BCerr%C3%ADn.jpg).
- LA BIELA — `badata-food-1780` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:La_biela.JPG).
- LAS VIOLETAS — `badata-food-638` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:Las_Violetas_Medrano.JPG).
- LOS GALGOS — `badata-food-2379` — [fuente](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos) · [foto](https://commons.wikimedia.org/wiki/File:Bar_Los_Galgos.jpg).

### Cultura

- ACADEMIA NACIONAL DE LA HISTORIA DE LA REPUBLICA ARGENTINA — `badata-culture-2545` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:Academia_Nacional_de_la_Historia_(Argentina).JPG).
- CENTRO CULTURAL RECOLETA — `badata-culture-1103` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:CENTROCULTURALRECOLETA2022.jpg).
- EL ATENEO — `badata-culture-1985` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:Yenny_Ateneo_Grand_Splendid.jpg).
- MALBA — `badata-culture-2568` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:Buenos_Aires_-_Palermo_-_Malba.jpg).
- MUSEO ARGENTINO DE CIENCIAS NATURALES "BERNARDINO RIVADAVIA" — `badata-culture-2578` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:MACN24021402.JPG).
- MUSEO DE ARTE ESPAÑOL ENRIQUE LARRETA — `badata-culture-2599` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:Museo_de_Arte_Espa%C3%B1ol_Enrique_Larreta_esquina.jpg).
- MUSEO DE ARTE MODERNO DE BUENOS AIRES - MAMBA — `badata-culture-2601` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:FachadaModerno.jpg).
- MUSEO HISTORICO NACIONAL — `badata-culture-2674` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:Museo_Hist%C3%B3rico_Nacional,_Buenos_Aires_Argentina.jpg).
- MUSEO HISTORICO NACIONAL DEL CABILDO Y DE LA REVOLUCION DE MAYO — `badata-culture-2675` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:Cabildo_de_Buenos_Aires_2023.jpg).
- MUSEO NACIONAL BELLAS ARTES — `badata-culture-2694` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:Museo_Nacional_de_Bellas_Artes_(12407).jpg).
- PALACIO BAROLO — `badata-culture-2467` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:Palacio_Barolo_dramatic_view.jpg).
- PLANETARIO GALILEO GALILEI — `badata-culture-2717` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:Planetario_y_su_alrededor.jpg).
- TEATRO COLON — `badata-culture-2989` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-culturales) · [foto](https://commons.wikimedia.org/wiki/File:Teatro_Colon-rear.jpg).

### Aire Libre

- Antoine Saint-Exupery — `badata-green-1529` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:Plaza_Antoine_Saint-Exup%C3%A9ry.jpg).
- Carlos Thays (Jardín Botánico) — `badata-green-1330` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:Buenos_Aires_Entrada_al_Jardin_Botanico_Carlos_Thays.jpg).
- El Rosedal (Plaza Holanda) — `badata-green-1490` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:RosedalBuenosAires.JPG).
- Jardín Japonés — `badata-green-1444` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:Buenos_Aires_-_Jard%C3%ADn_Japon%C3%A9s_-_200806a.jpg).
- Parque Avellaneda — `badata-green-874` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:Casa_de_los_Olivera_en_el_Parque_Avellaneda.jpg).
- Parque Brig. Gral. Cornelio Saavedra — `badata-green-171` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:DefPuebloCABA_-_Barrio_Parque_Saavedra_(1).jpg).
- Parque Centenario — `badata-green-871` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:Buenos_Aires_-_Caballito_-_Parque_Centenario.jpg).
- Parque Chacabuco — `badata-green-872` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:Escultura_Yaguaret%C3%A9_en_Parque_Chacabuco_-_Emilio_Jacinto_Sarniguet.jpg).
- Parque Lezama — `badata-green-880` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:Parque_Lezama_2019.jpg).
- Parque Rivadavia — `badata-green-1106` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:Parque_Rivadavia_Monumento_a_Sim%C3%B3n_Bolivar_(Buenos_Aires).jpg).
- Plaza Barrancas de Belgrano — `badata-green-610` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:Plaza_Belgrano_Glorieta.jpg).
- Plaza del Congreso — `badata-green-906` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:Plaza_Congreso.JPG).
- Plaza Rafael Hernández — `badata-green-9` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:PlazaRafaelHernandez1.jpg).
- Plaza San Martín — `badata-green-882` — [fuente](https://data.buenosaires.gob.ar/dataset/espacios-verdes) · [foto](https://commons.wikimedia.org/wiki/File:Plaza_San_Mart%C3%ADn_-_Buenos_Aires.jpg).

### Viajes

- basílica de San Francisco — `tourism-wikidata-q4579815` — [fuente](https://www.wikidata.org/wiki/Q4579815) · [foto](https://commons.wikimedia.org/wiki/File:Bas%C3%ADlica_de_San_Francisco,_Buenos_Aires.jpg).
- basílica Nuestra Señora del Pilar (Buenos Aires) — `tourism-wikidata-q2886930` — [fuente](https://www.wikidata.org/wiki/Q2886930) · [foto](https://commons.wikimedia.org/wiki/File:Buenos_Aires_-_Recoleta_-_Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora_del_Pilar_-_1.jpg).
- Caminito — `tourism-wikidata-q1029566` — [fuente](https://www.wikidata.org/wiki/Q1029566) · [foto](https://commons.wikimedia.org/wiki/File:Caminito_Tango,_Buenos_Aires_ARG.jpg).
- Casa Rosada — `tourism-wikidata-q478926` — [fuente](https://www.wikidata.org/wiki/Q478926) · [foto](https://commons.wikimedia.org/wiki/File:Casa_Rosada_Buenos_Aires.JPG).
- Catedral de Buenos Aires — `tourism-wikidata-q967929` — [fuente](https://www.wikidata.org/wiki/Q967929) · [foto](https://commons.wikimedia.org/wiki/File:Argentina-02271_-_Metropolitan_Cathedral_(49024465657).jpg).
- Cementerio de la Recoleta — `tourism-wikidata-q831322` — [fuente](https://www.wikidata.org/wiki/Q831322) · [foto](https://commons.wikimedia.org/wiki/File:Cementerio_de_la_Recoleta.jpg).
- La Bombonera — `tourism-wikidata-q499855` — [fuente](https://www.wikidata.org/wiki/Q499855) · [foto](https://commons.wikimedia.org/wiki/File:La_Bombonera_2.jpg).
- Obelisco de Buenos Aires — `tourism-wikidata-q831389` — [fuente](https://www.wikidata.org/wiki/Q831389) · [foto](https://commons.wikimedia.org/wiki/File:ObeliscoBA2015.jpg).
- Palacio de Aguas Corrientes — `tourism-wikidata-q3361112` — [fuente](https://www.wikidata.org/wiki/Q3361112) · [foto](https://commons.wikimedia.org/wiki/File:Aguas_Corrientes-2011-TM.jpg).
- Palacio del Congreso de la Nación Argentina — `tourism-wikidata-q646142` — [fuente](https://www.wikidata.org/wiki/Q646142) · [foto](https://commons.wikimedia.org/wiki/File:2019_Buenos_Aires_-_Palacio_del_Congreso_de_la_Naci%C3%B3n_Argentina.jpg).
- Palacio Paz — `tourism-wikidata-q1668230` — [fuente](https://www.wikidata.org/wiki/Q1668230) · [foto](https://commons.wikimedia.org/wiki/File:Circulo_Militar_5821.jpg).
- Puente de la Mujer — `tourism-wikidata-q2336867` — [fuente](https://www.wikidata.org/wiki/Q2336867) · [foto](https://commons.wikimedia.org/wiki/File:Puente_de_la_mujer,_Buenos_Aires_(32008).jpg).
- Puente Transbordador Nicolás Avellaneda — `tourism-wikidata-q1138028` — [fuente](https://www.wikidata.org/wiki/Q1138028) · [foto](https://commons.wikimedia.org/wiki/File:Buenos_Aires_Most_Transportowy_2.jpg).
- Torre Monumental — `tourism-wikidata-q570385` — [fuente](https://www.wikidata.org/wiki/Q570385) · [foto](https://commons.wikimedia.org/wiki/File:Torre_Monumental,_Buenos_Aires_.jpg).
