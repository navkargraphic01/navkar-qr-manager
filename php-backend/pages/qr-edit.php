<?php
$pageTitle  = 'Edit QR Code';
$pageScript = 'qr-edit.js';
require_once __DIR__ . '/../includes/auth_check.php';
$qrId = htmlspecialchars($_GET['id'] ?? '', ENT_QUOTES);
if (!$qrId) { header('Location: ' . SITE_BASE . '/qr-codes'); exit(); }
try {
    $db   = db();
    $cats = $db->query("SELECT id, name FROM categories ORDER BY name")->fetchAll();
    $tpls = $db->query("SELECT id, name FROM qr_templates ORDER BY name")->fetchAll();
} catch (Exception $e) { $cats = []; $tpls = []; }
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
    <div class="topbar-title">Edit QR Code</div>
    <div class="topbar-sub">
      <a href="<?= SITE_BASE ?>/qr-codes" style="color:var(--muted)">QR Codes</a>
      <span class="breadcrumb-sep"> / </span>
      <span class="mono" style="color:var(--primary);font-size:12px"><?= $qrId ?></span>
    </div>
  </div>
  <div class="topbar-actions">
    <button class="icon-btn" id="theme-toggle" title="Toggle theme"></button>
    <button id="save-btn" class="btn btn-primary btn-sm">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Save Changes
    </button>
  </div>
</header>

<main class="page-body">
  <div id="page-loading" class="card card-p anim" style="text-align:center;padding:48px">
    <div style="font-size:14px;color:var(--muted)">Loading QR Code data...</div>
    <div class="skel skel-card" style="max-width:400px;margin:16px auto 0"></div>
  </div>

  <div id="page-content" style="display:none">
    <div class="grid" style="grid-template-columns:1fr 340px;gap:24px;align-items:start">

      <!-- Form -->
      <div class="card anim">
        <div class="card-p" style="border-bottom:1px solid var(--border)">
          <div style="font-size:16px;font-weight:800;color:var(--text)">Edit Product Details</div>
          <div class="text-muted text-sm">Changes to the Destination URL are tracked in history.</div>
        </div>
        <form id="edit-form" class="card-p">
          <input type="hidden" id="qr-db-id" value="">

          <div class="form-group">
            <label class="form-label">Product Name <span class="req">*</span></label>
            <input id="product-name" type="text" class="form-control" required>
          </div>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Product Code / SKU</label>
              <input id="product-code" type="text" class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select id="category-id" class="form-control">
                <option value="">No Category</option>
                <?php foreach ($cats as $c): ?>
                <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['name']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
          </div>

          <!-- URL section with change highlight -->
          <div class="form-group">
            <label class="form-label">
              Destination URL <span class="req">*</span>
              <span id="url-changed-badge" class="badge badge-warning" style="display:none;margin-left:6px;font-size:11px">URL Changed</span>
            </label>
            <input id="destination-url" type="url" class="form-control" required>
            <div class="form-hint">Changing this URL creates a history entry. All QR codes continue working.</div>
          </div>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Design Template</label>
              <select id="template-id" class="form-control">
                <option value="">Classic White (Default)</option>
                <option value="wood-premium">Champagne Gold</option>
                <option value="industrial-dark">Industrial Dark</option>
                <?php foreach ($tpls as $t): ?>
                <option value="<?= $t['id'] ?>"><?= htmlspecialchars($t['name']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select id="status" class="form-control">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="description" class="form-control" rows="3"></textarea>
          </div>

        </form>
      </div>

      <!-- Right Panel -->
      <div style="position:sticky;top:86px;display:flex;flex-direction:column;gap:16px">

        <!-- QR Preview -->
        <div class="card card-p anim anim-2" style="text-align:center">
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:14px">QR Code</div>
          <div class="qr-container" style="margin:0 auto;display:inline-flex">
            <div id="qr-display" style="width:160px;height:160px"></div>
            <div class="qr-id-label" id="qr-id-label"><?= $qrId ?></div>
          </div>
          <div class="flex gap-2 justify-center mt-4">
            <button id="download-btn" class="btn btn-outline btn-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </button>
            <button id="copy-url-btn" class="btn btn-outline btn-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy URL
            </button>
          </div>
        </div>

        <!-- URL History -->
        <div class="card anim anim-3">
          <div class="card-p" style="border-bottom:1px solid var(--border)">
            <div style="font-size:14px;font-weight:700;color:var(--text)">URL History</div>
          </div>
          <div id="url-history" class="card-p" style="font-size:12px;max-height:220px;overflow-y:auto">
            <div class="skel skel-text mb-2"></div>
            <div class="skel skel-text" style="width:75%"></div>
          </div>
        </div>

        <!-- Scan Stats -->
        <div class="card card-p anim anim-4">
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">Scan Stats</div>
          <div class="flex justify-between mb-2">
            <span class="text-muted text-sm">Total Scans</span>
            <span id="scan-total" class="font-bold text-sm">—</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-muted text-sm">Last Scanned</span>
            <span id="last-scanned" class="text-sm">—</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted text-sm">Created</span>
            <span id="created-at" class="text-sm">—</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</main>

<script>window.EDIT_QR_ID = '<?= addslashes($qrId) ?>';</script>
<?php require_once __DIR__ . '/../includes/layout_footer.php'; ?>
