<?php
$servername = "localhost";
$username = "u780281247_focusview"; // Sesuaikan dengan username database Anda
$password = "u780281247_Focusview";     // Sesuaikan dengan password database Anda
$dbname = "u780281247_focusview"; // Nama database Anda

// Buat koneksi
$conn = new mysqli($servername, $username, $password, $dbname);

// Cek koneksi
if ($conn->connect_error) {
    // Ini penting agar error koneksi tidak menghasilkan output HTML yang merusak JSON
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal: ' . $conn->connect_error]);
    exit(); // Hentikan eksekusi script
}
?>