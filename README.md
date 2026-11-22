# Por Hacer

Aplicación web responsive para descubrir lugares de Buenos Aires y organizar salidas. Permite guardar planes, crear itinerarios, marcar favoritos y experiencias realizadas, agendar fechas, valorar lugares y conservar recuerdos con fotos.

## Catálogo y funcionalidades

**Descubrir** reúne **84 lugares con fotografías reales verificadas**: 23 de Gastronomía, 21 de Cultura, 23 de Aire Libre y 17 de Íconos de BA. Se puede filtrar por categoría y zona, buscar por nombre o ubicación y cambiar el orden. Las atribuciones y licencias están disponibles en el pie de página.

- **Inicio** incluye el acceso **Explorá planes cerca tuyo** antes de **Tu calendario**. El menú principal ubica **Mapa** después de **Mis planes** y se adapta a pantallas chicas.
- **Mapa interactivo** muestra los **12 planes más cercanos** del catálogo en Leaflet con teselas de OpenStreetMap. Podés acercar, alejar, mover el mapa y centrarlo en tu ubicación.
- **Geolocalización y distancias.** Con tu permiso, el navegador obtiene tu ubicación. Si no está disponible, podés elegir como referencia un lugar del catálogo. El Obelisco es la referencia inicial. JavaScript calcula y ordena las distancias aproximadas en línea recta mediante la fórmula de Haversine, sin guardar la posición ni llamar al servicio de rutas para calcular la cercanía.
- **Ver detalles** en un marcador abre una ficha debajo del mapa. En escritorio, la fotografía ocupa la izquierda y la información la derecha. En celular, la foto aparece arriba. **Volver al mapa** regresa a la vista del mapa y conserva sus marcadores y posición.
- **Cómo llegar** abre un modal con el destino. Si autorizás compartir tu ubicación, OSRM de FOSSGIS calcula el recorrido a pie y Leaflet lo dibuja en el mapa. Si denegás el permiso o no se encuentra una ruta, podés seguir viendo el destino. Las rutas no requieren clave ni facturación.

El catálogo visible se carga desde `src/data/verifiedCatalog.json` y `src/data/tourismPlaces.json`, con los manifiestos `baDataPilot.json` y `baDataPhotos.json`. La selección funciona sin descargar el archivo histórico de 6.670 registros ni consultar una API externa de catálogo durante la visita. Se conservan ese archivo y los 129 identificadores antiguos para auditorías y compatibilidad.

## Tecnologías

React 19, Vite 8, JavaScript y CSS responsive. Firebase Authentication gestiona las sesiones, Cloud Firestore guarda datos personales y Cloud Storage aloja las fotos subidas. Leaflet muestra el mapa, OpenStreetMap aporta la cartografía y OSRM calcula recorridos a pie. ESLint y el ejecutor de pruebas de Node verifican el proyecto.

