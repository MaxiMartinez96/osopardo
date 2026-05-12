// ==================== RENDERIZADO DE PANTALLAS ====================

function renderizarPantallaLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <div style="text-align: center; margin-bottom: 32px;">
                <div class="logo" style="font-size: 60px; background: none;">🐻</div>
                <h1 style="color: #8B4513;">Oso Pardo</h1>
                <p>Pastelerías Artesanales</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Iniciar Sesión</span>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="loginEmail" placeholder="tu@email.com">
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="loginPassword" placeholder="••••••">
                    </div>
                    <button class="btn btn-primary btn-block" onclick="loginFromUI()">Ingresar</button>
                    <hr style="margin: 16px 0;">
                    <button class="btn btn-info btn-block" onclick="mostrarRegistro()">Registrarse</button>
                </div>
            </div>
        </div>
    `;
}

function mostrarRegistro() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <div style="text-align: center; margin-bottom: 32px;">
                <div class="logo" style="font-size: 60px; background: none;">🐻</div>
                <h1 style="color: #8B4513;">Crear Cuenta</h1>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="regNombre" placeholder="Tu nombre">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="regEmail" placeholder="tu@email.com">
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="regPassword" placeholder="••••••">
                    </div>
                    <div class="form-group">
                        <label>Tipo de cuenta</label>
                        <select id="regTipo">
                            <option value="CLIENTE">Cliente</option>
                            <option value="PROPIETARIO">Propietario</option>
                        </select>
                    </div>
                    <button class="btn btn-primary btn-block" onclick="registerFromUI()">Registrarse</button>
                    <hr style="margin: 16px 0;">
                    <button class="btn btn-info btn-block" onclick="renderizarPantallaLogin()">Volver al Login</button>
                </div>
            </div>
        </div>
    `;
}

async function loginFromUI() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await login(email, password);
}

async function registerFromUI() {
    const nombre = document.getElementById('regNombre').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const tipo = document.getElementById('regTipo').value;
    await register(nombre, email, password, tipo);
}

async function renderizarPantallaCliente() {
    const usuario = getStoredUser();
    if (!usuario) {
        renderizarPantallaLogin();
        return;
    }
    
    const tiendas = await callAPI('getTiendas', 'GET');
    
    let tiendasHtml = '';
    if (tiendas && !tiendas.error) {
        for (let t of tiendas) {
            tiendasHtml += `
                <div class="card" onclick="verTienda(${t.id})">
                    ${t.imagenUrl ? `<img src="${t.imagenUrl}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">` : '<div style="height: 150px; background: #e0d5c0; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-bottom: 10px; font-size: 40px;">🏪</div>'}
                    <div class="card-header">
                        <span class="card-title">🏪 ${t.nombre}</span>
                    </div>
                    <div class="card-body">
                        <p>📍 ${t.localidad}</p>
                        <p>📞 ${t.telefono}</p>
                        <p>🥖 ${t.sin_gluten ? 'Sin gluten' : 'Con gluten'}</p>
                    </div>
                </div>
            `;
        }
    }
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="header">
            <h1><span class="logo">🐻</span> Oso Pardo</h1>
            <button class="btn-logout" onclick="logout()">Salir</button>
        </div>
        
        <div class="tabs">
            <button class="tab active" data-tab="tiendas">🏪 Tiendas</button>
            <button class="tab" data-tab="reservas">📋 Mis Reservas</button>
            <button class="tab" data-tab="perfil">👤 Perfil</button>
        </div>
        
        <div id="tab-tiendas" class="tab-content active">
            <div class="container">
                <div class="form-group">
                    <input type="text" id="buscarLocalidad" placeholder="Buscar por localidad...">
                </div>
                <div id="listaTiendas">${tiendasHtml}</div>
            </div>
        </div>
        
        <div id="tab-reservas" class="tab-content">
            <div class="container">
                <div id="listaReservas">Cargando...</div>
            </div>
        </div>
        
        <div id="tab-perfil" class="tab-content">
            <div class="container">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">👤 ${usuario.nombre}</span>
                    </div>
                    <div class="card-body">
                        <p>📧 ${usuario.email}</p>
                        <p>🎫 ${usuario.tipo}</p>
                        <p>🆔 ID: ${usuario.id}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            if (tabId === 'reservas') {
                cargarMisReservas();
            }
        });
    });
    
    document.getElementById('buscarLocalidad')?.addEventListener('input', async (e) => {
        const localidad = e.target.value;
        let resultado = tiendas;
        if (localidad) {
            resultado = tiendas.filter(t => t.localidad.toLowerCase().includes(localidad.toLowerCase()));
        }
        mostrarListaTiendas(resultado);
    });
    
    cargarMisReservas();
}

