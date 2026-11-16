# Informe breve — Por Hacer

Desarrollo Frontend II · TP2 · Martes, turno mañana · 2026

Nombre y apellido: PENDIENTE DE COMPLETAR.
LU: PENDIENTE DE COMPLETAR.
Integrantes adicionales, si corresponde: PENDIENTE DE CONFIRMAR.
Repositorio: https://github.com/CandelaPerez/planes-app
URL de Vercel: PENDIENTE DE COMPLETAR Y VERIFICAR.
Fecha de preparación: 16 de noviembre de 2026.

## Idea y público destinatario

Por Hacer ayuda a personas que buscan actividades en la Ciudad de Buenos Aires a pasar de una idea de salida a una experiencia organizada. Reúne lugares reales para descubrir, una lista personal, itinerarios, calendario y recuerdos. Está pensada para quienes quieren decidir qué hacer, guardar propuestas y recuperar su organización desde una computadora o un celular con la misma cuenta.

La propuesta agrega valor a un gestor de tareas básico: cada guardado se relaciona con un lugar verificado y puede transformarse en una salida agendada, una actividad realizada y un recuerdo con valoración y fotografía propia.

## Funciones implementadas

El catálogo seleccionado contiene 84 lugares con fotografías reales: Gastronomía 23, Cultura 21, Aire Libre 23 e Íconos de BA 17. Inicio permite filtrar por categoría, zona y texto, ordenar, consultar detalles y guardar. También ofrece una sugerencia al azar y la generación de itinerarios.

Mis planes permite consultar guardados, crear planes personalizados, marcar favoritos, cambiar entre pendiente y realizado, renombrar y eliminar guardados. Los itinerarios tienen su propio nombre y una lista de actividades; su editor permite renombrar y quitar actividades conservando el mismo documento. El calendario usa las fechas asignadas y Recuerdos reúne experiencias realizadas con comentario, puntuación y foto personal.

El acceso usa Firebase Authentication con correo y contraseña. Hay validaciones de formularios, estados de carga y mensajes de éxito o error. El diseño se adapta a escritorio, tablet y móvil. En móvil, la cabecera queda visible al desplazar, la navegación principal está abajo, las categorías caben en una fila y el cierre de sesión está en un menú de perfil.

## Información y arquitectura

La interfaz usa React y Vite, componentes compartidos, eventos, useState y useEffect. React se comunica directamente con Firebase mediante su SDK; la aplicación no necesita administrar un servidor propio.

El catálogo fotográfico está incluido en los archivos de la aplicación. Su selección y las atribuciones provienen de BA Data, Wikidata y Wikimedia Commons según cada registro. Los datos personales sí se guardan en Cloud Firestore: users/{UID}/savedPlans/{ID}. Cada documento conserva el lugar y los campos favorite, status, scheduledAt, comment, rating e image cuando corresponden. Un itinerario es otro documento de savedPlans con type: itinerary e items. Las fotos personales se guardan en Cloud Storage y su URL se registra en Firestore.

Las valoraciones globales usan plans/{ID}/ratings/{UID}. Los documentos heredados de plans no alimentan Inicio y no se borraron. Las vistas personales ocultan planes antiguos sin destruir sus registros. La configuración de Firebase está en src/services/firebase.js y lee import.meta.env; las reglas se conservan en firestore.rules y storage.rules.

## Decisiones de diseño

Se eligieron azul oscuro, superficies claras y bordes redondeados para mantener continuidad entre descubrimiento y organización personal. La escritura manuscrita identifica los encabezados: Shadows Into Light en escritorio y Zeyada en móvil. Los textos operativos usan una familia de lectura más regular.

Las sucesivas correcciones respondieron a problemas observados: categorías que ocupaban varias filas, controles grandes, navegación que desaparecía al desplazar y exceso de información técnica en los detalles. Se conservaron las funciones al compactar controles y se trasladaron las atribuciones a un acceso discreto de créditos. Las imágenes del catálogo son fotografías verificadas, no imágenes generadas por IA.

## Uso de inteligencia artificial

Se utilizó Codex, asistente de programación de OpenAI, para analizar archivos, proponer y aplicar cambios, revisar errores, preparar pruebas y documentar el proceso. Las decisiones sobre alcance, aspecto y comportamiento fueron ajustadas mediante instrucciones y correcciones de la estudiante. La salida de la IA se revisó mediante comparaciones con Git, pruebas automatizadas y recorridos del navegador.

Ejemplos reales y representativos de instrucciones dadas durante el proceso:

- “Creá un punto de recuperación Git antes de comenzar.”
- “Quiero que los nuevos planes se SUMEN a los existentes, no que los reemplacen.”
- “No borres información personal de Firestore; corregí únicamente la visualización”.
- “No quiero que sea necesario desplazarse horizontalmente para verlos.”
- “No alteres Firebase, las API ni las funcionalidades existentes.”
- “Antes de ocultar los créditos, verificá las condiciones de atribución y las licencias de las fotografías.”

## Pruebas y alcance

Se verificaron el catálogo completo, las fotografías, filtros, guardados e itinerarios mediante 30 pruebas de Node y recorridos de Chrome. Se comprobaron anchos 375, 390, 430, 768, 1024 y 1366 px y se comparó escritorio con el estado anterior en 1366 y 1440 px.

Con Authentication y Firestore emulados se reprodujo una cuenta con tres planes y cinco itinerarios: ocho documentos confirmados por el servidor bajo el mismo UID, persistentes tras recargar y volver a iniciar sesión. También se probaron creación, favorito, estado, calendario, valoración y eliminación de registros sintéticos. No se modificaron datos de producción.

Esta evidencia no acredita todavía la cuenta real ni la versión publicada. Quedan pendientes: confirmar la discrepancia reportada entre ocho elementos y cuatro documentos reales, verificar reglas desplegadas y ejecutar CRUD desde la URL final de Vercel. El informe debe actualizarse con esos resultados antes de presentarlo como validación completa.

## Entrega y publicación

El repositorio está identificado, pero al comprobarlo el 16/11/2026 su rama main remota todavía apuntaba a a583714, del 03/11/2026. La versión final está preparada localmente para actualizar ese repositorio. No se publicó en Vercel durante esta preparación, respetando la indicación de la estudiante. La URL final y la evidencia de un despliegue actualizado deben completarse antes de la entrega.
