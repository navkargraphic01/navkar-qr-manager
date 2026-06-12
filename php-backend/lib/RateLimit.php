<?php
// ============================================================
// RATE LIMITER - File-based, no Redis/Memcache required
// ============================================================

class RateLimit {

    private static string $storageDir = '';

    public static function setStorageDir(string $dir): void {
        self::$storageDir = rtrim($dir, '/\\');
        if (!is_dir(self::$storageDir)) {
            @mkdir(self::$storageDir, 0750, true);
        }
    }

    private static function getDir(): string {
        if (!self::$storageDir) {
            self::$storageDir = sys_get_temp_dir() . '/navkar_ratelimit';
            if (!is_dir(self::$storageDir)) {
                @mkdir(self::$storageDir, 0750, true);
            }
        }
        return self::$storageDir;
    }

    /**
     * Check if an identifier has exceeded the rate limit
     *
     * @param string $identifier  Unique key (e.g., IP + action)
     * @param int    $maxAttempts Max allowed attempts
     * @param int    $windowSecs  Time window in seconds
     * @return bool  true = allowed, false = rate limited
     */
    public static function check(string $identifier, int $maxAttempts = 5, int $windowSecs = 900): bool {
        $file = self::getDir() . '/' . md5($identifier) . '.json';
        $now  = time();

        $data = [];
        if (file_exists($file)) {
            $raw = @file_get_contents($file);
            if ($raw) $data = json_decode($raw, true) ?? [];
        }

        // Filter out old attempts outside the window
        $data = array_filter($data, fn($ts) => ($now - $ts) < $windowSecs);
        $data = array_values($data);

        if (count($data) >= $maxAttempts) {
            return false; // Rate limited
        }

        // Record this attempt
        $data[] = $now;
        @file_put_contents($file, json_encode($data), LOCK_EX);

        return true; // Allowed
    }

    /**
     * Get remaining attempts for an identifier
     */
    public static function remaining(string $identifier, int $maxAttempts = 5, int $windowSecs = 900): int {
        $file = self::getDir() . '/' . md5($identifier) . '.json';
        $now  = time();

        if (!file_exists($file)) return $maxAttempts;

        $raw  = @file_get_contents($file);
        $data = $raw ? json_decode($raw, true) ?? [] : [];
        $data = array_filter($data, fn($ts) => ($now - $ts) < $windowSecs);

        return max(0, $maxAttempts - count($data));
    }

    /**
     * Reset the rate limit for an identifier (e.g., on successful login)
     */
    public static function reset(string $identifier): void {
        $file = self::getDir() . '/' . md5($identifier) . '.json';
        if (file_exists($file)) @unlink($file);
    }

    /**
     * How many seconds until the oldest entry expires
     */
    public static function retryAfter(string $identifier, int $windowSecs = 900): int {
        $file = self::getDir() . '/' . md5($identifier) . '.json';
        if (!file_exists($file)) return 0;

        $raw  = @file_get_contents($file);
        $data = $raw ? json_decode($raw, true) ?? [] : [];
        if (empty($data)) return 0;

        $oldest = min($data);
        return max(0, $windowSecs - (time() - $oldest));
    }
}
