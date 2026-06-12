<?php
// ============================================================
// LAYOUT HEADER — HTML head + page wrapper open
// $pageTitle   = Page title string
// $pageScript  = JS filename in assets/js/ (without path)
// $currentUser = Populated by auth_check.php
// ============================================================
if (!defined('SITE_BASE')) define('SITE_BASE', '');
$_theme = htmlspecialchars($currentUser['theme_preference'] ?? 'light', ENT_QUOTES);
$_user  = $currentUser ?? [];
$_token = defined('CURRENT_TOKEN') ? CURRENT_TOKEN : '';
$_initTheme = "
  (function(){
    var t = localStorage.getItem('navkar_theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
  })();
";
?>
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Navkar QR Manager — Dynamic QR Code Management Platform">
  <meta name="robots" content="noindex,nofollow">
  <title><?= htmlspecialchars($pageTitle ?? 'Dashboard') ?> — Navkar QR Manager</title>

  <!-- Init theme before render to avoid flash -->
  <script><?= $_initTheme ?></script>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <!-- App CSS -->
  <link rel="stylesheet" href="<?= SITE_BASE ?>/assets/css/app.css">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%232563EB'/><text y='.9em' font-size='80' x='10'>⬛</text></svg>">

  <!-- Pass server-side data to JS -->
  <script>
    window.SITE_BASE = '<?= SITE_BASE ?>';
    window.APP_TOKEN = '<?= htmlspecialchars($_token, ENT_QUOTES) ?>';
  </script>
  <script id="current-user-data" type="application/json">
    <?= json_encode([
      'id'        => $_user['id']        ?? '',
      'email'     => $_user['email']     ?? '',
      'full_name' => $_user['full_name'] ?? '',
      'role'      => $_user['role']      ?? 'user',
      'company'   => $_user['company']   ?? '',
    ]) ?>
  </script>
</head>
<body>
<div class="sidebar-overlay" id="sb-overlay"></div>
<div class="app">
