// Funciones de autenticación
async function login(email, password) {
    const result = await callAPI('login', 'POST', { email, password });
    
    if (result.success) {
        saveUser(result);
        showMessage(`Bienvenido ${result.nombre}`, 'success');
        
        // Redirigir según tipo
        if (result.tipo === 'CLIENTE') {
            renderizarPantallaCliente();
        } else if (result.tipo === 'PROPIETARIO') {
            renderizarPantallaPropietario();
        } else if (result.tipo === 'ADMIN') {
            renderizarPantallaAdmin();
        }
        return true;
    } else {
        showMessage(result.error || 'Credenciales incorrectas', 'error');
        return false;
    }
}

async function register(nombre, email, password, tipo) {
    const result = await callAPI('registro', 'POST', {
        nombre,
        email,
        password,
        tipo
    });
    
    if (result.success) {
        showMessage('Registro exitoso. Ahora inicia sesión', 'success');
        renderizarPantallaLogin();
        return true;
    } else {
        showMessage(result.error || 'Error al registrar', 'error');
        return false;
    }
}