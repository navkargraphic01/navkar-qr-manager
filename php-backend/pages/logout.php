<?php
// pages/logout.php — Clear auth cookie and redirect to login
require_once __DIR__ . '/../config/config.php';
if (!defined('SITE_BASE')) {
    $docRoot    = rtrim(str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']), '/');
    $scriptFile = str_replace('\\', '/', $_SERVER['SCRIPT_FILENAME']);
    $webDir     = str_replace($docRoot, '', rtrim(dirname($scriptFile), '/'));
    $bp         = dirname($webDir);
    define('SITE_BASE', ($bp === '/' || $bp === '') ? '' : $bp);
}
// Clear the auth cookie
setcookie('navkar_auth', '', [
    'expires'  => time() - 3600,
    'path'     => '/',
    'samesite' => 'Lax',
    'httponly' => false,
]);
// Session cleanup if any
if (session_status() !== PHP_SESSION_NONE) {
    session_destroy();
}
header('Location: ' . SITE_BASE . '/login');
exit();
