document.addEventListener('DOMContentLoaded', () => {
    // ** TU CONFIGURACIÓN DE FIREBASE AQUÍ **
    // Pega el objeto firebaseConfig que obtuviste de la consola de Firebase.
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAx3VCiCbNbDH3KLI5KSCsalEXt6ZiT0Cs",
    authDomain: "pena-don-antonio-comentarios.firebaseapp.com",
    projectId: "pena-don-antonio-comentarios",
    storageBucket: "pena-don-antonio-comentarios.firebasestorage.app",
    messagingSenderId: "201882659057",
    appId: "1:201882659057:web:07886d4b4f17e1ca192150"
  };

    // Inicializa Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const commentsCollection = db.collection('comentarios');

    // ** CONTRASEÑA DE ADMINISTRADOR ** (¡NO USAR EN PRODUCCIÓN REAL!)
    const ADMIN_PASSWORD = "Tr3c3."; // <--- CAMBIA ESTO

    // Elementos del DOM
    const loginSection = document.getElementById('loginSection');
    const loginForm = document.getElementById('loginForm');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginMessage = document.getElementById('loginMessage');
    const adminPanel = document.getElementById('adminPanel');
    const logoutButton = document.getElementById('logoutButton');

    const addCommentForm = document.getElementById('addCommentForm');
    const commentTitleInput = document.getElementById('commentTitle');
    const commentContentTextarea = document.getElementById('commentContent');
    const captchaQuestionSpan = document.getElementById('captchaQuestion');
    const captchaInput = document.getElementById('captchaInput');
    const captchaMessage = document.getElementById('captchaMessage');
    const addCommentMessage = document.getElementById('addCommentMessage');
    const existingCommentsList = document.getElementById('existingCommentsList');

    let captchaResult; // Para almacenar el resultado del captcha

    // --- Autenticación Simple ---
    function generateCaptcha() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        captchaResult = num1 + num2;
        captchaQuestionSpan.textContent = `¿Cuánto es ${num1} + ${num2}?`;
        captchaInput.value = ''; // Limpiar campo de entrada del captcha
        captchaMessage.textContent = '';
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPassword = adminPasswordInput.value;

        if (enteredPassword === ADMIN_PASSWORD) {
            loginSection.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            localStorage.setItem('adminLoggedIn', 'true'); // Mantener sesión simple
            loadExistingComments();
            generateCaptcha(); // Generar el primer captcha
        } else {
            loginMessage.textContent = 'Contraseña incorrecta.';
            loginMessage.style.color = 'red';
        }
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('adminLoggedIn');
        loginSection.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        adminPasswordInput.value = ''; // Limpiar contraseña
        loginMessage.textContent = '';
        existingCommentsList.innerHTML = '<p class="loading-message">Cargando comentarios existentes...</p>'; // Resetear
    });

    // Comprobar si el administrador ya está logueado al cargar la página
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        loginSection.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        loadExistingComments();
        generateCaptcha();
    }

    // --- Gestión de Comentarios ---

    // Formatea un timestamp de Firestore
    function formatFirestoreTimestamp(timestamp) {
        if (!timestamp) return 'Fecha desconocida';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

// Cargar y mostrar comentarios existentes
async function loadExistingComments() {
    existingCommentsList.innerHTML = '<p class="loading-message">Cargando comentarios...</p>';
    try {
        // Ordenar por fecha, los más recientes primero
        const snapshot = await commentsCollection.orderBy('fecha', 'desc').get();
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        existingCommentsList.innerHTML = '';
        if (comments.length === 0) {
            existingCommentsList.innerHTML = '<p>No hay comentarios registrados.</p>';
            return;
        }

        comments.forEach(comment => {
            const commentCard = document.createElement('div');
            commentCard.className = 'admin-comment-card'; // Clase específica para admin
            commentCard.dataset.id = comment.id; // Guardar ID para editar/eliminar

            // Usamos encodeURIComponent para el contenido que va a data-content
            // Y pasamos el titulo directamente, ya que un titulo no suele tener HTML peligroso
            commentCard.innerHTML = `
                <div class="comment-header">
                    <h4>${comment.titulo}</h4>
                    <div class="comment-actions">
                        <button class="edit-comment-button button-action" data-id="${comment.id}" 
                            data-title="${encodeURIComponent(comment.titulo)}" 
                            data-content="${encodeURIComponent(comment.contenido)}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="delete-comment-button button-action button-danger" data-id="${comment.id}">
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </button>
                    </div>
                </div>
                <div class="comment-content-preview">${comment.contenido}</div>
                <p class="comment-date">ID: ${comment.id} | Publicado: ${formatFirestoreTimestamp(comment.fecha)}</p>
            `;
            existingCommentsList.appendChild(commentCard);
        });

        // Añadir listeners a los botones de editar y eliminar
        existingCommentsList.querySelectorAll('.edit-comment-button').forEach(button => {
            button.addEventListener('click', startEditComment);
        });
        existingCommentsList.querySelectorAll('.delete-comment-button').forEach(button => {
            button.addEventListener('click', deleteComment);
        });

    } catch (error) {
        console.error("Error al cargar comentarios existentes:", error);
        existingCommentsList.innerHTML = '<p class="error-message">Error al cargar comentarios.</p>';
    }
}

    // Helper para escapar HTML para atributos data-
    // Convierte caracteres especiales HTML a sus entidades.
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, """)
            .replace(/'/g, "'"); // O '
    }

    // Helper para desescapar HTML desde atributos data- o similar
    // Convierte entidades HTML de vuelta a caracteres.
    function unescapeHtml(escaped) {
        const doc = new DOMParser().parseFromString(escaped, 'text/html');
        return doc.documentElement.textContent;
    }

    // Helper para desescapar HTML (para rellenar textarea)
    // Ahora usa decodeURIComponent para el contenido de los data-atributos
    function startEditComment(event) {
        const button = event.target.closest('.edit-comment-button');
        const commentId = button.dataset.id;
        const commentTitle = decodeURIComponent(button.dataset.title); // Desescapar aquí
        const commentContent = decodeURIComponent(button.dataset.content); // Desescapar aquí

        // Rellenar el formulario de añadir/editar
        commentTitleInput.value = commentTitle;
        commentContentTextarea.value = commentContent; // Ya viene correctamente desescapado
        addCommentForm.dataset.editingId = commentId; // Guardar el ID que estamos editando
        addCommentMessage.textContent = 'Editando comentario...';
        addCommentMessage.style.color = 'blue';

        // Desplazarse al formulario para que el usuario lo vea
        addCommentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }


    // Añadir/Editar comentario
    addCommentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = commentTitleInput.value.trim();
        const content = commentContentTextarea.value.trim();
        const editingId = addCommentForm.dataset.editingId;

        // Validar Captcha
        if (parseInt(captchaInput.value) !== captchaResult) {
            captchaMessage.textContent = 'Respuesta del captcha incorrecta.';
            captchaMessage.style.color = 'red';
            generateCaptcha(); // Generar nuevo captcha
            return;
        } else {
            captchaMessage.textContent = '';
        }

        addCommentMessage.textContent = 'Guardando...';
        addCommentMessage.style.color = 'blue';

        try {
            if (editingId) {
                // Editar comentario existente
                await commentsCollection.doc(editingId).update({
                    titulo: title,
                    contenido: content
                    // La fecha no se actualiza al editar
                });
                addCommentMessage.textContent = 'Comentario actualizado con éxito.';
            } else {
                // Añadir nuevo comentario
                await commentsCollection.add({
                    titulo: title,
                    contenido: content,
                    fecha: firebase.firestore.FieldValue.serverTimestamp() // Fecha del servidor
                });
                addCommentMessage.textContent = 'Comentario añadido con éxito.';
            }
            addCommentMessage.style.color = 'green';
            
            // Limpiar formulario y recargar comentarios
            commentTitleInput.value = '';
            commentContentTextarea.value = '';
            delete addCommentForm.dataset.editingId; // Quitar el ID de edición
            generateCaptcha(); // Nuevo captcha después de guardar
            loadExistingComments(); // Recargar la lista
            
        } catch (error) {
            console.error("Error al guardar/actualizar comentario:", error);
            addCommentMessage.textContent = `Error al guardar: ${error.message}`;
            addCommentMessage.style.color = 'red';
        }
    });

    // Eliminar comentario
    async function deleteComment(event) {
        const commentId = event.target.closest('.delete-comment-button').dataset.id;
        if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
            return;
        }

        try {
            await commentsCollection.doc(commentId).delete();
            alert('Comentario eliminado con éxito.');
            loadExistingComments(); // Recargar la lista
        } catch (error) {
            console.error("Error al eliminar comentario:", error);
            alert(`Error al eliminar: ${error.message}`);
        }
    }
});