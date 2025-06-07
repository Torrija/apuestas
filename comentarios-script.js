document.addEventListener('DOMContentLoaded', () => {
    const commentsListContainer = document.getElementById('commentsList');
    const sortCommentsBySelect = document.getElementById('sortCommentsBy');

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
    const commentsCollection = db.collection('comentarios'); // Nombre de tu colección

    let allComments = []; // Almacenará todos los comentarios cargados

    // --- Funciones de Utilidad ---

    // Formatea un timestamp de Firestore a una cadena de fecha legible
    function formatFirestoreTimestamp(timestamp) {
        if (!timestamp) return 'Fecha desconocida';
        // Firestore Timestamp objects have a toDate() method
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // --- Funciones de Renderizado ---

    function renderComments(commentsToDisplay) {
        commentsListContainer.innerHTML = ''; // Limpiar la lista actual
        if (commentsToDisplay.length === 0) {
            commentsListContainer.innerHTML = '<p class="loading-message">No hay comentarios para mostrar.</p>';
            return;
        }

        commentsToDisplay.forEach(comment => {
            const commentCard = document.createElement('div');
            commentCard.className = 'comment-card';

            commentCard.innerHTML = `
                <h3>${comment.titulo}</h3>
                <div class="comment-content">${comment.contenido}</div>
                <p class="comment-date">Publicado: ${formatFirestoreTimestamp(comment.fecha)}</p>
            `;
            commentsListContainer.appendChild(commentCard);
        });
    }

    // --- Funciones de Ordenación ---

    function applySort() {
        let sortedComments = [...allComments];
        const sortOption = sortCommentsBySelect.value;

        sortedComments.sort((a, b) => {
            // Asegurarse de que las fechas sean objetos Date para la comparación
            const dateA = a.fecha.toDate ? a.fecha.toDate() : new Date(a.fecha);
            const dateB = b.fecha.toDate ? b.fecha.toDate() : new Date(b.fecha);

            if (sortOption === 'fecha_asc') {
                return dateA - dateB;
            } else if (sortOption === 'fecha_desc') {
                return dateB - dateA;
            } else if (sortOption === 'titulo_asc') {
                return a.titulo.localeCompare(b.titulo);
            } else if (sortOption === 'titulo_desc') {
                return b.titulo.localeCompare(a.titulo);
            }
            return 0;
        });

        renderComments(sortedComments);
    }

    // --- Inicialización ---

    async function initializeCommentsPage() {
        commentsListContainer.innerHTML = '<p class="loading-message">Cargando comentarios...</p>';
        try {
            // Obtener comentarios de Firestore
            // Puedes añadir .orderBy() aquí si quieres un orden por defecto desde la BD
            const snapshot = await commentsCollection.orderBy('fecha', 'desc').get();
            allComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            applySort(); // Aplicar ordenación por defecto y renderizar

            // Añadir listener al selector de ordenación
            sortCommentsBySelect.addEventListener('change', applySort);

        } catch (error) {
            console.error("Error al cargar los comentarios de Firestore:", error);
            commentsListContainer.innerHTML = '<p class="loading-message error-message">Error al cargar los comentarios. Por favor, intente de nuevo más tarde.</p>';
        }
    }

    // Iniciar la aplicación
    initializeCommentsPage();
});