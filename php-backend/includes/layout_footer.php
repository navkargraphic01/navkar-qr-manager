<?php
// ============================================================
// LAYOUT FOOTER — closes main wrapper, loads scripts
// $pageScript = JS file in assets/js/ to include per-page
// ============================================================
?>
    </main><!-- /page-body -->
  </div><!-- /main -->
</div><!-- /app -->

<!-- Toast container -->
<div class="toast-stack" id="toast-stack"></div>

<!-- Core JS -->
<script src="<?= SITE_BASE ?>/assets/js/app.js"></script>

<!-- Chart.js (CDN, used on dashboard + analytics) -->
<?php if (!empty($pageScript) && in_array($pageScript, ['dashboard.js', 'analytics.js'])): ?>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
<?php endif; ?>

<!-- QRCode.js (CDN, used on QR pages) -->
<?php if (!empty($pageScript) && in_array($pageScript, ['qr-codes.js', 'qr-create.js', 'qr-edit.js', 'design-studio.js'])): ?>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<?php endif; ?>

<!-- SheetJS XLSX (CDN, used on bulk upload) -->
<?php if (!empty($pageScript) && $pageScript === 'bulk-upload.js'): ?>
<script src="https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js"></script>
<?php endif; ?>

<!-- Page-specific JS -->
<?php if (!empty($pageScript)): ?>
<script src="<?= SITE_BASE ?>/assets/js/<?= htmlspecialchars($pageScript, ENT_QUOTES) ?>"></script>
<?php endif; ?>

<!-- Mobile sidebar toggle -->
<script>
(function(){
  const btn = document.getElementById('mob-menu');
  if(btn) btn.addEventListener('click', function(){ Sidebar.mobOpen(); });
})();
</script>

</body>
</html>
