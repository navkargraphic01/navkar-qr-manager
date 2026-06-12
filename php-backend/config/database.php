<?php
// ============================================================
// DATABASE CONNECTION - PDO MySQL
// ============================================================
require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                DB_HOST, DB_NAME, DB_CHARSET
            );
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            ];
            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                http_response_code(503);
                echo json_encode(['error' => 'Database connection failed', 'detail' => $e->getMessage()]);
                exit();
            }
        }
        return self::$instance;
    }
}

// Helper: get PDO connection
function db(): PDO {
    return Database::getConnection();
}

// Helper: generate a UUID v4
function generate_uuid(): string {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Helper: generate next QR ID (NP001, NP002, ...)
function generate_qr_id(): string {
    $db = db();
    $db->beginTransaction();
    try {
        // Lock row and increment
        $stmt = $db->prepare("UPDATE qr_counter SET current_value = current_value + 1 WHERE id = 1");
        $stmt->execute();
        $stmt = $db->prepare("SELECT current_value, prefix FROM qr_counter WHERE id = 1");
        $stmt->execute();
        $row = $stmt->fetch();
        $db->commit();
        return $row['prefix'] . str_pad($row['current_value'], 3, '0', STR_PAD_LEFT);
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}