function mostrarListaTiendas(tiendas) {
    const container = document.getElementById('listaTiendas');
    if (!container) return;
    
    let html = '';
    for (let t of tiendas) {
        html += `
            <div class="card" onclick="verTienda(${t.id})">
                ${t.imagenUrl ? `<img src="${t.imagenUrl}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">` : '<div style="height: 150px; background: #e0d5c0; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-bottom: 10px; font-size: 40px;">🏪</div>'}
                <div class="card-header">
                    <span class="card-title">🏪 ${t.nombre}</span>
                </div>
                <div class="card-body">
                    <p>📍 ${t.localidad}</p>
                    <p>📞 ${t.telefono}</p>
                    <p>🥖 ${t.sin_gluten ? 'Sin gluten' : 'Con gluten'}</p>
                </div>
            </div>
        `;
    }
    container.innerHTML = html || '<p>No hay tiendas disponibles</p>';
}

async function verTienda(tiendaId) {
    const productos = await callAPI('getProductos', 'GET', { tiendaId });
    const tiendas = await callAPI('getTiendas', 'GET');
    const tienda = tiendas.find(t => t.id === tiendaId);
    
    let productosHtml = '';
    if (productos && !productos.error) {
        for (let p of productos) {
            productosHtml += `
                <div class="card" style="margin-bottom: 12px;">
                    <div class="card-header">
                        <span class="card-title">🍰 ${p.nombre}</span>
                        <span class="badge ${p.stock > 0 ? 'badge-success' : 'badge-warning'}">Stock: ${p.stock}</span>
                    </div>
                    <div class="card-body">
                        <p>💰 ${p.precio}€</p>
                        <p>🥖 ${p.sin_gluten ? 'Sin gluten' : 'Con gluten'}</p>
                        ${p.imagenUrl ? `<img src="${p.imagenUrl}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-top: 8px;">` : ''}
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <input type="number" id="cantidad-${p.id}" placeholder="Cantidad" min="1" max="${p.stock}" style="flex:1; padding:8px; border-radius:8px; border:1px solid #ddd;">
                            <button class="btn btn-primary" onclick="reservar(${p.id}, ${tiendaId})">Reservar</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        overflow-y: auto;
    `;
    modal.innerHTML = `
        <div class="card" style="max-width: 550px; max-height: 85vh; overflow-y: auto; margin: 20px; width: 100%;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="card-title">🏪 ${tienda ? tienda.nombre : 'Productos'}</span>
                <button onclick="this.closest('div').parentElement.remove()" style="background: #C62828; color: white; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer;">✕</button>
            </div>
            ${tienda ? `
            <div style="background: #F5F0E6; margin: 10px; border-radius: 8px; padding: 12px;">
                <p><strong>📍 Localidad:</strong> ${tienda.localidad}</p>
                <p><strong>🏠 Dirección:</strong> ${tienda.direccion || 'No especificada'}</p>
                <p><strong>📞 Teléfono:</strong> ${tienda.telefono}</p>
                <p><strong>🕐 Horario:</strong> ${tienda.hora_apertura} - ${tienda.hora_cierre}</p>
                <p><strong>🥖 Sin gluten:</strong> ${tienda.sin_gluten ? 'Sí' : 'No'}</p>
                ${tienda.imagenUrl ? `<img src="${tienda.imagenUrl}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-top: 10px;">` : ''}
            </div>
            ` : ''}
            <div class="card-body">
                <h4>📦 Productos disponibles</h4>
                ${productosHtml || '<p>No hay productos disponibles en esta tienda</p>'}
            </div>
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}

window.verTienda = verTienda;

async function reservar(productoId, tiendaId) {
    const cantidadInput = document.getElementById(`cantidad-${productoId}`);
    const cantidad = cantidadInput?.value;
    
    if (!cantidad || cantidad < 1) {
        showMessage('Ingrese una cantidad válida', 'error');
        return;
    }
    
    const usuario = getStoredUser();
    const result = await callAPI('crearReserva', 'POST', {
        clienteId: usuario.id,
        productoId: productoId,
        cantidad: parseInt(cantidad)
    });
    
    if (result.success) {
        showMessage('✅ Reserva realizada con éxito', 'success');
        if (document.querySelector('.tab.active')?.dataset.tab === 'reservas') {
            cargarMisReservas();
        }
        const stockSpan = document.querySelector(`#cantidad-${productoId}`)?.closest('.card')?.querySelector('.badge');
        if (stockSpan) {
            const nuevoStock = parseInt(stockSpan.textContent.split(':')[1]) - parseInt(cantidad);
            stockSpan.textContent = `Stock: ${nuevoStock}`;
        }
    } else {
        showMessage(result.error || 'Error al reservar', 'error');
    }
}

window.reservar = reservar;

async function cargarMisReservas() {
    const usuario = getStoredUser();
    const reservas = await callAPI('getMisReservas', 'GET', { clienteId: usuario.id });
    
    const container = document.getElementById('listaReservas');
    if (!container) return;
    
    let html = '';
    if (reservas && !reservas.error && reservas.length > 0) {
        for (let r of reservas) {
            html += `
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">🆔 #${r.id}</span>
                        <span class="badge badge-success">${r.fecha}</span>
                    </div>
                    <div class="card-body">
                        <p>🍰 ${r.producto_nombre}</p>
                        <p>🔢 Cantidad: ${r.cantidad}</p>
                        <p>💰 Total: ${(r.precio * r.cantidad).toFixed(2)}€</p>
                        <button class="btn btn-danger btn-block" onclick="cancelarReserva(${r.id})">Cancelar Reserva</button>
                    </div>
                </div>
            `;
        }
    } else {
        html = '<div class="card"><p>📭 No tienes reservas</p></div>';
    }
    container.innerHTML = html;
}

async function cancelarReserva(reservaId) {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
    
    const result = await callAPI('cancelarReserva', 'DELETE', { reservaId });
    if (result.success) {
        showMessage('Reserva cancelada', 'success');
        cargarMisReservas();
    } else {
        showMessage(result.error || 'Error al cancelar', 'error');
    }
}

window.cancelarReserva = cancelarReserva;

// ========== FUNCIONES PARA PROPIETARIO (VER PRODUCTOS, MODIFICAR STOCK, ELIMINAR) ==========

async function verProductosTienda(tiendaId) {
    const tiendas = await callAPI('getTiendas', 'GET');
    const tienda = tiendas.find(t => t.id == tiendaId);
    
    const productos = await callAPI('getProductos', 'GET', { tiendaId: tiendaId });
    
    let productosHtml = '';
    if (productos && !productos.error && productos.length > 0) {
        for (let p of productos) {
            productosHtml += `
                <div class="producto-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 8px 0;">🍰 ${p.nombre}</h4>
                            <p style="margin: 4px 0;">💰 Precio: ${p.precio}€</p>
                            <p style="margin: 4px 0;">📦 Stock actual: <strong id="stock-${p.id}">${p.stock}</strong> unidades</p>
                            <p style="margin: 4px 0;">🥖 ${p.sin_gluten ? '✅ Sin gluten' : '❌ Con gluten'}</p>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <button class="btn btn-info" onclick="abrirModificarStock(${p.id}, ${p.stock}, ${tiendaId})" style="background: #1565C0; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                                📦 Modificar Stock
                            </button>
                            <button class="btn btn-danger" onclick="eliminarProductoPropietario(${p.id}, ${tiendaId})" style="background: #C62828; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                                🗑️ Eliminar Producto
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    } else {
        productosHtml = '<p style="color: #999; text-align: center;">No hay productos en esta tienda</p>';
    }
    
    const modal = document.createElement('div');
    modal.id = 'modal-productos';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        overflow-y: auto;
    `;
    
    modal.innerHTML = `
        <div class="card" style="max-width: 550px; max-height: 85vh; overflow-y: auto; margin: 20px; width: 100%;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="card-title">🏪 ${tienda.nombre} - Productos</span>
                <button onclick="this.closest('#modal-productos').remove()" style="background: #C62828; color: white; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer;">✕</button>
            </div>
            <div class="card-body">
                <div style="margin-bottom: 15px; padding: 10px; background: #F5F0E6; border-radius: 8px;">
                    <p><strong>📍 ${tienda.localidad}</strong></p>
                    <p>🏠 ${tienda.direccion || 'Dirección no especificada'}</p>
                    <p>📞 ${tienda.telefono}</p>
                </div>
                <h4>📦 Productos</h4>
                <div id="productos-lista">
                    ${productosHtml}
                </div>
                <button class="btn btn-primary btn-block" onclick="abrirFormularioProductoPropietario(${tiendaId})" style="margin-top: 20px;">
                    + Añadir Producto
                </button>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}

function abrirModificarStock(productoId, stockActual, tiendaId) {
    const modal = document.createElement('div');
    modal.id = 'modal-stock';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
    `;
    
    modal.innerHTML = `
        <div class="card" style="max-width: 350px; margin: 20px; width: 100%;">
            <div class="card-header" style="display: flex; justify-content: space-between;">
                <span class="card-title">📦 Modificar Stock</span>
                <button onclick="this.closest('#modal-stock').remove()" style="background: #C62828; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">✕</button>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label>Stock actual: <strong>${stockActual}</strong> unidades</label>
                </div>
                <div class="form-group">
                    <label>Nuevo stock</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="cambiarStock(${productoId}, -1, ${tiendaId})" style="background: #1565C0; color: white; border: none; width: 36px; height: 36px; border-radius: 8px; font-size: 20px; cursor: pointer;">-</button>
                        <span id="nuevoStock-${productoId}" style="font-size: 20px; font-weight: bold; min-width: 60px; text-align: center;">${stockActual}</span>
                        <button onclick="cambiarStock(${productoId}, 1, ${tiendaId})" style="background: #1565C0; color: white; border: none; width: 36px; height: 36px; border-radius: 8px; font-size: 20px; cursor: pointer;">+</button>
                    </div>
                </div>
                <button class="btn btn-primary btn-block" onclick="guardarNuevoStock(${productoId}, ${tiendaId})" style="margin-top: 20px;">
                    Guardar Cambios
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function cambiarStock(productoId, cambio, tiendaId) {
    const span = document.getElementById(`nuevoStock-${productoId}`);
    let nuevoValor = parseInt(span.textContent) + cambio;
    if (nuevoValor < 0) nuevoValor = 0;
    span.textContent = nuevoValor;
}

async function guardarNuevoStock(productoId, tiendaId) {
    const nuevoStock = parseInt(document.getElementById(`nuevoStock-${productoId}`).textContent);
    
    const result = await callAPI('actualizarStockProducto', 'POST', {
        productoId: productoId,
        nuevoStock: nuevoStock
    });
    
    if (result.success) {
        showMessage('✅ Stock actualizado correctamente', 'success');
        document.getElementById('modal-stock')?.remove();
        verProductosTienda(tiendaId);
    } else {
        showMessage(result.error || '❌ Error al actualizar stock', 'error');
    }
}

async function eliminarProductoPropietario(productoId, tiendaId) {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;
    
    const result = await callAPI('eliminarProducto', 'DELETE', { productoId });
    
    if (result.success) {
        showMessage('✅ Producto eliminado correctamente', 'success');
        verProductosTienda(tiendaId);
    } else {
        showMessage(result.error || '❌ Error al eliminar producto', 'error');
    }
}

function abrirFormularioProductoPropietario(tiendaId) {
    document.getElementById('modal-productos')?.remove();
    
    const modal = document.createElement('div');
    modal.id = 'modal-producto';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div class="card" style="max-width: 400px; margin: 20px; width: 100%;">
            <div class="card-header" style="display: flex; justify-content: space-between;">
                <span class="card-title">➕ Añadir Producto</span>
                <button onclick="this.closest('#modal-producto').remove()" style="background: #C62828; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">✕</button>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label>Nombre del producto</label>
                    <input type="text" id="nuevoProductoNombre" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div class="form-group">
                    <label>Precio (€)</label>
                    <input type="number" step="0.01" id="nuevoProductoPrecio" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div class="form-group">
                    <label>Stock inicial</label>
                    <input type="number" id="nuevoProductoStock" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="nuevoProductoSinGluten"> ¿Sin gluten?
                    </label>
                </div>
                <button class="btn btn-primary btn-block" onclick="guardarProductoPropietario(${tiendaId})" style="margin-top: 20px;">
                    Guardar Producto
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function guardarProductoPropietario(tiendaId) {
    const nombre = document.getElementById('nuevoProductoNombre')?.value;
    const precio = parseFloat(document.getElementById('nuevoProductoPrecio')?.value);
    const stock = parseInt(document.getElementById('nuevoProductoStock')?.value);
    const sinGluten = document.getElementById('nuevoProductoSinGluten')?.checked ? 1 : 0;
    
    if (!nombre || isNaN(precio) || isNaN(stock)) {
        showMessage('Complete todos los campos correctamente', 'error');
        return;
    }
    
    const result = await callAPI('añadirProducto', 'POST', {
        nombre: nombre,
        precio: precio,
        stock: stock,
        sinGluten: sinGluten,
        tiendaId: tiendaId
    });
    
    if (result.success) {
        showMessage('✅ Producto añadido con éxito', 'success');
        document.getElementById('modal-producto')?.remove();
        verProductosTienda(tiendaId);
    } else {
        showMessage(result.error || '❌ Error al añadir producto', 'error');
    }
}

async function renderizarPantallaPropietario() {
    const usuario = getStoredUser();
    if (!usuario) {
        renderizarPantallaLogin();
        return;
    }
    
    const misTiendas = await callAPI('getMisTiendas', 'GET', { propietarioId: usuario.id });
    const notificaciones = await callAPI('getNotificaciones', 'GET', { propietarioId: usuario.id });
    
    let tiendasHtml = '';
    if (misTiendas && !misTiendas.error) {
        for (let t of misTiendas) {
            tiendasHtml += `
                <div class="card" onclick="verProductosTienda(${t.id})" style="cursor: pointer;">
                    ${t.imagenUrl ? `<img src="${t.imagenUrl}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">` : '<div style="height: 150px; background: #e0d5c0; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-bottom: 10px; font-size: 40px;">🏪</div>'}
                    <div class="card-header">
                        <span class="card-title">🏪 ${t.nombre}</span>
                    </div>
                    <div class="card-body">
                        <p>📍 ${t.localidad}</p>
                        <p>🏠 ${t.direccion || 'Dirección no especificada'}</p>
                        <p>📞 ${t.telefono}</p>
                        <p>🕐 ${t.hora_apertura} - ${t.hora_cierre}</p>
                        <p>🥖 ${t.sin_gluten ? 'Sin gluten' : 'Con gluten'}</p>
                    </div>
                </div>
            `;
        }
    }
    
    let notificacionesHtml = '';
    let noLeidas = 0;
    if (notificaciones && !notificaciones.error) {
        for (let n of notificaciones) {
            if (!n.leida) noLeidas++;
            notificacionesHtml += `
                <div class="card notificacion ${n.leida ? 'leida' : ''}">
                    <div class="card-header">
                        <span class="card-title">${n.tipo === 'RESERVA_CREADA' ? '🆕' : '❌'} ${n.tipo}</span>
                        <span class="badge">${new Date(n.fecha).toLocaleString()}</span>
                    </div>
                    <div class="card-body">
                        <pre style="white-space: pre-wrap; font-size: 0.8rem;">${n.mensaje}</pre>
                        ${!n.leida ? `<button class="btn btn-info btn-sm" onclick="marcarLeida(${n.id})">Marcar leída</button>` : ''}
                    </div>
                </div>
            `;
        }
    }
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="header">
            <h1><span class="logo">🐻</span> Oso Pardo</h1>
            <div>
                <span class="badge-notificacion">${noLeidas}</span>
                <button class="btn-logout" onclick="logout()">Salir</button>
            </div>
        </div>
        
        <div class="tabs">
            <button class="tab active" data-tab="tiendas">🏪 Mis Tiendas</button>
            <button class="tab" data-tab="crear">➕ Crear Tienda</button>
            <button class="tab" data-tab="productos">📦 Productos</button>
            <button class="tab" data-tab="notificaciones">🔔 Notificaciones</button>
        </div>
        
        <div id="tab-tiendas" class="tab-content active">
            <div class="container">
                ${tiendasHtml || '<p>No tienes tiendas. Crea una.</p>'}
            </div>
        </div>
        
        <div id="tab-crear" class="tab-content">
            <div class="container">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">➕ Crear Nueva Tienda</span>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label>Nombre de la tienda *</label>
                            <input type="text" id="nuevaTiendaNombre" placeholder="Ej: Pastelería Oso Pardo">
                        </div>
                        <div class="form-group">
                            <label>Localidad *</label>
                            <input type="text" id="nuevaTiendaLocalidad" placeholder="Ej: Madrid">
                        </div>
                        <div class="form-group">
                            <label>Dirección completa *</label>
                            <input type="text" id="nuevaTiendaDireccion" placeholder="Ej: Calle Mayor 123">
                        </div>
                        <div class="form-group">
                            <label>Teléfono de contacto *</label>
                            <input type="tel" id="nuevaTiendaTelefono" placeholder="Ej: 911234567">
                        </div>
                        <div class="form-group">
                            <label>Hora de apertura *</label>
                            <input type="time" id="nuevaTiendaHoraApertura" value="09:00">
                        </div>
                        <div class="form-group">
                            <label>Hora de cierre *</label>
                            <input type="time" id="nuevaTiendaHoraCierre" value="22:00">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="nuevaTiendaSinGluten"> ¿Ofrece productos sin gluten?
                            </label>
                        </div>
                        <div class="form-group">
                            <label>📷 Imagen de la tienda (opcional)</label>
                            <input type="file" id="imagenTienda" accept="image/*">
                            <div id="previewTienda" style="margin-top: 10px;"></div>
                            <small>Formatos: JPG, PNG, GIF. Máx 2MB</small>
                        </div>
                        <button class="btn btn-primary btn-block" onclick="crearTiendaConImagen()">🏪 Crear Tienda</button>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="tab-productos" class="tab-content">
            <div class="container">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">📦 Añadir Producto</span>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label>Seleccionar Tienda</label>
                            <select id="productoTienda">
                                ${misTiendas && !misTiendas.error ? misTiendas.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('') : '<option>No hay tiendas disponibles</option>'}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Nombre del Producto *</label>
                            <input type="text" id="nuevoProductoNombre" placeholder="Ej: Tarta de Chocolate">
                        </div>
                        <div class="form-group">
                            <label>Precio (€) *</label>
                            <input type="number" step="0.01" id="nuevoProductoPrecio" placeholder="Ej: 15.90">
                        </div>
                        <div class="form-group">
                            <label>Stock inicial *</label>
                            <input type="number" id="nuevoProductoStock" placeholder="Ej: 10">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="nuevoProductoSinGluten"> ¿Sin gluten?
                            </label>
                        </div>
                        <div class="form-group">
                            <label>📷 Imagen del producto (opcional)</label>
                            <input type="file" id="imagenProducto" accept="image/*">
                            <div id="previewProducto" style="margin-top: 10px;"></div>
                            <small>Formatos: JPG, PNG, GIF. Máx 2MB</small>
                        </div>
                        <button class="btn btn-primary btn-block" onclick="añadirProductoConImagen()">📦 Añadir Producto</button>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="tab-notificaciones" class="tab-content">
            <div class="container">
                ${notificacionesHtml || '<p>📭 No hay notificaciones</p>'}
            </div>
        </div>
    `;
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

async function renderizarPantallaAdmin() {
    const usuario = getStoredUser();
    if (!usuario) {
        renderizarPantallaLogin();
        return;
    }
    
    const usuarios = await callAPI('adminGetUsuarios', 'GET');
    const tiendas = await callAPI('getTiendas', 'GET');
    
    let usuariosHtml = '';
    if (usuarios && !usuarios.error) {
        for (let u of usuarios) {
            usuariosHtml += `
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">${u.nombre}</span>
                        <span class="badge">${u.tipo}</span>
                    </div>
                    <div class="card-body">
                        <p>📧 ${u.email}</p>
                        <button class="btn btn-danger btn-sm" onclick="banearUsuario(${u.id})">Banear</button>
                    </div>
                </div>
            `;
        }
    }
    
    let tiendasHtml = '';
    if (tiendas && !tiendas.error) {
        for (let t of tiendas) {
            tiendasHtml += `
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">🏪 ${t.nombre}</span>
                    </div>
                    <div class="card-body">
                        <p>📍 ${t.localidad}</p>
                        <p>👤 Propietario ID: ${t.propietario_id}</p>
                        <button class="btn btn-danger btn-sm" onclick="eliminarTiendaAdmin(${t.id})">Eliminar</button>
                    </div>
                </div>
            `;
        }
    }
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="header">
            <h1><span class="logo">🐻</span> Oso Pardo Admin</h1>
            <button class="btn-logout" onclick="logout()">Salir</button>
        </div>
        
        <div class="tabs">
            <button class="tab active" data-tab="usuarios">👥 Usuarios</button>
            <button class="tab" data-tab="tiendas">🏪 Tiendas</button>
        </div>
        
        <div id="tab-usuarios" class="tab-content active">
            <div class="container">
                ${usuariosHtml}
            </div>
        </div>
        
        <div id="tab-tiendas" class="tab-content">
            <div class="container">
                ${tiendasHtml}
            </div>
        </div>
    `;
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

// ==================== FUNCIONES AUXILIARES ====================

document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'imagenTienda') {
        const preview = document.getElementById('previewTienda');
        if (preview) {
            preview.innerHTML = '';
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.maxWidth = '200px';
                    img.style.maxHeight = '150px';
                    img.style.borderRadius = '8px';
                    img.style.border = '1px solid #ddd';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        }
    }
    
    if (e.target && e.target.id === 'imagenProducto') {
        const preview = document.getElementById('previewProducto');
        if (preview) {
            preview.innerHTML = '';
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.maxWidth = '200px';
                    img.style.maxHeight = '150px';
                    img.style.borderRadius = '8px';
                    img.style.border = '1px solid #ddd';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        }
    }
});

async function crearTiendaConImagen() {
    const usuario = getStoredUser();
    if (!usuario) {
        showMessage('Debes iniciar sesión', 'error');
        return;
    }
    
    const nombre = document.getElementById('nuevaTiendaNombre')?.value.trim();
    const localidad = document.getElementById('nuevaTiendaLocalidad')?.value.trim();
    const direccion = document.getElementById('nuevaTiendaDireccion')?.value.trim();
    const telefono = document.getElementById('nuevaTiendaTelefono')?.value.trim();
    const horaApertura = document.getElementById('nuevaTiendaHoraApertura')?.value;
    const horaCierre = document.getElementById('nuevaTiendaHoraCierre')?.value;
    const sinGluten = document.getElementById('nuevaTiendaSinGluten')?.checked ? 1 : 0;
    const imagenFile = document.getElementById('imagenTienda')?.files[0];
    
    if (!nombre || !localidad || !direccion || !telefono) {
        showMessage('Complete todos los campos obligatorios', 'error');
        return;
    }
    
    showMessage('Creando tienda...', 'success');
    
    let imagenUrl = null;
    
    if (imagenFile) {
        const formData = new FormData();
        formData.append('imagen', imagenFile);
        formData.append('action', 'subirImagen');
        
        try {
            const uploadResult = await fetch('/osopardo/Index.php?action=subirImagen', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadResult.json();
            if (uploadData.success) {
                imagenUrl = uploadData.url;
            }
        } catch (e) {
            console.error('Error al subir imagen:', e);
        }
    }
    
    const data = {
        nombre: nombre,
        localidad: localidad,
        direccion: direccion,
        telefono: telefono,
        horaApertura: horaApertura + ':00',
        horaCierre: horaCierre + ':00',
        sinGluten: sinGluten,
        propietarioId: usuario.id,
        imagenUrl: imagenUrl
    };
    
    const result = await callAPI('crearTienda', 'POST', data);
    
    if (result.success) {
        showMessage('✅ Tienda creada con éxito', 'success');
        document.getElementById('nuevaTiendaNombre').value = '';
        document.getElementById('nuevaTiendaLocalidad').value = '';
        document.getElementById('nuevaTiendaDireccion').value = '';
        document.getElementById('nuevaTiendaTelefono').value = '';
        document.getElementById('nuevaTiendaHoraApertura').value = '09:00';
        document.getElementById('nuevaTiendaHoraCierre').value = '22:00';
        document.getElementById('nuevaTiendaSinGluten').checked = false;
        const preview = document.getElementById('previewTienda');
        if (preview) preview.innerHTML = '';
        document.getElementById('imagenTienda').value = '';
        renderizarPantallaPropietario();
    } else {
        showMessage(result.error || '❌ Error al crear tienda', 'error');
    }
}

async function añadirProductoConImagen() {
    const tiendaId = parseInt(document.getElementById('productoTienda')?.value);
    const nombre = document.getElementById('nuevoProductoNombre')?.value.trim();
    const precio = parseFloat(document.getElementById('nuevoProductoPrecio')?.value);
    const stock = parseInt(document.getElementById('nuevoProductoStock')?.value);
    const sinGluten = document.getElementById('nuevoProductoSinGluten')?.checked ? 1 : 0;
    const imagenFile = document.getElementById('imagenProducto')?.files[0];
    
    if (!tiendaId || !nombre || isNaN(precio) || isNaN(stock)) {
        showMessage('Complete todos los campos obligatorios', 'error');
        return;
    }
    
    let imagenUrl = null;
    
    if (imagenFile) {
        const formData = new FormData();
        formData.append('imagen', imagenFile);
        formData.append('action', 'subirImagen');
        
        try {
            const uploadResult = await fetch('/osopardo/Index.php?action=subirImagen', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadResult.json();
            if (uploadData.success) {
                imagenUrl = uploadData.url;
            }
        } catch (e) {
            console.error('Error al subir imagen:', e);
        }
    }
    
    const data = {
        nombre: nombre,
        precio: precio,
        stock: stock,
        sinGluten: sinGluten,
        tiendaId: tiendaId,
        imagenUrl: imagenUrl
    };
    
    const result = await callAPI('añadirProducto', 'POST', data);
    
    if (result.success) {
        showMessage('✅ Producto añadido con éxito', 'success');
        document.getElementById('nuevoProductoNombre').value = '';
        document.getElementById('nuevoProductoPrecio').value = '';
        document.getElementById('nuevoProductoStock').value = '';
        document.getElementById('nuevoProductoSinGluten').checked = false;
        const preview = document.getElementById('previewProducto');
        if (preview) preview.innerHTML = '';
        document.getElementById('imagenProducto').value = '';
        renderizarPantallaPropietario();
    } else {
        showMessage(result.error || '❌ Error al añadir producto', 'error');
    }
}

async function marcarLeida(notificacionId) {
    const result = await callAPI('marcarLeida', 'POST', { notificacionId });
    if (result.success) {
        renderizarPantallaPropietario();
    }
}

window.marcarLeida = marcarLeida;

async function banearUsuario(usuarioId) {
    if (!confirm('¿Estás seguro de banear este usuario? Se eliminarán todos sus datos')) return;
    
    const result = await callAPI('adminBanearUsuario', 'DELETE', { usuarioId });
    if (result.success) {
        showMessage('Usuario baneado', 'success');
        renderizarPantallaAdmin();
    } else {
        showMessage(result.error || 'Error al banear', 'error');
    }
}

window.banearUsuario = banearUsuario;

async function eliminarTienda(tiendaId) {
    if (!confirm('¿Eliminar esta tienda?')) return;
    
    const result = await callAPI('adminEliminarTienda', 'DELETE', { tiendaId });
    if (result.success) {
        showMessage('Tienda eliminada', 'success');
        renderizarPantallaPropietario();
    }
}

window.eliminarTienda = eliminarTienda;
window.eliminarTiendaAdmin = eliminarTienda;

// ==================== INICIALIZACIÓN ====================
getStoredUser() ? 
    (usuarioActual.tipo === 'CLIENTE' ? renderizarPantallaCliente() :
     usuarioActual.tipo === 'PROPIETARIO' ? renderizarPantallaPropietario() :
     renderizarPantallaAdmin()) : 
    renderizarPantallaLogin();