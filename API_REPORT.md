# Por Hacer — integración y comprobaciones del 15/11/2026

## Resultado y límites

Se conservan **129 planes originales + 10 lugares OSM = 139 propuestas**.
**No se obtuvieron lugares nuevos desde Overpass en esta sesión.** Los diez
lugares adicionales siguen procediendo del extracto OSM del 01/07/2019, con
verificaciones institucionales del 15/11/2026. Las coordenadas no se reetiquetan
como actuales. Véase [PLACE_VERIFICATION.md](PLACE_VERIFICATION.md).

La consulta Node real a los dos proveedores devolvió `EACCES`: bloqueo de red
del entorno, sin respuesta HTTP externa. Se solicitó ejecución ampliada y fue
rechazada. Por ello no se afirma una integración Overpass en vivo validada.
La herramienta web sí permitió leer el [extracto original](https://raw.githubusercontent.com/MuseosAbiertos/Leaflet-museums-OpenStreetMap/principal/data/export.geojson),
incluidos nombres, IDs, coordenadas, timestamp y declaración ODbL. Esto es una
consulta a la fuente documental; **no equivale a una descarga automatizada
exitosa desde Node**. La importación automática sigue pendiente de ejecutarse con
un archivo descargado o conexión autorizada.

## Diagnóstico previo a los cambios de interfaz

- React llama a `GET /api/places` desde `src/services/openStreetMap.js`.
  El handler `api/places.js` sirve JSON local, sin llamar a Overpass por visita.
  El recorrido HTTP real a través de Vite se comprobó en las pruebas.
- Los diez extras fueron transcritos manualmente de un GeoJSON OSM publicado;
  no fueron recibidos por una consulta Overpass del proyecto. La verificación
  institucional está en otro archivo, sin alterar los tags OSM originales.
- El antiguo backend generaba HTTP 503 ante cualquier excepción. No distinguía
  fallos de conexión, timeout, JSON inválido y HTTP externo. El error actual de
  diagnóstico es de acceso de red, no un HTTP 503 recibido de Overpass.
- Kumi y Private.coffee son el mismo servicio. Los proveedores independientes
  actuales son Private.coffee y VK Maps, intentados secuencialmente una vez.
- Las imágenes repetidas de los diez extras eran el único SVG genérico asignado
  a todos ellos. `src/planPhotos.js` también hace búsquedas temáticas para los
  planes originales: esos resultados no acreditan fotografías de establecimientos
  concretos. No se modificó ese comportamiento de los 129 originales.
- Vercel tiene una función nativa `api/places.js` que importa sus JSON de forma
  estática. Se revisó esa configuración; **no se probó una URL desplegada** ni se
  publicó nada. Vite dev y preview ahora registran el mismo handler.

## Consultas, persistencia y endpoints

`server/osm.js` define las consultas del proceso de actualización Node. Una
ejecución selecciona **una celda y una categoría**, con máximo 40 resultados:

- `caba`: centro de CABA; `norte`: sector de Vicente López; `oeste`: sector de
  Morón; `sur`: sector de Lanús. Son celdas pequeñas, no cobertura exhaustiva.
- `food`: cafés/restaurantes; `culture`: museos/galerías/centros culturales;
  `outdoors`: parques/jardines/reservas/plazas; `entertainment`: teatros/cines;
  `experiences`: atracciones permanentes.

QL timeout 10 s; HTTP timeout 12 s por proveedor. Hay como máximo tres endpoints
configurados distintos y se detiene al primer resultado válido. No hay consultas
en paralelo ni reintentos infinitos. Una nueva ejecución en menos de 60 s se
rechaza localmente. No automatizar este comando en bucle.

Endpoints:

- Aplicación: `GET /api/places`, sin parámetros; POST devuelve 405.
- Actualización manual: `https://overpass.private.coffee/api/interpreter` y
  `https://maps.mail.ru/osm/tools/overpass/api/interpreter`, desde Node, no React.
- Fotografías: Wikimedia Commons `Special:FilePath`, solo tres referencias
  verificadas y sus páginas de autoría/licencia. Hay respaldo SVG local.

La persistencia está en `data/osm-imports.json`. Cada registro importado guarda
ID y tipo OSM, tags reales, coordenadas, consulta, fuente, método de adquisición,
timestamp OSM y fecha de obtención. Los lotes se fusionan por tipo/ID. Una
respuesta parcial, vacía o inválida no sustituye resultados válidos. Se usa
escritura temporal y renombrado. Se conservan aparte el catálogo original y el
extracto inicial de diez museos.

El frontend conserva caché en memoria y localStorage v4 por un día, además del
respaldo incluido en el build. HTTP usa una hora de caché de navegador y un día
de CDN. La revisión de datos impide que una respuesta antigua quite verificaciones
recientes. No se inventan precios: sin datos se muestra “Sin información”.

## Imágenes y eventos

Se comprobaron tres referencias en Commons con descripción, autor y licencia:

| Lugar | Archivo | Autor y licencia |
| --- | --- | --- |
| Manzana de las Luces | [Manzana de las Luces vista desde arriba.jpg](https://commons.wikimedia.org/wiki/File:Manzana_de_las_Luces_vista_desde_arriba.jpg) | Roberto Fiadone, CC BY-SA 2.5 |
| Museo del Banco Central | [Museo del Banco Central.jpg](https://commons.wikimedia.org/wiki/File:Museo_del_Banco_Central.jpg) | Mrtngrsbch, CC BY-SA 4.0 |
| Corbeta Uruguay | [Corbeta Uruguay (A.R.A.).jpg](https://commons.wikimedia.org/wiki/File:Corbeta_Uruguay_(A.R.A.).jpg) | José María Pérez Nuñez, CC BY-SA 2.0 |

El manifiesto guarda fecha de la fotografía, consulta y URL de licencia. No se
afirma que estas fotos antiguas representen el estado actual. Sus archivos
binarios no fueron descargados ni inspeccionados visualmente aquí; se verificó
la correspondencia documental en Commons. Se cargan remotamente y se identifican
con autor/licencia. Ante fallo se usa una ilustración local por categoría e ID.
Los diez registros ya no comparten una única imagen. No se generaron fotografías.

“Planes para hacer hoy” muestra solo un estado vacío: **no hay eventos con fecha
confirmada**. Ya no presenta museos permanentes como eventos diarios. No se agregó
otra API de eventos. Los lugares siguen en Descubrir planes.

## Pruebas realizadas

| Comprobación | Resultado |
| --- | --- |
| GET real al endpoint local de Vite | 200, diez elementos con IDs/nombres reales |
| Consulta real Node a Overpass | Falló por EACCES; ejecución ampliada rechazada |
| Consulta al extracto abierto | Lectura exitosa mediante herramienta web; no descarga Node |
| Transformación, fuentes y fechas | Pruebas automatizadas aprobadas |
| Filtros por búsqueda/categoría/zona/presupuesto | Hook real probado; búsqueda real en Chrome aprobada |
| Duplicados | Prueba tipo/ID y nombres aprobada |
| Firebase autenticado | **No probado**, sin cuenta de prueba; no hubo escrituras ni cambios de código Firebase |
| API caída | Chrome con HTTPS y /api/places bloqueados: diez resultados en caché |
| Móvil | Chrome a 390 × 844: ancho de página 390, sin desbordamiento |
| Escritorio | Chrome a 1366: tres columnas, sin desbordamiento |
| Build y ESLint | Aprobados |
| Vercel real | **No probado**, no se proporcionó URL de despliegue y no se publicó |

La captura móvil queda en `.browser-check/mobile.png` (ignorada por Git). La
prueba del navegador usa modo local, no simula una validación de Firebase.

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
node --test tests/local-catalog.test.js tests/places.test.js tests/place-verification.test.js tests/osm-import.test.js
node scripts/check-browser.js
```

`check-browser.js` requiere Chrome instalado; puede indicarse CHROME_PATH.
Utiliza un perfil temporal, no el perfil personal, y bloquea HTTPS para probar
la presentación sin proveedores externos.

## Actualizar datos

Con acceso a Internet, ejecutar primero una sola prueba pequeña:

```powershell
node scripts/refresh-osm.js --probe
```

Tras esperar al menos 60 s, actualizar una celda/categoría:

```powershell
node scripts/refresh-osm.js --zone=caba --category=food
```

Cambiar zona/categoría en ejecuciones separadas. Un fallo conserva el respaldo.
Para importar un extracto descargado legalmente, con IDs OSM y geometría Point:

```powershell
node scripts/refresh-osm.js --file=datos.geojson --source-url=https://servidor/fuente.geojson
```

El GeoJSON debe declarar ODbL en `copyright` y su fecha en `timestamp`. No se
inventan centros de polígonos ni IDs. El script no publica: revisar el diff del
JSON, reiniciar Vite o recompilar para incluirlo. No sustituye los 129 originales.

## Verificar Vercel cuando haya un despliegue autorizado

Abrir `https://TU-DOMINIO/api/places`: debe responder JSON 200 con `elements`,
`revision`, `verificationUpdatedOn` y procedencia por registro. Confirmar que no
devuelva el HTML de React. Comparar la revisión con el archivo local. Buscar
Cárcova en la interfaz, abrir el enlace OSM y luego bloquear /api/places y recargar.
Comprobar acceso a Firebase con una cuenta de prueba propia, guardar un plan,
recargar y confirmar su persistencia. Estas comprobaciones remotas quedan
pendientes; no se presentan como aprobadas.

Tres resultados para cotejar con el origen:

- `relation/3228119`: [Manzana de las Luces](https://www.openstreetmap.org/relation/3228119).
- `relation/9272843`: [Museo del Banco Central](https://www.openstreetmap.org/relation/9272843).
- `way/149957847`: [Museo de la Cárcova](https://www.openstreetmap.org/way/149957847).

## Archivos de esta intervención

`server/osm.js`, `scripts/overpass-client.js`, `scripts/refresh-osm.js`,
`scripts/check-browser.js`, `data/osm-imports.json`, `data/verifiedPlaces.js`,
`data/place-photos.json`, `src/services/openStreetMap.js`,
`src/utils/placeIllustration.js`, `src/utils/planUtils.js`,
`src/components/OpenDataTodaySection.jsx`, `vite.config.js`, `eslint.config.js`,
`.gitignore`, `tests/local-catalog.test.js`, `tests/osm-import.test.js`,
`OSM_INTEGRATION.md` y este informe.

No se cambió CSS ni los 129 registros originales. No hubo publicación en Vercel.
