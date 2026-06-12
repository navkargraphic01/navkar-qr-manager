<?php
// ============================================================
// LAYOUT SIDEBAR
// $currentUser = from auth_check.php
// $pageTitle   = current page title for active link detection
// ============================================================
$_nav = [
  ['href' => '/dashboard',     'icon' => 'grid',      'label' => 'Dashboard'],
  ['href' => '/qr-codes',      'icon' => 'qr',        'label' => 'QR Codes'],
  ['href' => '/analytics',     'icon' => 'chart',     'label' => 'Analytics'],
  ['href' => '/design-studio', 'icon' => 'palette',   'label' => 'Design Studio'],
  ['href' => '/bulk-upload',   'icon' => 'upload',    'label' => 'Bulk Upload'],
  ['href' => '/settings',      'icon' => 'settings',  'label' => 'Settings'],
];

// Detect active item from current URI
$_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$_uri = rtrim(str_replace(SITE_BASE, '', $_uri), '/') ?: '/dashboard';

function sb_icon(string $name): string {
  $icons = [
    'grid'     => '<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    'qr'       => '<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h1v1h-1z M17 14h1v1h-1z M20 14h1v1h-1z M14 17h1v1h-1z M17 17h1v1h-1z M20 17h1v1h-1z M14 20h1v1h-1z M17 20h1v1h-1z M20 20h1v1h-1z"/></svg>',
    'chart'    => '<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    'palette'  => '<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
    'upload'   => '<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>',
    'settings' => '<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    'logout'   => '<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    'chevron-left'  => '<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>',
    'chevron-right' => '<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>',
    'scan'     => '<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  ];
  return $icons[$name] ?? '';
}

$_initials = strtoupper(substr($currentUser['full_name'] ?? 'U', 0, 1));
$_role = ucfirst($currentUser['role'] ?? 'user');
$_name = htmlspecialchars($currentUser['full_name'] ?? 'User', ENT_QUOTES);
?>
<!-- ═══════════════ SIDEBAR ═══════════════ -->
<aside class="sidebar" id="sidebar">

  <!-- Brand -->
  <div class="sb-brand">
    <div class="sb-logo">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <path d="M14 14h3v3m0-3h3v3M14 20h3m3 0h-3"/>
      </svg>
    </div>
    <div>
      <div class="sb-name">Navkar QR</div>
      <div class="sb-sub">Manager</div>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="sb-nav">
    <div class="sb-group-label">MAIN MENU</div>
    <?php foreach ($_nav as $item):
      $active = (strpos($_uri, $item['href']) === 0) ? ' active' : '';
    ?>
    <a href="<?= SITE_BASE . $item['href'] ?>" class="sb-item<?= $active ?>">
      <?= sb_icon($item['icon']) ?>
      <span class="sb-label"><?= $item['label'] ?></span>
    </a>
    <?php endforeach; ?>
  </nav>

  <!-- Footer -->
  <div class="sb-foot">
    <!-- User info -->
    <div class="sb-user">
      <div class="sb-avatar"><?= $_initials ?></div>
      <div class="sb-user-info">
        <div class="sb-user-name truncate" style="max-width:140px"><?= $_name ?></div>
        <div class="sb-user-role"><?= $_role ?></div>
      </div>
    </div>

    <!-- Logout -->
    <a href="<?= SITE_BASE ?>/logout" class="sb-btn logout" id="logout-link">
      <?= sb_icon('logout') ?>
      <span>Sign Out</span>
    </a>

    <!-- Collapse toggle -->
    <button class="sb-btn sb-collapse" id="sidebar-toggle" title="Collapse sidebar">
      <?= sb_icon('chevron-left') ?>
      <span>Collapse</span>
    </button>
  </div>
</aside>
<!-- ═══════════════ / SIDEBAR ═══════════════ -->

<!-- MAIN WRAPPER -->
<div class="main" id="main-wrapper">
