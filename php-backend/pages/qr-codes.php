<?php
$pageTitle  = 'QR Codes';
$pageScript = 'qr-codes.js';
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../includes/layout_header.php';
require_once __DIR__ . '/../includes/layout_sidebar.php';
?>

<!-- TOPBAR -->
<header class="topbar">
  <button class="icon-btn" id="mob-menu" style="display:none">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>
  <div>
    <div class="topbar-title">QR Codes</div>
    <div class="topbar-sub">Manage all your dynamic QR codes</div>
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

  <!-- Search + Filter bar -->
  <div class="card card-p mb-4 anim">
    <div class="flex items-center gap-3 flex-wrap">
      <div class="flex-1" style="min-width:220px">
        <div style="position:relative">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted)">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input id="search-input" type="search" class="form-control"
            placeholder="Search by name, code or ID..." style="padding-left:38px">
        </div>
      </div>
      <select id="status-filter" class="form-control" style="width:150px">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select id="sort-filter" class="form-control" style="width:170px">
        <option value="created_at">Newest First</option>
        <option value="scan_count">Most Scanned</option>
        <option value="product_name">Name A→Z</option>
      </select>
      <button class="btn btn-outline btn-sm" id="refresh-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        Refresh
      </button>
    </div>
  </div>

  <!-- Table -->
  <div class="table-wrap anim anim-2">
    <div class="table-toolbar">
      <div>
        <span style="font-weight:800;color:var(--text)">All QR Codes</span>
        <span class="badge badge-muted ml-2" id="total-count" style="margin-left:8px">—</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-outline btn-sm" id="bulk-download-btn" style="display:none">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Selected
        </button>
      </div>
    </div>

    <div style="overflow-x:auto">
      <table class="dtable">
        <thead>
          <tr>
            <th style="width:40px"><input type="checkbox" id="select-all"></th>
            <th>QR ID</th>
            <th>Product</th>
            <th>Destination URL</th>
            <th>Status</th>
            <th>Scans</th>
            <th>Created</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody id="qr-table-body">
          <tr><td colspan="8" style="padding:32px;text-align:center">
            <div class="skel skel-row mb-1"></div>
            <div class="skel skel-row mb-1"></div>
            <div class="skel skel-row mb-1"></div>
            <div class="skel skel-row mb-1"></div>
            <div class="skel skel-row"></div>
          </td></tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="table-toolbar" id="pagination-bar" style="justify-content:space-between;display:none">
      <div class="text-muted text-sm" id="page-info"></div>
      <div class="flex gap-2">
        <button class="btn btn-outline btn-sm" id="prev-btn">← Prev</button>
        <div id="page-numbers" class="flex gap-1"></div>
        <button class="btn btn-outline btn-sm" id="next-btn">Next →</button>
      </div>
    </div>
  </div>

</main>

<!-- Delete Confirmation Modal -->
<div class="modal-bg" id="delete-modal" style="display:none">
  <div class="modal-box anim-scale" style="max-width:400px">
    <div class="modal-hd">
      <span class="modal-title">Delete QR Code</span>
      <button class="modal-x" onclick="document.getElementById('delete-modal').style.display='none'">×</button>
    </div>
    <div class="modal-bd">
      <p style="color:var(--text2);margin:0">
        Are you sure you want to delete <strong id="delete-qr-name"></strong>?
        This will also delete all scan history. This action cannot be undone.
      </p>
    </div>
    <div class="modal-ft">
      <button class="btn btn-outline" onclick="document.getElementById('delete-modal').style.display='none'">Cancel</button>
      <button class="btn btn-danger" id="confirm-delete-btn">Delete Permanently</button>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/../includes/layout_footer.php'; ?>
