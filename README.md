# Informe Dinámico de Apuestas - Peña "Don Antonio Márquez"

Este proyecto implementa un informe web interactivo y adaptable para la peña "Don Antonio Márquez", diseñado para visualizar y seguir de cerca todas las operaciones de apuestas (ventas y pagos/premios) en Loterías y Apuestas del Estado, así como las apuestas de la ONCE. Además, incluye una potente herramienta de seguimiento interactivo para las jornadas de Quiniela y una sección de comentarios gestionada online.

## 🚀 Funcionalidades Principales

*   **Resumen General de Operaciones:**
    *   Visualización del gasto total, premios recibidos y balance neto de la peña.
    *   Gráfico circular que muestra el desglose del gasto por tipo de juego.
    *   Filtrado de apuestas por tipo de juego y ordenación por fecha o importe.
    *   Detalle expandible para cada apuesta, mostrando números jugados, códigos, etc.
    *   Enlaces directos a las páginas oficiales de resultados para cada sorteo, facilitando la comprobación manual.

*   **Seguimiento Interactivo de Quiniela (Jornada 66 - ampliable):**
    *   Página dedicada para una jornada específica de Quiniela.
    *   Tabla de partidos con nombres de equipos y horarios.
    *   Selección interactiva de los resultados de los partidos (1, X, 2 y Pleno al 15).
    *   Cálculo dinámico y visualización del número de aciertos (Signos 1X2) en las apuestas de la peña según el pronóstico del usuario, mostrando el desglose (X/Y N de M apuestas).
    *   Presentación agrupada de las apuestas de la peña por número de aciertos, con resaltado visual (verde para aciertos, azul para no seleccionados por el usuario, rojo para fallos).
    *   Indicador de acierto del Pleno al 15 para las apuestas de la peña.

*   **Sección de Comentarios:**
    *   Página pública donde los usuarios pueden leer comentarios relevantes para la peña.
    *   Ordenación de comentarios por fecha o título.
    *   Los comentarios se gestionan y persisten utilizando Firebase Firestore (Backend as a Service).

*   **Panel de Administración (Acceso Restringido):**
    *   Página oculta por URL (`dime.html`) para la gestión de comentarios.
    *   Acceso protegido por contraseña (definida en el código JavaScript para este entorno estático).
    *   Permite añadir, editar y eliminar comentarios existentes.
    *   Incluye un captcha simple para la inserción de nuevos comentarios.
    *   **Nota:** La persistencia de datos se logra mediante Firebase Firestore. La administración de la base de datos es online, pero la autenticación es básica para la simplicidad de este proyecto estático.

## 🛠️ Tecnologías Utilizadas

*   **HTML5:** Estructura de la aplicación.
*   **CSS3:** Estilos responsivos y atractivos (incluyendo Grid y Flexbox).
*   **JavaScript (ES6+):** Lógica interactiva, carga de datos dinámicos y manipulación del DOM.
*   **Firebase Firestore:** Base de datos NoSQL en la nube para la persistencia de comentarios.
*   **Chart.js:** Librería JavaScript para la generación de gráficos.
*   **Font Awesome:** Iconos vectoriales para mejorar la interfaz de usuario.
*   **GitHub Pages:** Alojamiento gratuito y despliegue continuo de la aplicación web estática.

## 📂 Estructura del Proyecto
apuestas/
├── index.html # Página principal del informe de apuestas
├── style.css # Estilos CSS generales
├── script.js # Lógica JS para la página principal
├── data.json # Datos de todas las apuestas (ventas y pagos)
├── quiniela-jornada.html # Página de seguimiento interactivo de Quiniela
├── quiniela-jornada-style.css # Estilos específicos de la página de Quiniela
├── quiniela-jornada-script.js # Lógica JS para la página de Quiniela
├── quiniela_jornada_66.json # Datos de partidos de la Jornada 66
├── quiniela_bets_jornada_66.json # Apuestas de la peña para la Jornada 66
├── comentarios.html # Página pública de comentarios
├── comentarios-style.css # Estilos específicos de la página de comentarios
├── comentarios-script.js # Lógica JS para la página de comentarios (lectura de Firebase)
├── dime.html # Página de administración de comentarios (OCULTA por URL)
├── dime-style.css # Estilos específicos de la página de administración
├── dime-script.js # Lógica JS para la página de administración (CRUD en Firebase)
└── images/ # Contiene los logotipos y el favicon
├── favicon.ico
├── logo_bonoloto.png
├── logo_euromillones.png
├── logo_gordoprimitiva.png
├── logo_loteria.png
├── logo_loterias_y_apuestas_estado.png
├── logo_once.png
├── logo_primitiva.png
└── logo_quiniela.png


## 🚀 Despliegue y Acceso

Esta aplicación está desplegada utilizando GitHub Pages.

*   **URL Principal:** `https://[TuUsuarioGitHub].github.io/apuestas/`
    *(Reemplaza `[TuUsuarioGitHub]` con tu nombre de usuario de GitHub, ej. `https://torrija.github.io/apuestas/`)*
*   **Página de Seguimiento Quiniela:** `https://[TuUsuarioGitHub].github.io/apuestas/quiniela-jornada.html`
*   **Página de Comentarios:** `https://[TuUsuarioGitHub].github.io/apuestas/comentarios.html`
*   **Panel de Administración (Acceso Directo):** `https://[TuUsuarioGitHub].github.io/apuestas/dime.html`
    *   Acceso protegido por contraseña (`ADMIN_PASSWORD` configurada en `dime-script.js`).

## ⚙️ Configuración (Para Desarrolladores / Mantenimiento)

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/Torrija/apuestas.git
    cd apuestas
    ```
2.  **Configuración de Firebase:**
    *   Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
    *   Habilita **Cloud Firestore** y crea una colección llamada `comentarios` (en modo de prueba inicialmente).
    *   Registra una aplicación web en tu proyecto Firebase para obtener tu `firebaseConfig`.
    *   **Pega tus credenciales `firebaseConfig`** en `comentarios-script.js` y `dime-script.js`.
    *   **Define tu `ADMIN_PASSWORD`** en `dime-script.js`.
3.  **Despliegue con GitHub Pages:**
    *   En la configuración de tu repositorio de GitHub, ve a `Settings > Pages`.
    *   Configura la fuente (`Source`) en `Deploy from a branch`, selecciona la rama `main` y la carpeta `/ (root)`.
    *   Guarda los cambios.

## 🤝 Contribución

Si deseas contribuir o proponer mejoras, no dudes en abrir un `Issue` o un `Pull Request` en el repositorio.

## 📝 Licencia

Este proyecto es de uso libre para la Peña "Don Antonio Márquez".

---