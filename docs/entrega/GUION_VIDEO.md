# Guion de demostración — Por Hacer

Duración orientativa: 4 a 6 minutos. Usar una cuenta de demostración propia y eliminar únicamente registros creados para este video. El objetivo es mostrar datos reales en Firestore desde la URL publicada, no solamente una pantalla que cambia.

## Antes de grabar

Completar nombre/LU y la URL final. Abrir la web publicada, Firebase Console, el repositorio y src/services/firebase.js. Iniciar sesión antes de grabar para no mostrar la contraseña. En la consola, seleccionar el mismo proyecto y base (default). Buscar el UID en Authentication → Users y abrir users/UID/savedPlans.

Si el diagnóstico muestra local-preview, detener la demostración de persistencia: esa versión no está conectada a Firestore. Si sigue la diferencia de ocho elementos y cuatro documentos, obtener window.porHacerDiagnostico() y contrastar proyecto y UID antes de grabar.

## 0:00 — Problema y público

“Por Hacer ayuda a encontrar lugares reales en Buenos Aires y a convertirlos en salidas organizadas. Se pueden guardar propuestas, armar itinerarios, agendarlas y conservar recuerdos.”

Mostrar las cuatro categorías, búsqueda y detalles. Aclarar que los 84 lugares están incluidos en la aplicación y que la información personal es la que se persiste en Firebase.

## 0:40 — Dónde se conecta Firebase

Mostrar src/services/firebase.js: firebaseConfig se obtiene de import.meta.env; initializeApp inicia Firebase. watchSavedPlans usa onSnapshot para leer users/UID/savedPlans. savePlan crea, updateSavedPlan modifica y removeSavedPlan elimina un guardado. No mostrar .env.local ni credenciales administrativas.

## 1:15 — Crear y leer

Elegir El Progreso en Gastronomía + Zona Sur. Guardarlo desde la aplicación y mostrar users/UID/savedPlans/badata-food-905 en la consola. Explicar id, catalogId, favorite, status y updatedAt. Recargar la web y mostrar que la tarjeta sigue presente.

## 2:00 — Modificar y persistir

Marcar favorito y realizado, y comprobar favorite = true y status = realizado en el mismo documento. Agregar una fecha y mostrar scheduledAt. Abrir Calendario y Recuerdos. Recargar y confirmar que los cambios permanecen.

## 2:50 — Valorar e itinerarios

Desde Recuerdos, marcar cuatro estrellas. Mostrar rating = 4 en el guardado y plans/badata-food-905/ratings/UID con value = 4. Crear o abrir un itinerario de prueba: en users/UID/savedPlans aparece un UUID con type = itinerary e items. Renombrarlo y comprobar que no se crea otro documento.

## 3:40 — Eliminar el registro de prueba

Eliminar únicamente el guardado El Progreso creado para el video. Mostrar que desaparece users/UID/savedPlans/badata-food-905. Recargar y confirmar que no vuelve a Mis planes ni al calendario. Explicar que la valoración global se conserva por diseño; no eliminarla desde la consola.

## 4:10 — Responsive, permisos e iteraciones

Activar el modo de dispositivos del navegador y mostrar navegación, cabecera sticky, categorías en una fila y formulario. Aclarar que otra sesión con la misma cuenta consulta el mismo UID.

Mostrar firestore.rules: los datos personales se restringen al usuario autenticado. Contar brevemente las iteraciones: prototipo inicial, catálogo verificado, versión de 84 lugares y refinamiento responsive. Mencionar una decisión propia de diseño y un problema investigado con ayuda de IA.

## Cierre

Mostrar la URL de Vercel y el repositorio actualizados. No afirmar que una acción funcionó si hay un error: registrar el error, resolverlo y repetir esa parte de la demostración.

Consultar ../DEMOSTRACION_FIREBASE.md para las rutas y los campos completos.
