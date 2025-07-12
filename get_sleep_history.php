<?php
session_start(); 

include 'koneksi.php'; // Pastikan koneksi benar

header('Content-Type: application/json');

// Jalankan query dengan kolom yang benar
$result = $conn->query("SELECT id, log_time as timestamp, device_name, 
                       daily_microsleeps, weekly_microsleeps, weekly_hours, weekly_rate,
                       monthly_microsleeps, monthly_hours, monthly_rate, sleep_quality
                       FROM sleep_monitoring ORDER BY log_time DESC");

// Periksa hasil query
if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Query failed: ' . $conn->error]);
    $conn->close();
    exit;
}

// Ambil data hasil query
$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

// Tutup koneksi
$conn->close();

// Kembalikan data dalam format JSON
echo json_encode($rows);
?>