/* qr-create.js — Create QR Code page */
'use strict';

let qrPreviewObj = null;
let previewTimer  = null;
let createdQrId   = null;
let createdQrData = null;

// Generate a QR ID preview client-side
function generateTempQrId(name) {
  const prefix = 'NP';
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${num}`;
}

function updatePreview() {
  const name = document.getElementById('product-name')?.value.trim();
  const url  = document.getElementById('destination-url')?.value.trim();

  document.getElementById('preview-name').textContent = name || '—';
  document.getElementById('preview-url').textContent  = url  || '—';

  const previewEl = document.getElementById('qr-preview-img');
  if (!previewEl) return;

  const scanUrl = window.SITE_BASE + '/p/' + generateTempQrId(name);
  document.getElementById('preview-scan-url').textContent = url ? scanUrl : 'Auto-generated on save';

  if (!url && !name) {
    previewEl.innerHTML = '<div class="text-muted text-sm" style="text-align:center"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.3;margin-bottom:8px"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><br>Enter product name to preview</div>';
    return;
  }

  previewEl.innerHTML = '';
  try {
    if (qrPreviewObj) { previewEl.innerHTML = ''; }
    qrPreviewObj = new QRCode(previewEl, {
      text: (url || window.location.origin + '/p/preview'),
      width: 180, height: 180,
      colorDark: '#111827', colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {

  // Live preview on input
  ['product-name','destination-url'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(updatePreview, 400);
    });
  });

  // Form submit
  document.getElementById('create-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite;width:14px;height:14px">⟳</span> Creating...';

    const body = {
      product_name:    document.getElementById('product-name').value.trim(),
      destination_url: document.getElementById('destination-url').value.trim(),
      product_code:    document.getElementById('product-code').value.trim(),
      category_id:     document.getElementById('category-id').value || null,
      description:     document.getElementById('description').value.trim(),
      template_id:     document.getElementById('template-id').value || null,
      status:          document.getElementById('status').value,
    };

    try {
      const res = await API.post('/qr', body);
      createdQrId   = res.qr_id || res.data?.qr_id;
      createdQrData = res;

      Toast.success('QR Code created!', `ID: ${createdQrId}`);
      document.getElementById('success-qr-id').textContent = createdQrId;
      document.getElementById('success-card').style.display = '';
      document.getElementById('view-link').href = `${window.SITE_BASE}/qr-codes/${createdQrId}/edit`;

      // Render final QR
      const img = document.getElementById('qr-preview-img');
      img.innerHTML = '';
      const scanUrl = `${window.location.origin}${window.SITE_BASE}/p/${createdQrId}`;
      new QRCode(img, {
        text: scanUrl, width:180, height:180,
        colorDark:'#111827', colorLight:'#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M
      });
      document.getElementById('preview-qr-id').textContent = createdQrId;
      document.getElementById('preview-scan-url').textContent = scanUrl;

      btn.disabled = false;
      btn.innerHTML = '✓ Created';

    } catch (err) {
      Toast.error('Failed to create', err.message);
      btn.disabled = false;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Create QR Code';
    }
  });

  // Download created QR
  document.getElementById('download-btn')?.addEventListener('click', () => {
    const canvas = document.getElementById('qr-preview-img')?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${createdQrId || 'qr-code'}.png`;
    a.click();
    Toast.success('Downloaded!');
  });

  // Create another
  document.getElementById('create-another-btn')?.addEventListener('click', () => {
    document.getElementById('create-form').reset();
    document.getElementById('success-card').style.display = 'none';
    document.getElementById('qr-preview-img').innerHTML = '<div class="text-muted text-sm" style="text-align:center"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.3;margin-bottom:8px"><rect x="3" y="3" width="7" height="7"/></svg><br>Enter product name to preview</div>';
    document.getElementById('preview-qr-id').textContent = '——';
    document.getElementById('preview-name').textContent = '—';
    document.getElementById('preview-url').textContent = '—';
    document.getElementById('submit-btn').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Create QR Code';
    document.getElementById('submit-btn').disabled = false;
    document.getElementById('product-name').focus();
  });
});
