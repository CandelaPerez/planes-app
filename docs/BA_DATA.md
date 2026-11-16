# Vista previa de BA Data

La página principal conserva los 129 planes originales. Esta integración se consulta únicamente en `/ba-data-preview.html` y no escribe en Firebase. No se publicó en Vercel.

## Resultado verificado

Copia descargada el 15 de noviembre de 2026 (Buenos Aires). Hay **6.670 registros únicos** después de validar nombre, identificador y coordenadas y eliminar duplicados por nombre + dirección o nombre + coordenadas redondeadas a cuatro decimales.

| Categoría | Filas de origen | Registros únicos incorporados | Última modificación HTTP del archivo |
| --- | ---: | ---: | --- |
| Gastronomía | 2.823 | 2.811 | 22/08/2024 |
| Cultura | 3.053 | 2.962 | 04/10/2023 |
| Aire Libre | 2.176 | 843 | 06/07/2026 |
| Viajes | 54 | 54 | 06/11/2026 |

Las fechas HTTP corresponden al archivo servido, no certifican la actualidad de cada establecimiento. Los metadatos del portal, las fechas de descarga y las fechas del recurso se conservan separadamente. No se verificó individualmente que cada establecimiento siga abierto.

Viajes contiene **paradas del bus turístico**, no coordenadas de cada atractivo mencionado alrededor. En espacios verdes se conserva un vértice real del polígono publicado, identificado como referencia del límite y no como entrada. Se excluyen canteros centrales, complejos barriales, nombres genéricos o ausentes y registros sin coordenadas utilizables dentro del rango geográfico de CABA. El rango es una comprobación de plausibilidad, no una intersección con el límite administrativo.

El registro complementario `establecimientos_gastronomicos.csv` se pudo descargar pero no publica coordenadas; no se incorporó mediante ubicaciones estimadas. Tampoco se inventan precios, fotografías, horarios ni descripciones. Se usa la imagen de reserva existente, identificada como tal. Los presupuestos figuran como “Sin información”.

## Fuentes y licencia

- [Documentación oficial de la API](https://buenosaires.gob.ar/noticias/datos-abiertos-de-la-ciudad-como-acceder-de-forma-automatica-con-la-api-publica-de-ba-data).
- [Oferta y establecimientos gastronómicos](https://data.buenosaires.gob.ar/dataset/oferta-establecimientos-gastronomicos): recurso `e66613ef-aaf4-44aa-b89c-638c431fef0e`, CSV con punto y coma y decimales con coma.
- [Espacios culturales](https://data.buenosaires.gob.ar/dataset/espacios-culturales): recurso `juqdkmgo-711-resource`, CSV.
- [Espacios verdes](https://data.buenosaires.gob.ar/dataset/espacios-verdes): recurso `2a9af960-02a3-44bb-b57e-0a8295f6e0e2`, GeoJSON.
- [Bus turístico](https://data.buenosaires.gob.ar/dataset/bus-turistico): recurso `ae4f67cb-b53b-48ac-9067-c114b314eeba`, CSV con puntos WKT.

Fuente: BA Data, Gobierno de la Ciudad de Buenos Aires. [CC BY 2.5 Argentina](https://creativecommons.org/licenses/by/2.5/ar/). Se transformaron campos, filtraron registros y eliminaron duplicados; se conserva la procedencia de las coincidencias. Cada detalle muestra identificador original, coordenadas, enlace al recurso y atribución. El manifiesto conserva las URL exactas y SHA-256 del texto decodificado usado en la importación.

## API comprobada y persistencia

Base: `https://data.buenosaires.gob.ar/api/3/action/`.

`package_show?id=...` devolvió JSON válido para gastronomía, cultura y turismo desde Node. Para espacios verdes se dispone de `resource_show?id=...` y del recurso oficial CDN. Algunos intentos con otros clientes recibieron HTTP 200 con HTML “Request Rejected”: eso se trata como error, nunca como datos válidos. No se usa `datastore_search`: las consultas iniciales no devolvieron registros válidos; la copia se obtiene de los CSV/GeoJSON oficiales enlazados en CKAN.

El actualizador intenta `package_show`, luego `resource_show` si falla y finalmente la URL oficial conocida. Realiza consultas secuenciales, sin reintentos indefinidos; timeout de 15 segundos para metadatos y 30 para archivos. Valida estructura y contenido antes de reemplazar atómicamente `public/data/ba-data.json`. Si falla cualquier fuente conserva íntegra la copia anterior.

La vista previa solo descarga ese JSON del mismo servidor, una vez por sesión del módulo. No consulta BA Data, Geoapify, OpenStreetMap ni Overpass durante las visitas. El catálogo principal no descarga la copia. No se agregaron dependencias.

## Probar localmente

```powershell
npm.cmd run dev
```

Abrir `http://localhost:5173/ba-data-preview.html` (usar el puerto informado por Vite). Probar categorías, búsqueda por GUANTANAMERA, zonas, presupuesto y detalles. En los detalles se puede comparar el ID y las coordenadas con el recurso original. Volver a `/` muestra el catálogo original.

Actualizar explícitamente la copia, fuera de la presentación:

```powershell
node scripts/update-ba-data.js
```

Validación:

```powershell
npm.cmd run lint
node --test tests/*.test.js
npm.cmd run build
node scripts/check-browser.js --ba-data
```

La prueba de Chrome bloquea HTTPS externo y comprueba categorías, búsqueda, presupuesto, detalles de procedencia, ausencia de excepciones y ancho móvil. Las pruebas de Node verifican los 129 originales y que una actualización fallida no sobrescriba la copia. No se ejecutaron operaciones sobre documentos de Firestore ni pruebas autenticadas contra datos personales reales.
