<?php
session_start(); 

include 'koneksi.php'; // Make sure connection is correct

header('Content-Type: application/json');

// Read JSON data from request body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
    exit;
}

// Check if action is reset_all
if (isset($input['action']) && $input['action'] === 'reset_all') {
    // Delete all sleep monitoring data for this user
    // You might want to add user-specific filtering if you have multiple users
    $sql = "DELETE FROM sleep_monitoring";
    
    if ($conn->query($sql) === TRUE) {
        // Reset auto increment
        $conn->query("ALTER TABLE sleep_monitoring AUTO_INCREMENT = 1");
        
        echo json_encode(['status' => 'success', 'message' => 'All data has been reset']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to reset data: ' . $conn->error]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}

$conn->close();
?>
