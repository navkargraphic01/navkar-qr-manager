<?php
// ============================================================
// JSON RESPONSE HELPER
// ============================================================

class Response {

    public static function json(mixed $data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit();
    }

    public static function success(mixed $data, int $status = 200): void {
        self::json(['data' => $data], $status);
    }

    public static function error(string $message, int $status = 400, mixed $details = null): void {
        $body = ['error' => $message];
        if ($details !== null) $body['details'] = $details;
        self::json($body, $status);
    }

    public static function paginated(array $data, int $total, int $page, int $limit): void {
        self::json([
            'data' => $data,
            'pagination' => [
                'page'  => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => (int) ceil($total / $limit),
            ]
        ]);
    }

    public static function not_found(string $msg = 'Not found'): void {
        self::error($msg, 404);
    }

    public static function unauthorized(string $msg = 'Unauthorized'): void {
        self::error($msg, 401);
    }

    public static function forbidden(string $msg = 'Forbidden'): void {
        self::error($msg, 403);
    }
}

// ============================================================
// REQUEST HELPER — parse JSON body, query params
// ============================================================

function get_body(): array {
    static $body = null;
    if ($body === null) {
        $raw  = file_get_contents('php://input');
        $body = $raw ? (json_decode($raw, true) ?? []) : [];
        // Also merge POST fields
        $body = array_merge($_POST, $body);
    }
    return $body;
}

function body(string $key, mixed $default = null): mixed {
    return get_body()[$key] ?? $default;
}

function query(string $key, mixed $default = null): mixed {
    return $_GET[$key] ?? $default;
}

function method(): string {
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function is_method(string $m): bool {
    return method() === strtoupper($m);
}
