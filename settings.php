<?php
// PENTING: Mulai sesi di paling awal script, sebelum output apapun (termasuk header!)
session_start(); 

include 'koneksi.php'; // file ini berisi koneksi ke database

header('Content-Type: application/json'); // PENTING: Beri tahu browser bahwa responsnya adalah JSON

// Pastikan user sudah login dan username ada di sesi
if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'Anda belum login atau sesi telah berakhir.']);
    exit;
}

// Ambil username dari sesi, ini adalah user yang sedang login dan akan diupdate
$username_to_update = $_SESSION['username'];

// Ambil data dari POST
// Kolom username dari form tidak perlu diambil jika kita mengandalkan sesi untuk identifikasi user
// $username = $_POST['username'] ?? ''; // Baris ini tidak lagi diperlukan untuk identifikasi
$nama       = $_POST['nama'] ?? '';
$no_hp      = $_POST['no_hp'] ?? '';
$password   = $_POST['password'] ?? ''; // Password baru, opsional

// Validasi dasar
if (empty($nama) || empty($no_hp)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama dan Nomor HP wajib diisi.']);
    exit;
}

// Siapkan query SQL
if (!empty($password)) {
    // Hash password sebelum menyimpan
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $sql = "UPDATE users SET nama = ?, no_hp = ?, password = ? WHERE username = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) { // Tangani error prepare statement
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyiapkan statement UPDATE (password): ' . $conn->error]);
        exit;
    }
    
    $stmt->bind_param("ssss", $nama, $no_hp, $hashed_password, $username_to_update);
} else {
    // Jika password kosong, jangan update password
    $sql = "UPDATE users SET nama = ?, no_hp = ? WHERE username = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) { // Tangani error prepare statement
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyiapkan statement UPDATE (no password): ' . $conn->error]);
        exit;
    }
    
    $stmt->bind_param("sss", $nama, $no_hp, $username_to_update);
}

// Eksekusi query
if ($stmt->execute()) {
    // Periksa apakah ada baris yang terpengaruh (artinya update berhasil)
    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Data berhasil disimpan.']);
    } else {
        // Jika affected_rows 0, berarti username tidak ditemukan atau data yang dikirim sama dengan yang sudah ada
        echo json_encode(['status' => 'success', 'message' => 'Tidak ada perubahan yang disimpan atau username tidak ditemukan.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan data: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>