# Edición de itinerarios guardados

Punto de recuperación anterior al cambio: `d2e1d8f`.

En Mis planes → Itinerarios, el botón **Editar itinerario** y el icono de edición abren el mismo editor. Permite cambiar nombre y descripción, agregar actividades del catálogo visible, quitar actividades, ordenarlas con las flechas y cambiar o quitar la fecha. Se requiere al menos una actividad y no se permiten duplicados.

El editor trabaja sobre un borrador independiente. Cancelar, cerrar o pulsar Escape descarta sus cambios. Guardar utiliza `updateSavedPlan` sobre `users/{uid}/savedPlans/{id}`: conserva el documento original, favorito, estado, comentarios, valoraciones y fotografía personal. No crea otro itinerario. La ubicación se recalcula con las actividades seleccionadas; la portada sigue la primera actividad solamente si antes era su imagen automática.

Las actividades existentes conservan su información guardada, incluidas las personalizadas. Una actividad vinculada a un catálogo anterior o retirada del catálogo actual muestra un aviso y puede quitarse o reemplazarse agregando otra. No se elimina automáticamente. Las incorporaciones nuevas se validan contra el catálogo vigente también al guardar. Si falla la carga del catálogo, se puede editar lo existente sin agregar actividades no verificadas.

El cambio utiliza las reglas existentes de Firestore, que limitan cada documento a su cuenta. No modifica Auth, Storage ni las reglas. Cambiar de sesión cierra el editor. No se ejecutó ninguna limpieza de guardados ni se accedió a producción.

## Verificación

- `node --test tests/*.test.js`: 26 pruebas aprobadas, incluidas cuatro pruebas de composición, fechas y conservación de datos del itinerario.
- `npm run lint`: aprobado.
- `npm run build`: aprobado; permanece el aviso informativo de tamaño de Firebase.
- Con Auth/Firestore emulados en `demo-porhacer-tests`: ejecutar primero `node scripts/check-saved-firebase.js` y después `node scripts/check-itinerary-browser.js`. Requieren emuladores locales y Chrome, igual que las comprobaciones de guardados existentes.
- Prueba de navegador aprobada: crear, cancelar sin escrituras, editar el mismo ID, agregar sin duplicar, quitar un antiguo, reorganizar, conservar un personalizado y datos personales, cambiar y quitar fecha, recargar, cerrar/reabrir sesión, eliminar y rechazar la edición desde otra cuenta. El editor también se comprobó a 390 px de ancho.

Resultados privados de prueba: `.browser-check/itinerary-browser-result.json` y captura móvil `.browser-check/itinerary-editor-mobile.png`, ignorados por Git. Todas las cuentas y documentos utilizados son sintéticos. No se publicó en Vercel.
