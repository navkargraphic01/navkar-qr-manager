<?php
// ============================================================
// CSRF TOKEN HELPER
// Provides CSRF token generation and validation for forms
// ============================================================

class CSRF {

    const TOKEN_KEY = '_csrf_token';
    const TOKEN_LENGTH = 32;

    /**
     * Generate (or reuse) a CSRF token stored in the session
     */
    public static function token(): string {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (empty($_SESSION[self::TOKEN_KEY])) {
            $_SESSION[self::TOKEN_KEY] = bin2hex(random_bytes(self::TOKEN_LENGTH));
        }
        return $_SESSION[self::TOKEN_KEY];
    }

    /**
     * Validate the CSRF token from a request
     * Checks POST['_csrf'] or header X-CSRF-Token
     */
    public static function verify(): bool {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $sessionToken = $_SESSION[self::TOKEN_KEY] ?? '';
        if (empty($sessionToken)) return false;

        $requestToken = $_POST[self::TOKEN_KEY] ?? ''
            ?: ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')
            ?: ($_SERVER['HTTP_X_XSRF_TOKEN'] ?? '');

        return hash_equals($sessionToken, $requestToken);
    }

    /**
     * Rotate token after use (best practice)
     */
    public static function rotate(): string {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION[self::TOKEN_KEY] = bin2hex(random_bytes(self::TOKEN_LENGTH));
        return $_SESSION[self::TOKEN_KEY];
    }

    /**
     * Render a hidden input field for forms
     */
    public static function input(): string {
        return '<input type="hidden" name="' . self::TOKEN_KEY . '" value="' . self::token() . '">';
    }

    /**
     * Output just the meta tag for JS usage
     */
    public static function meta(): string {
        return '<meta name="csrf-token" content="' . self::token() . '">';
    }
}
