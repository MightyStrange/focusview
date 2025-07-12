<?php
include 'koneksi.php';

// Reset tabel (hapus semua data dan reset ID)
$conn->query("ALTER TABLE users AUTO_INCREMENT = 1");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Validasi dan sanitasi input
    $username = isset($_POST["username"]) ? mysqli_real_escape_string($conn, $_POST["username"]) : '';
    $password_raw = isset($_POST["password"]) ? $_POST["password"] : '';
    $password = password_hash($password_raw, PASSWORD_DEFAULT);
    $nama = isset($_POST["nama"]) ? mysqli_real_escape_string($conn, $_POST["nama"]) : '';
    $id_perangkat = isset($_POST["id_perangkat"]) ? mysqli_real_escape_string($conn, $_POST["id_perangkat"]) : '';
    $no_hp = isset($_POST["no_hp"]) ? mysqli_real_escape_string($conn, $_POST["no_hp"]) : '';

    // Validasi bahwa semua input wajib terisi
    if (!$username || !$password_raw || !$nama || !$id_perangkat || !$no_hp) {
        echo "Harap isi semua data yang diperlukan.";
        exit;
    }

    // Cek apakah username sudah terdaftar
    $cek = mysqli_query($conn, "SELECT * FROM users WHERE username='$username'");
    if (mysqli_num_rows($cek) > 0) {
        echo "Username sudah terdaftar!";
        exit;
    }

    // Insert data ke database
    $query = "INSERT INTO users (username, password, nama, id_perangkat, no_hp)
              VALUES ('$username', '$password', '$nama', '$id_perangkat', '$no_hp')";

    if (mysqli_query($conn, $query)) {
        echo "Registrasi berhasil! Silakan login.";
    } else {
        echo "Registrasi gagal: " . mysqli_error($conn);
    }
}
?>