<?php
header('Content-Type: application/json');
require 'koneksi.php';
$conn->query("ALTER TABLE sleep_monitoring AUTO_INCREMENT = 1");  // $conn -> mysqli
// Ambil JSON body
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['status'=>'error','message'=>'Invalid JSON']);
    exit;
}

// --- Konversi timestamp MS → DateTime + timezone ---
try {
    if (isset($input['timestamp'])) {
        $timestamp = $input['timestamp'];
        
        // Handle both milliseconds (number) and ISO string formats
        if (is_numeric($timestamp)) {
            // Assume milliseconds if number is large (> year 2000 in seconds)
            if ($timestamp > 946684800) {
                $ts = $timestamp > 9999999999 ? $timestamp / 1000 : $timestamp;
            } else {
                $ts = $timestamp;
            }
        } else {
            // ISO string format - convert to timestamp
            $ts = strtotime($timestamp);
        }
        
        // Buat DateTime dari timestamp UTC
        $dt = new DateTime('@' . $ts, new DateTimeZone('UTC'));
        
        // Set ke timezone WITA (Indonesia Tengah)
        $dt->setTimezone(new DateTimeZone('Asia/Makassar'));
        
    } else {
        // Fallback: gunakan waktu server saat ini dengan timezone WITA
        $dt = new DateTime('now', new DateTimeZone('Asia/Makassar'));
    }
    
    $log_time = $dt->format('Y-m-d H:i:s');
} catch (Exception $e) {
    // Fallback dengan timezone WITA
    $dt = new DateTime('now', new DateTimeZone('Asia/Makassar'));
    $log_time = $dt->format('Y-m-d H:i:s');
}

// Normalisasi & sanitasi
$device_name   = $input['deviceName']   ?? null;
$dailyMicro    = isset($input['dailyMicrosleeps'])   ? (int)$input['dailyMicrosleeps']   : 0;
$weeklyMicro   = isset($input['weeklyMicrosleeps'])  ? (int)$input['weeklyMicrosleeps']  : 0;
$weeklyHours   = isset($input['weeklyHours'])        ? (float)$input['weeklyHours']      : 0;
$weeklyRate    = isset($input['weeklyRate'])         ? (float)$input['weeklyRate']       : 0;
$monthlyMicro  = isset($input['monthlyMicrosleeps']) ? (int)$input['monthlyMicrosleeps'] : 0;
$monthlyHours  = isset($input['monthlyHours'])       ? (float)$input['monthlyHours']     : 0;
$monthlyRate   = isset($input['monthlyRate'])        ? (float)$input['monthlyRate']      : 0;
$totalHours    = isset($input['totalHours'])         ? (float)$input['totalHours']       : 0;
$sleep_quality = $input['sleepQuality'] ?? null;

// Query INSERT
$sql = "INSERT INTO sleep_monitoring
          (log_time, device_name,
           daily_microsleeps,
           weekly_microsleeps, weekly_hours, weekly_rate,
           monthly_microsleeps, monthly_hours, monthly_rate,
           total_hours, sleep_quality)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['status'=>'error','message'=>$conn->error]);
    exit;
}

$stmt->bind_param(
    'ssiididddds',
    $log_time, $device_name,
    $dailyMicro,
    $weeklyMicro, $weeklyHours, $weeklyRate,
    $monthlyMicro, $monthlyHours, $monthlyRate,
    $totalHours, $sleep_quality
);

if ($stmt->execute()) {
    echo json_encode([
        'status' => 'success',
        'id'     => $stmt->insert_id,
        'log_time_saved' => $log_time
    ]);
} else {
    echo json_encode([
        'status'  => 'error',
        'message' => $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
