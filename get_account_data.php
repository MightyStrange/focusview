<?php
session_start(); 

include 'koneksi.php'; // Pastikan koneksi benar

header('Content-Type: application/json');

if (!isset($_SESSION['username']) || empty($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'Anda belum login atau sesi telah berakhir.']);
    exit;
}

$username_to_load = $_SESSION['username'];

$sql = "SELECT nama, no_hp FROM users WHERE username = ?";
$stmt = $conn->prepare($sql);

if ($stmt === false) {
    echo json_encode(['status' => 'error', 'message' => 'Gagal menyiapkan statement: ' . $conn->error]);
    exit;
}

$stmt->bind_param("s", $username_to_load);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode([
        'status' => 'success',
        'nama' => $row['nama'],
        'no_hp' => $row['no_hp']
        // Tambahkan kolom lain jika diperlukan
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Data akun untuk username "' . htmlspecialchars($username_to_load) . '" tidak ditemukan.'
    ]);
}

$stmt->close();
$conn->close();
?>