# Integración de BA Data

La página principal muestra los 6.670 registros de la copia local de BA Data, sin mezclarlos con los 129 planes originales. Estos se conservan en el código y en Firebase como respaldo: si el JSON falla, está vacío o contiene identificadores duplicados, se muestran los originales con un aviso. No se publicó en Vercel.

Punto de recuperación anterior a esta integración: commit `3d5c930`.

Hay un [piloto de doce tarjetas con títulos editoriales y ocho fotografías verificadas de Commons](PILOTO_FOTOS.md). Solo esos doce registros reciben esta presentación; los demás mantienen su nombre y descripción anteriores. Las fotografías y sus créditos se sirven localmente sin búsquedas durante las visitas. El nombre original se conserva para identificación y búsqueda.

Se reutilizan las tarjetas, estilos, filtros y paginación existentes (seis tarjetas iniciales, seis más por clic). La búsqueda y los filtros recorren todos los registros antes de paginar. Los lugares se guardan en `users/{uid}/savedPlans/badata-{fuente}-{id}`, conservando `catalogId` y procedencia. No se escriben documentos en el catálogo global ni se migran los originales. Los itinerarios conservan los datos de sus lugares y no reciben presupuesto gratuito cuando el recurso no informa precios.

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

La home y la vista previa descargan ese JSON del mismo servidor, una vez por sesión del módulo. No consultan BA Data, Geoapify, OpenStreetMap ni Overpass durante las visitas. No se asignan fotografías genéricas externas a los lugares de BA Data. No se agregaron dependencias ni se modificaron estilos.

## Probar localmente

```powershell
npm.cmd run dev
```

Abrir `http://localhost:5173/` (usar el puerto informado por Vite) e iniciar sesión si Firebase está habilitado. El contador debe indicar 6670 lugares de BA Data. Probar categorías, búsqueda por GUANTANAMERA, zonas, presupuesto, Ver más y detalles. En los detalles se puede comparar el ID y las coordenadas con el recurso original. `/ba-data-preview.html` conserva una vista independiente de solo lectura.

Para probar el respaldo, bloquear `/data/ba-data.json` desde las herramientas de red del navegador y recargar sin caché. Deben aparecer los 129 originales con un aviso. Quitar el bloqueo y recargar para volver a BA Data.

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
node scripts/check-browser.js --ba-data-home
```

La prueba de Chrome bloquea HTTPS externo y comprueba categorías, búsqueda, presupuesto, detalles de procedencia, ausencia de excepciones y ancho móvil. `--ba-data-home` prueba la home en modo local aislado, incluido guardar un lugar, favoritos, calendario y recuerdos. Sin argumentos se bloquea el JSON para comprobar los 129 detalles del respaldo y las funciones personales. `--production` comprueba la pantalla Firebase de la compilación y la disponibilidad del JSON estático. Las pruebas de Node verifican los 129 originales y que una actualización fallida no sobrescriba la copia. No se ejecutaron operaciones sobre documentos de Firestore ni pruebas autenticadas contra datos personales reales.
