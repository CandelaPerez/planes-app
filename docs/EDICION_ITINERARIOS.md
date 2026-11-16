# Edicion de itinerarios guardados

Punto de recuperacion: 0032a3d.

El editor permite cambiar el nombre y quitar una, varias o todas las actividades. Cancelar, cerrar o Escape descartan el borrador. No permite agregar, reordenar, cambiar descripciones ni fechas. La validacion de guardado tambien rechaza incorporaciones y cambios de orden.

Se utiliza updateSavedPlan sobre users/{uid}/savedPlans/{id}, conservando el mismo documento y todos los campos ajenos a title e items, incluidas fotos, ubicacion, fechas y recuerdos. La generacion de itinerarios nuevos conserva su comportamiento.

Pruebas: node --test tests/*.test.js; npm.cmd run lint; npm.cmd run build; node scripts/check-saved-local-browser.js. La prueba Firebase en scripts/check-itinerary-browser.js requiere Auth y Firestore emulados en demo-porhacer-tests. No utiliza produccion.

Verificacion realizada: 26 pruebas aprobadas, ESLint y build aprobados. Chrome local verifico estilos, cancelacion, guardado, recarga y editor a 390 px. Auth/Firestore emulados verificaron creacion, edicion del mismo documento, ausencia de duplicados, persistencia e aislamiento entre cuentas. Sin cambios en produccion ni publicacion en Vercel. Build conserva el aviso de tamano del paquete Firebase.
