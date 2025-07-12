<?php
include 'koneksi.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$nama_bluetooth = $input['nama_bluetooth'] ?? '';
$id_bluetooth = $input['id_bluetooth'] ?? '';

if (empty($nama_bluetooth) || empty($id_bluetooth)) {
    echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap.']);
    exit;
}

// Periksa apakah perangkat sudah ada berdasarkan id_bluetooth
$sql_check = "SELECT id FROM devices WHERE id_bluetooth = ?";
$stmt_check = $conn->prepare($sql_check);
$stmt_check->bind_param("s", $id_bluetooth);
$stmt_check->execute();
$result = $stmt_check->get_result();

if ($result->num_rows > 0) {
    // Update nama_bluetooth saja
    $sql_update = "UPDATE devices SET nama_bluetooth = ? WHERE id_bluetooth = ?";
    $stmt_update = $conn->prepare($sql_update);
    $stmt_update->bind_param("ss", $nama_bluetooth, $id_bluetooth);
    $stmt_update->execute();
    $stmt_update->close();
} else {
    // Insert data baru
    $sql_insert = "INSERT INTO devices (nama_bluetooth, id_bluetooth) VALUES (?, ?)";
    $stmt_insert = $conn->prepare($sql_insert);
    $stmt_insert->bind_param("ss", $nama_bluetooth, $id_bluetooth);
    $stmt_insert->execute();
    $stmt_insert->close();
}

echo json_encode(['status' => 'success']);
$conn->close();
?>