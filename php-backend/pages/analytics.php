<?php
$pageTitle  = 'Analytics';
$pageScript = 'analytics.js';
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../includes/layout_header.php';
require_once __DIR__ . '/../includes/layout_sidebar.php';
?>

<header class="topbar">
  <button class="icon-btn" id="mob-menu" style="display:none">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>
  <div>
    <div class="topbar-title">Analytics</div>
    <div class="topbar-sub">Scan performance and insights</div>
  </div>
  <div class="topbar-actions">
    <select id="range-select" class="form-control" style="width:130px;font-size:12px;padding:6px 10px">
      <option value="7">Last 7 days</option>
      <option value="14">Last 14 days</option>
      <option value="30" selected>Last 30 days</option>
      <option value="60">Last 60 days</option>
      <option value="90">Last 90 days</option>
    </select>
    <button class="icon-btn" id="theme-toggle" title="Toggle theme"></button>
    <button id="export-csv-btn" class="btn btn-outline btn-sm">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Export CSV
    </button>
  </div>
</header>

<main class="page-body">

  <!-- Summary Stats -->
  <div class="grid grid-4 mb-4">
    <div class="card stat-card anim anim-1">
      <div class="stat-icon mb-2" style="background:rgba(37,99,235,.1)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <div class="stat-value" id="stat-period-scans">—</div>
      <div class="stat-label">Scans in Period</div>
    </div>
    <div class="card stat-card anim anim-2">
      <div class="stat-icon mb-2" style="background:rgba(16,185,129,.1)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      </div>
      <div class="stat-value" id="stat-unique-qr">—</div>
      <div class="stat-label">Unique QR Scanned</div>
    </div>
    <div class="card stat-card anim anim-3">
      <div class="stat-icon mb-2" style="background:rgba(96,165,250,.1)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
      </div>
      <div class="stat-value" id="stat-mobile-pct">—%</div>
      <div class="stat-label">Mobile Scans</div>
    </div>
    <div class="card stat-card anim anim-4">
      <div class="stat-icon mb-2" style="background:rgba(245,158,11,.1)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      </div>
      <div class="stat-value" id="stat-countries">—</div>
      <div class="stat-label">Countries Reached</div>
    </div>
  </div>

  <!-- Scan Trend Chart -->
  <div class="card anim anim-2 mb-4">
    <div class="card-p" style="border-bottom:1px solid var(--border)">
      <div style="font-size:15px;font-weight:800;color:var(--text)">Daily Scan Trend</div>
      <div class="text-muted text-sm">Scans over the selected period</div>
    </div>
    <div class="card-p">
      <div class="chart-wrap" style="height:260px"><canvas id="trend-chart"></canvas></div>
    </div>
  </div>

  <!-- Row 2: Device + Countries -->
  <div class="grid grid-2 mb-4">

    <!-- Device Breakdown -->
    <div class="card anim anim-3">
      <div class="card-p" style="border-bottom:1px solid var(--border)">
        <div style="font-size:15px;font-weight:800;color:var(--text)">Device Breakdown</div>
      </div>
      <div class="card-p flex gap-4 items-center">
        <div style="width:180px;height:180px;flex-shrink:0"><canvas id="device-chart"></canvas></div>
        <div id="device-legend" style="flex:1;font-size:13px"></div>
      </div>
    </div>

    <!-- Top Countries -->
    <div class="card anim anim-3">
      <div class="card-p" style="border-bottom:1px solid var(--border)">
        <div style="font-size:15px;font-weight:800;color:var(--text)">Top Countries</div>
      </div>
      <div class="card-p" style="max-height:260px;overflow-y:auto">
        <div id="countries-list">
          <div class="skel skel-text mb-2"></div>
          <div class="skel skel-text mb-2" style="width:80%"></div>
          <div class="skel skel-text" style="width:65%"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Top QR Codes + Recent Scans -->
  <div class="grid grid-2">

    <!-- Top QR codes -->
    <div class="table-wrap anim anim-4">
      <div class="table-toolbar">
        <div style="font-weight:800;color:var(--text)">Top QR Codes by Scans</div>
      </div>
      <table class="dtable">
        <thead><tr><th>QR ID</th><th>Product</th><th>Scans</th><th>Share</th></tr></thead>
        <tbody id="top-qr-body">
          <tr><td colspan="4" style="padding:24px;text-align:center"><div class="skel skel-row mb-1"></div><div class="skel skel-row"></div></td></tr>
        </tbody>
      </table>
    </div>

    <!-- Recent Scans -->
    <div class="table-wrap anim anim-5">
      <div class="table-toolbar">
        <div style="font-weight:800;color:var(--text)">Recent Scans</div>
      </div>
      <table class="dtable">
        <thead><tr><th>QR ID</th><th>Device</th><th>Country</th><th>Time</th></tr></thead>
        <tbody id="recent-body">
          <tr><td colspan="4" style="padding:24px;text-align:center"><div class="skel skel-row mb-1"></div><div class="skel skel-row"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

</main>

<?php require_once __DIR__ . '/../includes/layout_footer.php'; ?>
