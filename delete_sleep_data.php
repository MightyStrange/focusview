<?php
session_start();
include 'koneksi.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Log function
function logError($message) {
    error_log('[DELETE_SLEEP_DATA] ' . $message);
}

// Hapus semua data
function deleteAll($conn) {
    $sql = "DELETE FROM sleep_monitoring";
    if ($conn->query($sql)) {
        echo json_encode(['success' => true, 'deleted' => $conn->affected_rows]);
    } else {
        logError('Delete all failed: ' . $conn->error);
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
}

// Hapus data berdasarkan ID
function deleteSelected($conn, $ids) {
    $validIds = array_filter($ids, fn($id) => is_numeric($id) && intval($id) > 0);
    if (empty($validIds)) {
        echo json_encode(['success' => false, 'error' => 'Tidak ada ID valid']);
        return;
    }

    $placeholders = implode(',', array_fill(0, count($validIds), '?'));
    $sql = "DELETE FROM sleep_monitoring WHERE id IN ($placeholders)";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        logError('Prepare failed: ' . $conn->error);
        echo json_encode(['success' => false, 'error' => $conn->error]);
        return;
    }

    $types = str_repeat('i', count($validIds));
    $stmt->bind_param($types, ...$validIds);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'deleted' => $stmt->affected_rows]);
    } else {
        logError('Execute failed: ' . $stmt->error);
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }

    $stmt->close();
}

// Ambil action dan IDs
$action = $_REQUEST['action'] ?? '';
$ids = [];

// Tangkap dari POST FormData
if (isset($_POST['ids'])) {
    $decoded = json_decode($_POST['ids'], true);
    if (is_array($decoded)) {
        $ids = $decoded;
    }
}

// Tangkap dari GET URL
if (empty($ids) && isset($_GET['ids'])) {
    $ids = array_map('trim', explode(',', $_GET['ids']));
}

// Tangkap dari JSON payload
if (empty($ids)) {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    if (isset($input['ids']) && is_array($input['ids'])) {
        $ids = $input['ids'];
    }
}

// Eksekusi berdasarkan action
switch ($action) {
    case 'delete_all':
        deleteAll($conn);
        break;

    case 'delete_selected':
        if (!empty($ids)) {
            deleteSelected($conn, $ids);
        } else {
            echo json_encode(['success' => false, 'error' => 'Tidak ada ID yang diterima']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Action tidak valid']);
        break;
}

// Tutup koneksi
$conn->close();
?>
