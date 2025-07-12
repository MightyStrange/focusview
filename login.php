<?php
session_start();
include 'koneksi.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = mysqli_real_escape_string($conn, $_POST["username"]);
    $password = $_POST["password"];

    $query = "SELECT * FROM users WHERE username = '$username'";
    $result = mysqli_query($conn, $query);

    if (mysqli_num_rows($result) === 1) {
        $row = mysqli_fetch_assoc($result);

        // Untuk debug:
        // echo "Input Password: $password<br>";
        // echo "DB Hash: " . $row["password"] . "<br>";

        if (password_verify($password, $row["password"])) {
            $_SESSION["username"] = $row["username"];
            echo "success";
            exit;
        } else {
            echo "Password salah";
            exit;
        }
    } else {
        echo "Username tidak ditemukan";
        exit;
    }

    
}
?>
