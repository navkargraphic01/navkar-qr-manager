<?php
// pages/design-studio.php
require_once __DIR__ . '/../includes/auth_check.php';

$title = 'Design Studio';
require __DIR__ . '/../includes/layout_header.php';
require __DIR__ . '/../includes/layout_sidebar.php';
?>

<div class="header-banner">
  <div class="flex justify-between items-center">
    <div>
      <h1>Design Studio <span class="badge badge-primary">Beta</span></h1>
      <p class="text-muted" style="margin-top:8px">Design beautiful QR code layouts with text and logos.</p>
    </div>
    <button class="btn btn-primary" id="download-canvas-btn">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download Design
    </button>
  </div>
</div>

<div class="grid" style="grid-template-columns: 320px 1fr; gap: 24px; align-items: start;">
  
  <!-- Left Tools -->
  <div class="card p-4">
    <h3 style="margin-bottom:20px;font-size:16px;color:var(--text)">Design Tools</h3>
    
    <div class="form-group">
      <label>Select QR Code</label>
      <select id="ds-qr-select" class="input">
        <option value="">-- Choose a QR --</option>
      </select>
    </div>

    <hr style="margin:24px 0;border:0;border-top:1px solid var(--border)">

    <div class="form-group">
      <label>Heading Text</label>
      <input type="text" id="ds-heading" class="input" placeholder="e.g. Scan Here!">
    </div>

    <div class="form-group">
      <label>Subheading Text</label>
      <input type="text" id="ds-subheading" class="input" placeholder="e.g. For Warranty Details">
    </div>

    <hr style="margin:24px 0;border:0;border-top:1px solid var(--border)">

    <div class="form-group">
      <label>Colors</label>
      <div class="grid grid-2">
        <div>
          <label class="text-xs text-muted mb-1 block">Background</label>
          <input type="color" id="ds-bg-color" value="#ffffff" style="width:100%;height:40px;padding:0;border:none;border-radius:6px;cursor:pointer">
        </div>
        <div>
          <label class="text-xs text-muted mb-1 block">Text Color</label>
          <input type="color" id="ds-text-color" value="#111827" style="width:100%;height:40px;padding:0;border:none;border-radius:6px;cursor:pointer">
        </div>
      </div>
    </div>

    <div class="form-group mt-3">
      <label>Template Style</label>
      <div class="flex gap-2">
        <button class="btn btn-outline btn-sm ds-template-btn active" data-style="modern" style="flex:1">Modern</button>
        <button class="btn btn-outline btn-sm ds-template-btn" data-style="classic" style="flex:1">Classic</button>
      </div>
    </div>
  </div>

  <!-- Right Canvas -->
  <div class="card" style="min-height:500px; display:flex; align-items:center; justify-content:center; background: var(--bg-alt); position:relative">
    <div id="ds-canvas-container" style="box-shadow: 0 20px 40px rgba(0,0,0,0.1); border-radius: 12px; overflow:hidden">
      <canvas id="ds-canvas" width="600" height="800" style="display:block; max-width:100%; height:auto"></canvas>
    </div>
  </div>

</div>

<!-- QRCode.js Library -->
<script src="<?php echo SITE_BASE; ?>/assets/js/qrcode.min.js"></script>
<script src="<?php echo SITE_BASE; ?>/assets/js/design-studio.js"></script>

<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
