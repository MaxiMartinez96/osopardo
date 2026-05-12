// Configuración de la API
const API_URL = '/osopardo/Index.php';

// Almacenar usuario actual
let usuarioActual = null;

// Helper para llamadas a la API
async function callAPI(action, method = 'GET', data = null) {
    let url = `${API_URL}?action=${action}`;
    const options = { 
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        options.body = JSON.stringify(data);
    }
    
    if (method === 'GET' && data) {
        const params = new URLSearchParams(data).toString();
        url += `&${params}`;
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error en API:', error);
        return { success: false, error: error.message };
    }
}

// Mostrar mensaje de error o éxito
function showMessage(message, type = 'success') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = message;
    msgDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#2E7D32' : '#C62828'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(msgDiv);
    setTimeout(() => msgDiv.remove(), 3000);
}

// Guardar usuario en localStorage
function saveUser(user) {
    localStorage.setItem('usuario', JSON.stringify(user));
    usuarioActual = user;
}

// Obtener usuario de localStorage
function getStoredUser() {
    const user = localStorage.getItem('usuario');
    if (user) {
        usuarioActual = JSON.parse(user);
        return usuarioActual;
    }
    return null;
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('usuario');
    usuarioActual = null;
    showMessage('Sesión cerrada', 'success');
    setTimeout(() => {
        window.location.href = '#login';
        renderizarPantallaLogin();
    }, 1000);
}