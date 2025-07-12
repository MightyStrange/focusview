<?php
session_start(); 

include 'koneksi.php'; // Pastikan koneksi benar

header('Content-Type: application/json');

// Ambil semua id_perangkat dari tabel users
$sql = "SELECT id_perangkat FROM users";
$result = $conn->query($sql);

if (!$result) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Query error: ' . $conn->error
    ]);
    $conn->close();
    exit;
}

$id_perangkat_list = [];
while ($row = $result->fetch_assoc()) {
    $id_perangkat_list[] = $row['id_perangkat'];
}

echo json_encode([
    'status' => 'success',
    'id_perangkat' => $id_perangkat_list
]);

$conn->close();
?>
