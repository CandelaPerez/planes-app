# Lugares reales de OpenStreetMap

**Estado más reciente:** consultar [API_REPORT.md](API_REPORT.md). El actualizador
ahora agrega lotes por zona/categoría en `data/osm-imports.json`, no reemplaza el
extracto inicial. Las referencias fotográficas y el estado vacío de eventos
también se documentan en ese informe.

**Revisión del 15/11/2026:** los diez lugares ahora tienen una verificación
institucional separada del extracto OSM histórico. Consultar
[PLACE_VERIFICATION.md](PLACE_VERIFICATION.md) para las direcciones mostradas,
fuentes y límites actuales. La tabla siguiente conserva las direcciones del
extracto de 2019 como documentación de origen, no como direcciones vigentes.

## Resultado verificado

El catálogo original conserva **129 planes**. Se agregan **10 museos** de un
extracto real de OSM, sin duplicados por nombre: **139 propuestas disponibles**.
No se cambió CSS, estructura de tarjetas ni operaciones de Firebase.

Los diez registros proceden de [Museos Abiertos](https://github.com/MuseosAbiertos/Leaflet-museums-OpenStreetMap),
archivo [export.geojson](https://raw.githubusercontent.com/MuseosAbiertos/Leaflet-museums-OpenStreetMap/principal/data/export.geojson).
Su fecha OSM es **2019-07-01T00:50:02Z**. Son registros históricos verificables,
no una validación de que cada museo siga abierto en 2026. La descripción de las
tarjetas informa la fecha; se excluyeron los horarios y precios antiguos.

| Registro | Dirección del extracto | OSM |
| --- | --- | --- |
| Manzana de las Luces | Perú 294 | [relation/3228119](https://www.openstreetmap.org/relation/3228119) |
| Museo de Arte Español 'Enrique Larreta' | Avenida Juramento 2291 | [relation/6402696](https://www.openstreetmap.org/relation/6402696) |
| Museo del Banco Central | San Martín 216 | [relation/9272843](https://www.openstreetmap.org/relation/9272843) |
| Casa Nacional del Bicentenario | Riobamba 985 | [way/98897634](https://www.openstreetmap.org/way/98897634) |
| Museo River Plate | Avenida Presidente Figueroa Alcorta 7549 | [way/120102412](https://www.openstreetmap.org/way/120102412) |
| Instituto Sanmartiniano | Mariscal Ramón Castilla 2900 | [way/147938686](https://www.openstreetmap.org/way/147938686) |
| Museo de La Cárcova | Avenida España 1701 | [way/149957847](https://www.openstreetmap.org/way/149957847) |
| Buque Museo Corbeta A.R.A. Uruguay | Avenida Alicia Moreau de Justo 500 | [way/173065616](https://www.openstreetmap.org/way/173065616) |
| Buque Museo Fragata A.R.A. 'Presidente Sarmiento' | Puerto Madero. dique 3 | [way/173065810](https://www.openstreetmap.org/way/173065810) |
| Museo Casa Rosada | Avenida Paseo Colón 100 | [way/176333994](https://www.openstreetmap.org/way/176333994) |

## Causa del 503 anterior

El navegador llama a **GET /api/places**, implementado en `api/places.js`.
Antes, ese handler hacía POST a Overpass y convertía **cualquier** excepción
(red, timeout, JSON inválido o HTTP externo) en un 503 propio con el mismo texto.
El 503 visible no permitía afirmar que Overpass hubiera respondido HTTP 503.

La consulta combinaba cuatro grupos de etiquetas de gastronomía, cultura,
deportes y espacios verdes sobre `-34.91,-58.78,-34.28,-58.335`, el rectángulo
envolvente de todas las zonas AMBA. `out ... 220` limita la salida, no todo el
trabajo de selección previo. Además, kumi.systems es el nombre anterior del
servicio Private.coffee: no era un respaldo independiente.

En esta sesión, la terminal no pudo establecer conexión; la ampliación de
permisos fue rechazada. Las pruebas web pequeñas de museos sobre
overpass-api.de, private.coffee y maps.mail.ru tampoco fueron accesibles.
No se obtuvo un código HTTP externo verificable ni datos actuales de Overpass.
No se siguió reintentando. Esto no demuestra que los tres servicios estén caídos
para otros usuarios.

## Persistencia y actualización

`data/osm-caba.json` es un archivo ODbL separado del catálogo manual, incluido
en cada compilación y arranque. `/api/places` lo sirve sin consultar proveedores.
También está incluido en el cliente, que lo muestra inmediatamente y lo conserva
si falla el backend. Hay caché HTTP (navegador 1 hora, CDN 1 día), memoria y
localStorage (1 día). Una respuesta vacía, inválida o anterior no borra los datos.
La atribución y enlaces OSM siguen visibles; las imágenes son ilustrativas.

Actualizar es una operación **manual**, no ocurre por visita. En PowerShell:

```powershell
# Diagnóstico pequeño: máximo 12 museos del centro de CABA; no escribe datos.
node scripts/refresh-osm.js --probe

# Actualización explícita: solo museos de CABA, máximo 120 resultados.
node scripts/refresh-osm.js
```

El script imprime la consulta y cada resultado: HTTP externo, error de red,
timeout o payload inválido. Timeout QL: 10 s; timeout HTTP: 12 s por proveedor.
Intenta Private.coffee y VK Maps secuencialmente una vez, se detiene al obtener
datos válidos y no reintenta indefinidamente. Lee OVERPASS_API_URL y
OVERPASS_FALLBACK_URL de .env.local o del entorno; normaliza el alias kumi.
No ejecutar estos comandos en bucle. Ante límites de uso, respetar Retry-After.

Solo una respuesta completa con fecha OSM válida reemplaza el archivo mediante
escritura temporal y renombrado. Una actualización fallida deja intacto el
respaldo. Los cambios del archivo requieren reiniciar Vite o recompilar; no
publican nada automáticamente.

Alternativa investigada para renovar sin Overpass: el [extracto regional de
Argentina de Geofabrik](https://download.geofabrik.de/south-america/argentina.html),
filtrado localmente con Osmium. No se descargó el PBF completo (~415 MB).
El respaldo incluido es el extracto pequeño de Museos Abiertos, no ese PBF.

## Prueba local

```powershell
npm.cmd run dev
```

Abrir la URL indicada por Vite. En Descubrir planes, buscar `Cárcova` o `Banco
Central`, con categoría y zona en Todas y presupuesto en Todos. Verificar la
dirección, fecha de los datos y el enlace al registro OSM. Buscar también un
plan original, por ejemplo Café Tortoni. Revisar Mis planes con Firebase.

Abrir `/api/places`: debe responder 200 y mostrar 10 elementos, `datasetUrl`,
`osmTimestamp` y licencia. Desconectar Internet y recargar la aplicación local:
el extracto sigue disponible, aun con localStorage vacío. No implica que las
imágenes remotas o Firebase funcionen sin conexión.

```powershell
npm.cmd run build
npm.cmd run lint
node --test tests/local-catalog.test.js tests/places.test.js
```

Las pruebas verifican el catálogo de 129 sin modificaciones, diez adiciones,
renderizado real de una tarjeta OSM con enlace, conversión de dirección y
coordenadas, respaldo sin red, arranques en frío, caché y fallos HTTP/red/timeout.
Las pruebas de fallos usan respuestas controladas; no sustituyen una consulta
actual exitosa de Overpass. No se publicaron cambios en Vercel.

Datos derivados de © OpenStreetMap contributors, disponibles bajo
[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
