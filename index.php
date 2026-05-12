<?php
// Configuración CORS para permitir llamadas desde la app
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de la base de datos
$host = "${{MySQL.MYSQLHOST}}";
$user = "${{MySQL.MYSQLUSER}}";
$pass = "${{MySQL.MYSQLPASSWORD}}"; // Cambia por tu contraseña
$db = "${{MySQL.MYSQLDATABASE}}";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

// Obtener el endpoint solicitado
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Leer datos JSON si vienen en el body
$input = json_decode(file_get_contents('php://input'), true);

switch($action) {
    
    // ==================== LOGIN ====================
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            
            $sql = "SELECT u.id, u.nombre, u.email, u.tipo 
                    FROM usuario u 
                    WHERE u.email = ? AND u.password = ?";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ss", $email, $password);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                echo json_encode([
                    "success" => true,
                    "id" => $row['id'],
                    "nombre" => $row['nombre'],
                    "email" => $row['email'],
                    "tipo" => $row['tipo']
                ]);
            } else {
                echo json_encode(["success" => false, "error" => "Credenciales incorrectas"]);
            }
            $stmt->close();
        }
        break;
    
    // ==================== REGISTRO ====================
    case 'registro':
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $nombre = $input['nombre'] ?? '';
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            $tipo = $input['tipo'] ?? 'CLIENTE';
            
            $conn->begin_transaction();
            
            try {
                // Insertar en usuario
                $sql = "INSERT INTO usuario (nombre, email, password, tipo) VALUES (?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssss", $nombre, $email, $password, $tipo);
                $stmt->execute();
                $userId = $conn->insert_id;
                
                // Insertar en tabla específica
                if ($tipo == 'CLIENTE') {
                    $sql2 = "INSERT INTO cliente (id) VALUES (?)";
                } else {
                    $sql2 = "INSERT INTO propietario (id) VALUES (?)";
                }
                $stmt2 = $conn->prepare($sql2);
                $stmt2->bind_param("i", $userId);
                $stmt2->execute();
                
                $conn->commit();
                
                echo json_encode([
                    "success" => true,
                    "id" => $userId,
                    "nombre" => $nombre,
                    "email" => $email,
                    "tipo" => $tipo
                ]);
            } catch (Exception $e) {
                $conn->rollback();
                echo json_encode(["success" => false, "error" => $e->getMessage()]);
            }
        }
        break;
    
    // ==================== OBTENER TIENDAS ====================
    case 'getTiendas':
        if ($_SERVER['REQUEST_METHOD'] == 'GET') {
            $localidad = isset($_GET['localidad']) ? $_GET['localidad'] : '';
            $soloSinGluten = isset($_GET['sinGluten']) && $_GET['sinGluten'] == 'true';
            
            $sql = "SELECT * FROM tiendas";
            $where = [];
            $params = [];
            $types = "";
            
            if (!empty($localidad)) {
                $where[] = "localidad LIKE ?";
                $params[] = "%$localidad%";
                $types .= "s";
            }
            
            if ($soloSinGluten) {
                $where[] = "sin_gluten = 1";
            }
            
            if (!empty($where)) {
                $sql .= " WHERE " . implode(" AND ", $where);
            }
            
            $stmt = $conn->prepare($sql);
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            
            $tiendas = [];
            while ($row = $result->fetch_assoc()) {
                $tiendas[] = $row;
            }
            
            echo json_encode($tiendas);
            $stmt->close();
        }
        break;
    
    // ==================== OBTENER PRODUCTOS POR TIENDA ====================
    case 'getProductos':
        if ($_SERVER['REQUEST_METHOD'] == 'GET') {
            $tiendaId = isset($_GET['tiendaId']) ? (int)$_GET['tiendaId'] : 0;
            
            $sql = "SELECT * FROM producto WHERE tienda_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $tiendaId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $productos = [];
            while ($row = $result->fetch_assoc()) {
                $productos[] = $row;
            }
            
            echo json_encode($productos);
            $stmt->close();
        }
        break;
    
    // ==================== CREAR RESERVA ====================
   case 'crearReserva':
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $clienteId = $input['clienteId'] ?? 0;
        $productoId = $input['productoId'] ?? 0;
        $cantidad = $input['cantidad'] ?? 0;
        
        $conn->begin_transaction();
        
        try {
            // Verificar stock
            $sqlStock = "SELECT stock, tienda_id FROM producto WHERE id = ?";
            $stmt = $conn->prepare($sqlStock);
            $stmt->bind_param("i", $productoId);
            $stmt->execute();
            $result = $stmt->get_result();
            $producto = $result->fetch_assoc();
            
            if ($producto['stock'] < $cantidad) {
                throw new Exception("Stock insuficiente");
            }
            
            // Restar stock
            $nuevoStock = $producto['stock'] - $cantidad;
            $sqlUpdate = "UPDATE producto SET stock = ? WHERE id = ?";
            $stmt2 = $conn->prepare($sqlUpdate);
            $stmt2->bind_param("ii", $nuevoStock, $productoId);
            $stmt2->execute();
            
            // Crear reserva
            $sqlReserva = "INSERT INTO reserva (cliente_id, producto_id, fecha, cantidad) VALUES (?, ?, CURDATE(), ?)";
            $stmt3 = $conn->prepare($sqlReserva);
            $stmt3->bind_param("iii", $clienteId, $productoId, $cantidad);
            $stmt3->execute();
            $reservaId = $conn->insert_id;
            
            // ========== NOTIFICACIÓN CON NOMBRES ==========
            
            // Obtener nombre del cliente
            $sqlCliente = "SELECT u.nombre FROM usuario u INNER JOIN cliente c ON u.id = c.id WHERE c.id = ?";
            $stmtCliente = $conn->prepare($sqlCliente);
            $stmtCliente->bind_param("i", $clienteId);
            $stmtCliente->execute();
            $resultCliente = $stmtCliente->get_result();
            $cliente = $resultCliente->fetch_assoc();
            $nombreCliente = $cliente ? $cliente['nombre'] : 'Cliente';
            
            // Obtener nombre del producto y propietario
            $sqlProd = "SELECT p.nombre as producto_nombre, t.propietario_id 
                        FROM producto p 
                        JOIN tiendas t ON p.tienda_id = t.id 
                        WHERE p.id = ?";
            $stmtProd = $conn->prepare($sqlProd);
            $stmtProd->bind_param("i", $productoId);
            $stmtProd->execute();
            $resultProd = $stmtProd->get_result();
            $productoData = $resultProd->fetch_assoc();
            $nombreProducto = $productoData ? $productoData['producto_nombre'] : 'Producto';
            $propietarioId = $productoData ? $productoData['propietario_id'] : 0;
            
            // Crear mensaje de notificación
            if ($propietarioId) {
                $mensaje = "🆕 NUEVA RESERVA\n\n" .
                           "👤 Cliente: " . $nombreCliente . "\n" .
                           "🍰 Producto: " . $nombreProducto . "\n" .
                           "🔢 Cantidad: " . $cantidad;
                
                $sqlNotif = "INSERT INTO notificacion (propietario_id, reserva_id, tipo, mensaje, fecha, leida) 
                             VALUES (?, ?, 'RESERVA_CREADA', ?, NOW(), 0)";
                $stmt5 = $conn->prepare($sqlNotif);
                $stmt5->bind_param("iis", $propietarioId, $reservaId, $mensaje);
                $stmt5->execute();
            }
            
            $conn->commit();
            
            echo json_encode([
                "success" => true,
                "reservaId" => $reservaId,
                "message" => "Reserva creada correctamente"
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }
    break;
    
    // ==================== OBTENER RESERVAS DEL CLIENTE ====================
    case 'getMisReservas':
        if ($_SERVER['REQUEST_METHOD'] == 'GET') {
            $clienteId = isset($_GET['clienteId']) ? (int)$_GET['clienteId'] : 0;
            
            $sql = "SELECT r.*, p.nombre as producto_nombre, p.precio 
                    FROM reserva r 
                    JOIN producto p ON r.producto_id = p.id 
                    WHERE r.cliente_id = ? 
                    ORDER BY r.fecha DESC";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $clienteId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $reservas = [];
            while ($row = $result->fetch_assoc()) {
                $reservas[] = $row;
            }
            
            echo json_encode($reservas);
            $stmt->close();
        }
        break;
    
    // ==================== CANCELAR RESERVA ====================
   case 'cancelarReserva':
    if ($_SERVER['REQUEST_METHOD'] == 'DELETE' || $_SERVER['REQUEST_METHOD'] == 'POST') {
        $reservaId = $input['reservaId'] ?? 0;
        
        $conn->begin_transaction();
        
        try {
            // Obtener información de la reserva
            $sqlInfo = "SELECT r.producto_id, r.cantidad, r.cliente_id
                        FROM reserva r 
                        WHERE r.id = ?";
            $stmt = $conn->prepare($sqlInfo);
            $stmt->bind_param("i", $reservaId);
            $stmt->execute();
            $result = $stmt->get_result();
            $reserva = $result->fetch_assoc();
            
            if (!$reserva) {
                throw new Exception("Reserva no encontrada");
            }
            
            $productoId = $reserva['producto_id'];
            $cantidad = $reserva['cantidad'];
            $clienteId = $reserva['cliente_id'];
            
            // Devolver stock
            $sqlUpdate = "UPDATE producto SET stock = stock + ? WHERE id = ?";
            $stmt2 = $conn->prepare($sqlUpdate);
            $stmt2->bind_param("ii", $cantidad, $productoId);
            $stmt2->execute();
            
            // ========== NOTIFICACIÓN DE CANCELACIÓN CON NOMBRES ==========
            
            // Obtener nombre del cliente
            $sqlCliente = "SELECT u.nombre FROM usuario u INNER JOIN cliente c ON u.id = c.id WHERE c.id = ?";
            $stmtCliente = $conn->prepare($sqlCliente);
            $stmtCliente->bind_param("i", $clienteId);
            $stmtCliente->execute();
            $resultCliente = $stmtCliente->get_result();
            $cliente = $resultCliente->fetch_assoc();
            $nombreCliente = $cliente ? $cliente['nombre'] : 'Cliente';
            
            // Obtener nombre del producto y propietario
            $sqlProd = "SELECT p.nombre as producto_nombre, t.propietario_id 
                        FROM producto p 
                        JOIN tiendas t ON p.tienda_id = t.id 
                        WHERE p.id = ?";
            $stmtProd = $conn->prepare($sqlProd);
            $stmtProd->bind_param("i", $productoId);
            $stmtProd->execute();
            $resultProd = $stmtProd->get_result();
            $productoData = $resultProd->fetch_assoc();
            $nombreProducto = $productoData ? $productoData['producto_nombre'] : 'Producto';
            $propietarioId = $productoData ? $productoData['propietario_id'] : 0;
            
            // Eliminar reserva
            $sqlDelete = "DELETE FROM reserva WHERE id = ?";
            $stmt3 = $conn->prepare($sqlDelete);
            $stmt3->bind_param("i", $reservaId);
            $stmt3->execute();
            
            // Crear notificación de cancelación
            if ($propietarioId) {
                $mensaje = "❌ RESERVA CANCELADA\n\n" .
                           "👤 Cliente: " . $nombreCliente . "\n" .
                           "🍰 Producto: " . $nombreProducto . "\n" .
                           "🔢 Cantidad: " . $cantidad;
                
                $sqlNotif = "INSERT INTO notificacion (propietario_id, reserva_id, tipo, mensaje, fecha, leida) 
                             VALUES (?, ?, 'RESERVA_CANCELADA', ?, NOW(), 0)";
                $stmtNotif = $conn->prepare($sqlNotif);
                $stmtNotif->bind_param("iis", $propietarioId, $reservaId, $mensaje);
                $stmtNotif->execute();
            }
            
            $conn->commit();
            
            echo json_encode(["success" => true, "message" => "Reserva cancelada"]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    }
    break;
    
    // ==================== OBTENER NOTIFICACIONES DEL PROPIETARIO ====================
    case 'getNotificaciones':
        if ($_SERVER['REQUEST_METHOD'] == 'GET') {
            $propietarioId = isset($_GET['propietarioId']) ? (int)$_GET['propietarioId'] : 0;
            
            $sql = "SELECT * FROM notificacion WHERE propietario_id = ? ORDER BY fecha DESC";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $propietarioId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $notificaciones = [];
            while ($row = $result->fetch_assoc()) {
                $notificaciones[] = $row;
            }
            
            echo json_encode($notificaciones);
            $stmt->close();
        }
        break;
    
    // ==================== MARCAR NOTIFICACIÓN LEÍDA ====================
    case 'marcarLeida':
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $notificacionId = $input['notificacionId'] ?? 0;
            
            $sql = "UPDATE notificacion SET leida = 1 WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $notificacionId);
            $success = $stmt->execute();
            
            echo json_encode(["success" => $success]);
            $stmt->close();
        }
        break;
    
    // ==================== CREAR TIENDA (PROPIETARIO) ====================
    case 'crearTienda':
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $nombre = $input['nombre'] ?? '';
            $localidad = $input['localidad'] ?? '';
            $direccion = $input['direccion'] ?? '';
            $telefono = $input['telefono'] ?? '';
            $horaApertura = $input['horaApertura'] ?? '09:00:00';
            $horaCierre = $input['horaCierre'] ?? '22:00:00';
            $sinGluten = $input['sinGluten'] ?? 0;
            $propietarioId = $input['propietarioId'] ?? 0;
            $imagenUrl = $input['imagenUrl'] ?? null;
            
            $sql = "INSERT INTO tiendas (nombre, localidad, sin_gluten, direccion, telefono, 
                    hora_apertura, hora_cierre, propietario_id, imagen_url) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ssissssis", $nombre, $localidad, $sinGluten, $direccion, 
                              $telefono, $horaApertura, $horaCierre, $propietarioId, $imagenUrl);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "id" => $conn->insert_id]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
            $stmt->close();
        }
        break;
    
    // ==================== AÑADIR PRODUCTO ====================
    case 'añadirProducto':
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $nombre = $input['nombre'] ?? '';
            $precio = $input['precio'] ?? 0;
            $stock = $input['stock'] ?? 0;
            $sinGluten = $input['sinGluten'] ?? 0;
            $tiendaId = $input['tiendaId'] ?? 0;
            $imagenUrl = $input['imagenUrl'] ?? null;
            
            $sql = "INSERT INTO producto (nombre, precio, stock, sin_gluten, tienda_id, imagen_url) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sdiiss", $nombre, $precio, $stock, $sinGluten, $tiendaId, $imagenUrl);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "id" => $conn->insert_id]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
            $stmt->close();
        }
        break;
    
    // ==================== OBTENER TIENDAS DEL PROPIETARIO ====================
    case 'getMisTiendas':
        if ($_SERVER['REQUEST_METHOD'] == 'GET') {
            $propietarioId = isset($_GET['propietarioId']) ? (int)$_GET['propietarioId'] : 0;
            
            $sql = "SELECT * FROM tiendas WHERE propietario_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $propietarioId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $tiendas = [];
            while ($row = $result->fetch_assoc()) {
                $tiendas[] = $row;
            }
            
            echo json_encode($tiendas);
            $stmt->close();
        }
        break;
    
    // ==================== ADMIN - OBTENER TODOS LOS USUARIOS ====================
    case 'adminGetUsuarios':
        if ($_SERVER['REQUEST_METHOD'] == 'GET') {
            $sql = "SELECT id, nombre, email, tipo FROM usuario WHERE tipo IN ('CLIENTE', 'PROPIETARIO')";
            $result = $conn->query($sql);
            
            $usuarios = [];
            while ($row = $result->fetch_assoc()) {
                $usuarios[] = $row;
            }
            
            echo json_encode($usuarios);
        }
        break;
    
    // ==================== ADMIN - BANEAR USUARIO ====================
    case 'adminBanearUsuario':
        if ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
            $usuarioId = $input['usuarioId'] ?? 0;
            
            $sql = "DELETE FROM usuario WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $usuarioId);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
            $stmt->close();
        }
        break;
    
    // ==================== ADMIN - ELIMINAR TIENDA ====================
    case 'adminEliminarTienda':
        if ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
            $tiendaId = $input['tiendaId'] ?? 0;
            
            $sql = "DELETE FROM tiendas WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $tiendaId);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
            $stmt->close();
        }
        break;
         // ==================== SUBIR IMAGEN ====================
    case 'subirImagen':
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $targetDir = "uploads/";
            if (!file_exists($targetDir)) {
                mkdir($targetDir, 0777, true);
            }
            
            $fileName = time() . '_' . basename($_FILES["imagen"]["name"]);
            $targetFile = $targetDir . $fileName;
            
            if (move_uploaded_file($_FILES["imagen"]["tmp_name"], $targetFile)) {
                echo json_encode(["success" => true, "url" => "/osopardo/" . $targetFile]);
            } else {
                echo json_encode(["success" => false, "error" => "Error al subir archivo"]);
            }
        }
        break;

        // ==================== ACTUALIZAR STOCK DE PRODUCTO ====================
case 'actualizarStockProducto':
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $productoId = $input['productoId'] ?? 0;
        $nuevoStock = $input['nuevoStock'] ?? 0;
        
        $sql = "UPDATE producto SET stock = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $nuevoStock, $productoId);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => $stmt->error]);
        }
        $stmt->close();
    }
    break;

// ==================== ELIMINAR PRODUCTO ====================
case 'eliminarProducto':
    if ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
        $productoId = $input['productoId'] ?? 0;
        
        $sql = "DELETE FROM producto WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $productoId);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => $stmt->error]);
        }
        $stmt->close();
    }
    break;
    
    default:
        echo json_encode(["error" => "Acción no válida"]);
}

$conn->close();
?>