La geolocalización requiere HTTPS o un origen local seguro como `localhost`. La cartografía y los recorridos requieren conexión. Las atribuciones de OpenStreetMap y FOSSGIS aparecen en los mapas correspondientes. [Política de teselas de OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/) · [Uso y privacidad del servicio de rutas de FOSSGIS](https://routing.openstreetmap.de/about.html)

## Instalación y ejecución

Usá Node 20.19 o posterior dentro de la rama 20, o Node 22.12 o posterior. Se recomienda una versión LTS compatible.

```bash
git clone https://github.com/CandelaPerez/planes-app.git
cd planes-app
npm ci
```

Copiá `.env.example` a `.env.local`. En PowerShell, ejecutá `Copy-Item .env.example .env.local`. En macOS o Linux, usá `cp .env.example .env.local`. Para probar Firebase, registrá una aplicación web en el proyecto correspondiente, habilitá Authentication con correo y contraseña, Firestore y Storage, y completá las siete variables de la plantilla con la configuración web. Usá `VITE_USE_FIREBASE=true` para la entrega. Con `VITE_USE_FIREBASE=false` se usa una vista previa local. [Configuración de Firebase](docs/FIREBASE_SETUP.md)

```bash
npm run dev
npm run build
npm run preview
```

`dev` inicia Vite. `build` audita las fotografías y compila en `dist/`. `preview` sirve esa compilación. Si PowerShell bloquea `npm.ps1`, usá `npm.cmd`. Reiniciá Vite al cambiar variables.

## Firebase y persistencia

- Firestore guarda planes, itinerarios, fechas, favoritos y valoraciones personales en `users/{UID}/savedPlans/{ID}`. Los lugares usan su ID de catálogo y los itinerarios un UUID con `type: itinerary` e `items`.
- Las valoraciones globales se guardan en `plans/{ID}/ratings/{UID}`. Cloud Storage guarda fotos personales en `users/{UID}/plans/{ID}/{archivo}`.
- Las vistas personales ocultan registros históricos identificados sin borrarlos. Los itinerarios muestran actividades vigentes y los personalizados independientes se conservan. El proyecto no migra automáticamente datos de `localStorage` a Firestore.
- Las reglas incluidas en `firestore.rules` y `storage.rules` se revisan aparte de la publicación web. El diagnóstico `window.porHacerDiagnostico()` es de solo lectura y permite comparar el proyecto, el UID y los registros de la sesión. [Diagnóstico de sincronización](docs/DIAGNOSTICO_SINCRONIZACION.md)

## Organización

| Ruta | Contenido |
| --- | --- |
| `src/AppFirebase.jsx`, `src/components/` | Navegación, vistas y componentes del mapa y sus modales |
| `src/hooks/`, `src/utils/` | Filtros, Haversine y utilidades de Leaflet y planes personales |
| `src/services/` | Firebase, catálogo y consultas de rutas a OSRM |
| `src/data/`, `public/` | Catálogo, manifiestos, fotos, fuentes y archivo histórico |
| `src/styles/` | Estilos compartidos, diseño responsive y vistas |
| `scripts/`, `tests/`, `docs/` | Mantenimiento, pruebas y documentación de entrega |

Las fotos optimizadas conservan sus rutas y dimensiones para mantener la compatibilidad con los planes guardados. El inventario con tamaños y hashes está en [la documentación de optimización](docs/optimization/README.md).

## Validación y publicación

- `npm run check` ejecuta ESLint, pruebas de Node y compilación.
- `node scripts/check-verified-browser.js --isolated-build` verifica el catálogo, sus fotos, la navegación, los filtros y las funciones personales con almacenamiento local.
- `npm run test:responsive` comprueba el diseño en Chrome. `CHROME_PATH` permite indicar la ruta del navegador.
- Las pruebas de Firebase emulado usan el proyecto `demo-porhacer-tests`, con Auth en `127.0.0.1:9099` y Firestore en `127.0.0.1:8080`. Estas pruebas no certifican las reglas desplegadas ni una cuenta real. [Demostración de Firebase](docs/DEMOSTRACION_FIREBASE.md)

Vercel utiliza Vite, `npm run build` y `dist` según `vercel.json`. Si está conectado al repositorio de GitHub, los cambios en la rama de producción generan un despliegue automático. Las siete variables de la plantilla se configuran en el entorno **Production**. Vercel no publica las reglas de Firebase. [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite)

`.env.local`, las variantes locales, los artefactos de compilación y los resultados de pruebas están excluidos de Git. Solo se versiona `.env.example`. Las variables `VITE_` llegan al navegador y nunca deben contener claves privadas ni credenciales de cuentas de servicio.

## Entrega TP2

- [Repositorio GitHub](https://github.com/CandelaPerez/planes-app)
- [Aplicación en Vercel](https://planes-app-one.vercel.app)
- [Informe breve](docs/entrega/INFORME.md)
- [Bitácora de versiones y decisiones](docs/entrega/BITACORA.md)
- [Guion del video](docs/entrega/GUION_VIDEO.md)
- [Tareas de entrega](docs/entrega/PENDIENTES.md)
- [Pruebas y alcance de la evidencia](docs/entrega/VERIFICACION.md)

La documentación histórica describe etapas anteriores. Las capturas de entrega provienen de pruebas locales o emuladas.
