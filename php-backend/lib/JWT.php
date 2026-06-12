<?php
// ============================================================
// PURE PHP JWT (JSON Web Token) - No Composer Required
// Supports HS256 algorithm only
// ============================================================
require_once __DIR__ . '/../config/config.php';

class JWT {

    /**
     * Encode a payload into a JWT token
     */
    public static function encode(array $payload, int $expirySecs = 0): string {
        $header  = self::base64url_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload['iat'] = time();
        $payload['exp'] = time() + ($expirySecs > 0 ? $expirySecs : JWT_EXPIRY);
        $body    = self::base64url_encode(json_encode($payload));
        $sig     = self::base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
        return "$header.$body.$sig";
    }

    /**
     * Decode and verify a JWT token
     * Returns payload array or throws exception
     */
    public static function decode(string $token): array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }
        [$header, $body, $sig] = $parts;

        // Verify signature
        $expected = self::base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
        if (!hash_equals($expected, $sig)) {
            throw new Exception('Invalid token signature');
        }

        $payload = json_decode(self::base64url_decode($body), true);
        if (!$payload) {
            throw new Exception('Invalid token payload');
        }

        // Check expiry
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token has expired');
        }

        return $payload;
    }

    /**
     * Extract token from Authorization header or cookie, validate, and return payload.
     * Calls Response::error(401) and exits if no valid token.
     */
    public static function requireAuth(): array {
        $token = null;

        // 1. Authorization: Bearer <token>
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (empty($auth) && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }
        if (empty($auth) && function_exists('getallheaders')) {
            $headers = getallheaders();
            $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        if (str_starts_with($auth, 'Bearer ')) {
            $token = substr($auth, 7);
        }

        // 2. Cookie fallback
        if (!$token) {
            $token = $_COOKIE['navkar_auth'] ?? null;
        }

        if (!$token) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Authentication required']);
            exit();
        }

        try {
            return self::decode($token);
        } catch (Exception $e) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Invalid or expired token']);
            exit();
        }
    }

    private static function base64url_encode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64url_decode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }
}
