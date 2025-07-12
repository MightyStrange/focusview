<?php
require 'koneksi.php';
header('Content-Type: application/json; charset=utf-8');

// ambil data ordered terbaru dulu
$sql = "
  SELECT
    id,
    log_time,       -- ini DATETIME di DB
    device_name,
    daily_microsleeps,
    weekly_microsleeps,
    weekly_hours,
    weekly_rate,
    monthly_microsleeps,
    monthly_hours,
    monthly_rate,
    total_hours,
    sleep_quality
  FROM sleep_monitoring
  ORDER BY log_time DESC, id DESC
";

$result = $conn->query($sql);
if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => $conn->error]);
    exit;
}

$rows = [];
while ($row = $result->fetch_assoc()) {
    // log_time dari database sudah dalam timezone WITA
    // Parse sebagai Asia/Makassar (WITA), bukan UTC
    $dt = new DateTime($row['log_time'], new DateTimeZone('Asia/Makassar'));
    
    // Kirim sebagai ISO8601 dengan timezone yang benar
    $row['timestamp'] = $dt->format(DateTime::ATOM);

    // hapus field log_time yang lama
    unset($row['log_time']);

    $rows[] = $row;
}

echo json_encode($rows);
$conn->close();
