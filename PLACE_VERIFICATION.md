# Revisión de los diez lugares de OSM — 15/11/2026

Los diez lugares adicionales se originaron en el [extracto de Museos Abiertos](https://raw.githubusercontent.com/MuseosAbiertos/Leaflet-museums-OpenStreetMap/principal/data/export.geojson),
generado con datos de OpenStreetMap del **1 de julio de 2019**. No eran lugares
inventados, pero esa fecha no acreditaba su vigencia actual.

Se intentó consultar los IDs actuales de OSM en dos lecturas agrupadas (ways y
relations). La herramienta de consulta no pudo acceder a ambos endpoints; no se
obtuvo una actualización OSM. No se continuó reintentando ni se cambió su fecha
para simular una descarga reciente.

Se contrastaron identidad y ubicación con fuentes institucionales gratuitas. La
fecha **15/11/2026 es la fecha de consulta**, no la publicación de todas esas
páginas ni una constatación presencial. Algunas páginas de Cultura devolvieron
403 al abrirse: en esos casos se usó su contenido indexado, marcado explícitamente
como `search-index`. Los accesos directos están marcados como `page`.

| Lugar incorporado | Dirección o ubicación mostrada | Fuente consultada |
| --- | --- | --- |
| Manzana de las Luces | Perú 294 | [Directorio de Cultura](https://www.argentina.gob.ar/cultura/museos-institutos/museos) |
| Museo de Arte Español Enrique Larreta | Avenida Juramento 2291 | [Museos de la Ciudad](https://buenosaires.gob.ar/cultura/museos/museos-de-la-ciudad) |
| Museo del Banco Central | San Martín 216 | [BCRA: programación 2026](https://www.bcra.gob.ar/exposiciones-2026/) |
| Casa Nacional del Bicentenario | Riobamba 985 | [Información de visita](https://casadelbicentenario.cultura.gob.ar/info/visita/) |
| Museo River Plate | Avenida Presidente Figueroa Alcorta, CABA | [Sitio del museo](https://www.riverplate.com/museo) y [programa GCBA noviembre 2026](https://buenosaires.gob.ar/sites/default/files/2026-11/La-Noche-de-los-Museos-2026.pdf) |
| Instituto Nacional Sanmartiniano | Mariscal Castilla 2752 | [Cultura: noviembre 2026](https://cultura.gob.ar/los-rostros-del-general-san-martin-en-el-instituto-nacional-sanmartini-17724/) |
| Museo de la Cárcova | Avenida España 1701 | [Universidad Nacional de las Artes](https://museodelacarcova.una.edu.ar/) |
| Buque Museo Corbeta A.R.A. Uruguay | Puerto Madero, Dique 4, CABA | [Armada Argentina](https://www.argentina.gob.ar/armada/museos/buque-uruguay) |
| Buque Museo Fragata A.R.A. Presidente Sarmiento | Puerto Madero, Dique 3, CABA | [Armada Argentina](https://www.argentina.gob.ar/armada/museos/buque-presidente-sarmiento) |
| Museo Casa Rosada | Avenida Paseo Colón 100 | [Presidencia de la Nación](https://www.argentina.gob.ar/secretariageneral/museo-casa-rosada/museo-casa-rosada) |

## Cambios y límites

Se corrigió la dirección mostrada del Instituto Sanmartiniano de 2900 a 2752,
según la programación institucional de noviembre de 2026. Para los buques se
muestra el dique publicado por la Armada.

Para Museo River, el sitio del museo publica 7509 y el programa de GCBA publica
7597. Se eliminó de la tarjeta la altura antigua 7549 y se muestra solo la calle,
con una advertencia de acceso pendiente. No se eligió una numeración por
suposición. Su existencia y calle están corroboradas, no su acceso exacto.

**Resultado:** diez lugares reales de CABA incorporados y corroborados por fuentes
institucionales; nueve con dirección o ubicación completa y uno con precisión de
calle. Junto con los 129 originales, quedan **139 propuestas**. Esta revisión no
añadió lugares nuevos de AMBA ni validó individualmente los 129 planes originales.

No se incorporaron horarios, precios, teléfonos ni fotografías nuevas. Las diez
tarjetas usan el SVG genérico existente, sin atribuirle una fotografía del lugar.
La presencia en una fuente institucional no garantiza que el lugar esté abierto
el día de la visita; el enlace oficial permite comprobar condiciones actuales.

## Datos guardados y atribución

- `data/osm-caba.json`: extracto OSM original **intacto**, con sus IDs, geometría,
  fecha y atribución © OpenStreetMap contributors, bajo [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
- `data/place-verifications.json`: verificación por ID, `verifiedOn`, campos
  contrastados, dirección actual mostrada, editor y URL de cada fuente, modo de
  acceso y discrepancias. Registra solo hechos mínimos y referencias, sin copiar
  textos descriptivos, imágenes ni horarios institucionales. La licencia GCBA
  CC BY 2.5 AR se conserva donde fue confirmada en su página; no se atribuyen
  licencias no comprobadas al resto de los sitios.
- `data/verifiedPlaces.js`: combina ambos sin sobrescribir los tags OSM ni
  confundir la fecha de verificación con la de las coordenadas.
- Las tarjetas conservan `verifiedOn`, `verification`, `provenance`, `osmTimestamp`
  y `sourceUrl`. El sitio oficial ya disponible abre la fuente institucional.

Las **coordenadas siguen siendo del extracto del 01/07/2019**; no fueron
revalidadas geométricamente. Cada registro conserva esa advertencia en sus datos
y detalles. No se presentan como coordenadas actualizadas en 2026.

## Funcionamiento durante la presentación

El backend y el cliente incluyen estos archivos locales. No consultan Overpass
durante las visitas. La versión de caché se renovó para descartar tarjetas
antiguas; una respuesta HTTP vieja no puede quitar la nueva verificación.
Los nombres, direcciones, fuentes y fechas permanecen disponibles si falla la
API. Las imágenes remotas de otros planes y Firebase mantienen su comportamiento.

Para comprobarlo:

```powershell
npm.cmd run dev
```

Buscar `Sanmartiniano`, `Cárcova` y `River`, sin filtros de presupuesto. En los
detalles, revisar la fecha de verificación, la fecha de coordenadas y el enlace
oficial. Abrir `/api/places` para inspeccionar fuentes y metadatos de cada lugar.

```powershell
npm.cmd run build
npm.cmd run lint
node --test tests/local-catalog.test.js tests/places.test.js tests/place-verification.test.js
```

Las pruebas comprueban 129 originales + 10 adiciones, procedencia por registro,
fechas separadas, correcciones de dirección, advertencia de River, ausencia de
horarios y fotos inventados, funcionamiento sin red y caché anterior.

No se modificaron Firebase, el catálogo original, la estructura de la página ni
sus estilos. No se publicó nada en Vercel.
