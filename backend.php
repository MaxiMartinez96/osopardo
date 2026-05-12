<?php
// api.php - Conecta con tu MySQL existente
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$host = "localhost";
$user = "root";
$pass = "tu_contraseña";
$db = "OsoPardo";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["error" => "Conexión fallida"]));
}

// Endpoint para obtener tiendas
if ($_GET["action"] == "tiendas") {
    $result = $conn->query("SELECT * FROM tiendas");
    $tiendas = [];
    while ($row = $result->fetch_assoc()) {
        $tiendas[] = $row;
    }
    echo json_encode($tiendas);
}

// Endpoint para login
if ($_GET["action"] == "login") {
    $email = $_POST["email"];
    $password = $_POST["password"];
    $result = $conn->query("SELECT * FROM usuario WHERE email='$email' AND password='$password'");
    
    if ($row = $result->fetch_assoc()) {
        echo json_encode($row);
    } else {
        echo json_encode(["error" => "Credenciales incorrectas"]);
    }
}

// Endpoint para crear reserva
if ($_GET["action"] == "reservar") {
    $clienteId = $_POST["cliente_id"];
    $productoId = $_POST["producto_id"];
    $cantidad = $_POST["cantidad"];
    
    $conn->query("INSERT INTO reserva (cliente_id, producto_id, fecha, cantidad) 
                  VALUES ($clienteId, $productoId, CURDATE(), $cantidad)");
    
    // Restar stock
    $conn->query("UPDATE producto SET stock = stock - $cantidad WHERE id = $productoId");
    
    echo json_encode(["success" => true]);
}

$conn->close();
?>
