# Por Hacer: versión con el catálogo original

## Punto de recuperación

Antes de editar se creó el commit **9051568**, con el mensaje
`Punto de recuperacion antes de retirar APIs de lugares y eventos`.
Conserva el código y los datos de la integración anterior para recuperación.
No se incluyeron archivos .env ni se modificaron credenciales. El cambio previo
de `.env.example` se dejó intacto.

## Qué se retiró

- Las consultas y actualizadores de lugares, el endpoint `/api/places`, el
  servicio del frontend y la configuración exclusiva de esa función en Vercel.
- Los cinco archivos de datos y procedencia de los diez lugares adicionales,
  las ilustraciones y las utilidades exclusivas de esa integración.
- La sección «Planes para hacer hoy», su componente, sus mensajes y sus estilos.
- Los mensajes, botones y atribuciones relacionados con la integración retirada.
- Las pruebas y los informes que dependían exclusivamente de esa integración.

No quedan consultas a proveedores de lugares/eventos en el código de la
aplicación. Las antiguas claves de caché del navegador ya no se leen ni se usan.
No se limpió almacenamiento personal del usuario. Las imágenes remotas y su
servicio compartido de fotografías se conservan como estaban; no obtienen planes.

## Qué se conserva

El catálogo local mantiene **los mismos 129 IDs y todos sus datos originales**:
títulos, descripciones, imágenes, categorías, ubicaciones y presupuestos. Se
compararon los archivos del catálogo con el commit de recuperación.

La suscripción al catálogo remoto solo combina metadatos para esos 129 IDs; no
agrega otros documentos a Descubrir planes. Los planes personales de Firebase se
siguen leyendo íntegramente, incluso si alguno había sido guardado desde la
integración anterior. No se eliminan ni editan esos documentos.

El arranque ya no invoca la migración de datos antiguos ni la siembra del
catálogo. Conserva las suscripciones de Firebase y las acciones de guardar,
editar, eliminar, valorar y subir imágenes solicitadas por el usuario.
`src/services/firebase.js`, `firestore.rules`, las credenciales y las dependencias
permanecen sin cambios. No se ejecutaron migraciones ni operaciones remotas.

El logo, colores, tipografías, navegación, tarjetas, filtros, calendario,
recuerdos, favoritos e itinerarios permanecen. Solo se retiraron de App.css las
seis reglas exclusivas de la sección eliminada; los archivos de src/styles no
se modificaron. No se publicó nada en Vercel.

## Archivos modificados

- `src/AppFirebase.jsx`: catálogo de 129, retirada de la sección, estados,
  efectos y textos externos; sin migración ni siembra al iniciar.
- `src/App.css`: retirada de estilos exclusivos de la sección eliminada.
- `src/utils/planUtils.js`: retirada del respaldo específico de imágenes externas.
- `vite.config.js`: retirada del middleware del endpoint eliminado.
- `tests/local-catalog.test.js`: comprobaciones del catálogo original y filtros.
- `scripts/check-browser.js`: comprobación en Chrome con datos locales aislados.
- Este informe.

Se eliminaron `api/places.js`, `vercel.json`, los cinco archivos de `data/`,
`server/osm.js`, `scripts/overpass-client.js`, `scripts/refresh-osm.js`,
`src/services/openStreetMap.js`, `src/components/OpenDataTodaySection.jsx`,
`src/utils/discoveryCatalog.js`, `src/utils/placeIllustration.js`,
las tres pruebas exclusivas y los tres informes anteriores de la integración.

## Comprobaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| Catálogo original, imágenes y IDs | 129, sin cambios frente al punto de recuperación |
| Búsqueda, categoría, zona y presupuesto | Pruebas aprobadas con el hook real |
| Detalles | Abiertos y cotejados los 129 en Chrome |
| Crear, editar y eliminar planes personales | Aprobado en vista previa local aislada |
| Favoritos, calendario, recuerdos e itinerarios | Aprobado en vista previa local |
| Móvil 390 px | Sin desbordamiento horizontal |
| Escritorio 1366 px | Tres columnas, sin desbordamiento |
| Excepciones JavaScript no controladas | Ninguna detectada en la prueba |
| Configuración de Firebase | Activada y completa; Authentication, Firestore y Storage inicializan |
| Login y CRUD remoto / subida a Storage | No probados con una cuenta autenticada; no hubo escrituras remotas |
| ESLint y npm run build | Aprobados |

El navegador de prueba bloquea los recursos HTTPS remotos intencionalmente: sus
fallos de carga simulados no prueban que todas las imágenes o fuentes remotas
estén disponibles en Internet. No se afirma una consola de red sin errores en
esas condiciones. La captura está en `.browser-check/mobile-catalog.png`.

## Cómo comprobarla localmente

```powershell
npm.cmd run dev
```

1. Abrir la URL indicada por Vite e iniciar sesión con tu cuenta habitual.
2. Confirmar «129 ideas» en Descubrir planes. «Ver más» permite recorrerlas todas.
3. Buscar un título y probar categoría, zona y presupuesto. Abrir Ver detalles.
4. Confirmar que ya no existe la sección Planes para hacer hoy ni avisos de APIs.
5. En tu cuenta, comprobar un plan personal de prueba: crear, editar, marcar
   favorito, agendar, marcar realizado y verlo en Recuerdos. Eliminar únicamente
   ese plan de prueba si ya no lo necesitás.

Las comprobaciones automáticas se repiten con:

```powershell
npm.cmd run build
npm.cmd run lint
node --test tests/local-catalog.test.js
node scripts/check-browser.js
```

El último comando requiere Chrome instalado; permite CHROME_PATH. Usa un perfil
temporal con Firebase desactivado únicamente para la prueba, sin editar .env ni
acceder a tus planes reales. No valida por sí solo la persistencia remota.
