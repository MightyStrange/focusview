<?php
session_start(); 

include 'koneksi.php'; // Pastikan koneksi benar

header('Content-Type: application/json');
// Pastikan query benar dan tabel ada
$result = $conn->query("SELECT nama_bluetooth, id_bluetooth FROM devices ORDER BY id DESC LIMIT 1");

if (!$result) {
    // Tangkap error query
    echo json_encode([
        'status' => 'error',
        'message' => 'Query Error: ' . $conn->error
    ]);
    $conn->close();
    exit;
}

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        'status' => 'success',
        'nama_bluetooth' => $row['nama_bluetooth'],
        'id_bluetooth' => $row['id_bluetooth']
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Data perangkat tidak ditemukan'
    ]);
}

$conn->close();
?>