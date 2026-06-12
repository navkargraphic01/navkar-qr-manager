<?php
$pageTitle  = 'Dashboard';
$pageScript = 'dashboard.js';
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../includes/layout_header.php';
require_once __DIR__ . '/../includes/layout_sidebar.php';

// Server-side stats for instant render (no AJAX flash)
try {
    $db = db();
    $totalQR  = $db->query("SELECT COUNT(*) FROM qr_codes")->fetchColumn();
    $activeQR = $db->query("SELECT COUNT(*) FROM qr_codes WHERE status='active'")->fetchColumn();
    $totalScans = $db->query("SELECT COUNT(*) FROM scans")->fetchColumn();
    $todayScans = $db->query("SELECT COUNT(*) FROM scans WHERE DATE(scanned_at)=CURDATE()")->fetchColumn();
} catch (Exception $e) {
    $totalQR = $activeQR = $totalScans = $todayScans = 0;
}
?>

<!-- TOPBAR -->
<header class="topbar">
  <button class="icon-btn" id="mob-menu" title="Menu" style="display:none">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>
  <div>
    <div class="topbar-title">
      Good <?= (date('H') < 12 ? 'Morning' : (date('H') < 17 ? 'Afternoon' : 'Evening')) ?>,
      <?= htmlspecialchars(explode(' ', $currentUser['full_name'] ?? 'User')[0]) ?> 👋
    </div>
    <div class="topbar-sub"><?= date('l, F j, Y') ?></div>
  </div>
  <div class="topbar-actions">
    <button class="icon-btn" id="theme-toggle" title="Toggle theme"></button>
    <a href="<?= SITE_BASE ?>/qr-codes/create" class="btn btn-primary btn-sm">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      New QR Code
    </a>
  </div>
</header>

<main class="page-body">

  <!-- Welcome Banner -->
  <div class="gradient-banner mb-4 anim">
    <div class="flex items-center justify-between" style="position:relative;z-index:1">
      <div>
        <h1 style="font-size:22px;font-weight:900;margin:0 0 6px;letter-spacing:-.03em">
          Navkar QR Manager
        </h1>
        <p style="margin:0;opacity:.75;font-size:14px">
          <?= (int)$activeQR ?> active QR codes · <?= (int)$todayScans ?> scans today
        </p>
      </div>
      <div style="text-align:right;opacity:.65;font-size:13px">
        <div><?= htmlspecialchars($currentUser['company'] ?? 'Navkar Plywood') ?></div>
        <div style="font-size:11px;margin-top:3px;text-transform:uppercase;letter-spacing:.06em">v2.0.0 · Enterprise</div>
      </div>
    </div>
  </div>

  <!-- Stat Cards -->
  <div class="grid grid-4 mb-4">

    <div class="card stat-card anim anim-1">
      <div class="flex items-center justify-between">
        <div class="stat-icon" style="background:rgba(37,99,235,.1)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3m0-3h3M17 20h3"/>
          </svg>
        </div>
        <span class="badge badge-info" style="font-size:11px">Total</span>
      </div>
      <div class="stat-value" id="stat-total"><?= (int)$totalQR ?></div>
      <div class="stat-label">QR Codes Created</div>
    </div>

    <div class="card stat-card anim anim-2">
      <div class="flex items-center justify-between">
        <div class="stat-icon" style="background:rgba(16,185,129,.1)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <span class="badge badge-success" style="font-size:11px">Live</span>
      </div>
      <div class="stat-value" id="stat-active"><?= (int)$activeQR ?></div>
      <div class="stat-label">Active QR Codes</div>
    </div>

    <div class="card stat-card anim anim-3">
      <div class="flex items-center justify-between">
        <div class="stat-icon" style="background:rgba(96,165,250,.1)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <span class="badge badge-primary" style="font-size:11px">All time</span>
      </div>
      <div class="stat-value" id="stat-scans"><?= (int)$totalScans ?></div>
      <div class="stat-label">Total Scans</div>
    </div>

    <div class="card stat-card anim anim-4">
      <div class="flex items-center justify-between">
        <div class="stat-icon" style="background:rgba(245,158,11,.1)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <span class="badge badge-warning" style="font-size:11px">Today</span>
      </div>
      <div class="stat-value" id="stat-today"><?= (int)$todayScans ?></div>
      <div class="stat-label">Scans Today</div>
    </div>
  </div>

  <!-- Chart + Recent Scans -->
  <div class="grid grid-2 mb-4" style="grid-template-columns:2fr 1fr">

    <!-- Scan Trend Chart -->
    <div class="card anim anim-2">
      <div class="card-p" style="border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:15px;font-weight:800;color:var(--text)">Scan Trend</div>
          <div class="text-muted text-sm">Last 30 days</div>
        </div>
        <select id="trend-period" class="form-control" style="width:auto;font-size:12px;padding:5px 10px">
          <option value="14">14 days</option>
          <option value="30" selected>30 days</option>
          <option value="60">60 days</option>
        </select>
      </div>
      <div class="card-p">
        <div class="chart-wrap" style="height:220px"><canvas id="scan-chart"></canvas></div>
      </div>
    </div>

    <!-- Top QR Codes -->
    <div class="card anim anim-3">
      <div class="card-p" style="border-bottom:1px solid var(--border)">
        <div style="font-size:15px;font-weight:800;color:var(--text)">Top QR Codes</div>
        <div class="text-muted text-sm">By scan count</div>
      </div>
      <div id="top-qr-list" class="card-p" style="padding-top:10px">
        <div class="skel skel-text mb-2"></div>
        <div class="skel skel-text mb-2" style="width:85%"></div>
        <div class="skel skel-text mb-2" style="width:70%"></div>
      </div>
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="grid grid-2">

    <!-- Recent QR Codes -->
    <div class="table-wrap anim anim-3">
      <div class="table-toolbar">
        <div>
          <div style="font-weight:800;color:var(--text)">Recent QR Codes</div>
          <div class="text-muted text-sm">Last 5 created</div>
        </div>
        <a href="<?= SITE_BASE ?>/qr-codes" class="btn btn-outline btn-sm">View All</a>
      </div>
      <div id="recent-qr-table">
        <div class="card-p"><div class="skel skel-row mb-1"></div><div class="skel skel-row mb-1"></div><div class="skel skel-row"></div></div>
      </div>
    </div>

    <!-- Recent Scans -->
    <div class="table-wrap anim anim-4">
      <div class="table-toolbar">
        <div>
          <div style="font-weight:800;color:var(--text)">Recent Scans</div>
          <div class="text-muted text-sm">Last 5 scans</div>
        </div>
        <a href="<?= SITE_BASE ?>/analytics" class="btn btn-outline btn-sm">Analytics</a>
      </div>
      <div id="recent-scans-table">
        <div class="card-p"><div class="skel skel-row mb-1"></div><div class="skel skel-row mb-1"></div><div class="skel skel-row"></div></div>
      </div>
    </div>
  </div>

</main>

<?php require_once __DIR__ . '/../includes/layout_footer.php'; ?>
