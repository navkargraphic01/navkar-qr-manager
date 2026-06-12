/* qr-edit.js — Edit QR Code page */
'use strict';

const QR_ID = window.EDIT_QR_ID;
let qrData  = null;
let origUrl = '';
let qrObj   = null;

async function loadQrData() {
  try {
    const data = await API.get('/qr/' + QR_ID);
    qrData = data.data || data;

    // Populate form
    document.getElementById('qr-db-id').value            = qrData.id || '';
    document.getElementById('product-name').value        = qrData.product_name || '';
    document.getElementById('product-code').value        = qrData.product_code || '';
    document.getElementById('destination-url').value     = qrData.destination_url || '';
    document.getElementById('description').value         = qrData.description || '';
    document.getElementById('status').value              = qrData.status || 'active';
    if (qrData.category_id) document.getElementById('category-id').value = qrData.category_id;
    if (qrData.template_id) document.getElementById('template-id').value = qrData.template_id;

    origUrl = qrData.destination_url || '';

    // Scan stats
    document.getElementById('scan-total').textContent  = formatNum(qrData.scan_count || 0);
    document.getElementById('last-scanned').textContent = qrData.last_scanned_at ? formatDateTime(qrData.last_scanned_at) : 'Never';
    document.getElementById('created-at').textContent   = formatDate(qrData.created_at);

    // Render QR
    renderQR(getQrUrl(QR_ID));

    // URL history
    loadUrlHistory();

    // Show content
    document.getElementById('page-loading').style.display = 'none';
    document.getElementById('page-content').style.display  = '';

  } catch(e) {
    document.getElementById('page-loading').innerHTML = `<div class="danger-box">Failed to load QR data: ${esc(e.message)}</div>`;
    Toast.error('Load failed', e.message);
  }
}

function renderQR(url) {
  const el = document.getElementById('qr-display');
  if (!el) return;
  el.innerHTML = '';
  try {
    qrObj = new QRCode(el, {
      text: url, width: 160, height: 160,
      colorDark: '#111827', colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch(e) {}
}

async function loadUrlHistory() {
  const el = document.getElementById('url-history');
  if (!el) return;
  try {
    const data = await API.get('/qr/' + QR_ID + '/url-history');
    const hist = data.history || data || [];
    if (!hist.length) {
      el.innerHTML = '<div class="text-muted text-xs">No URL changes recorded</div>';
      return;
    }
    el.innerHTML = hist.map((h, i) => `
      <div style="padding:8px 0;border-bottom:1px solid var(--border);${i===0?'':''}">
        <div class="mono text-xs text-primary-c truncate" style="margin-bottom:2px">${esc(h.url||h.destination_url)}</div>
        <div class="text-muted" style="font-size:11px">${formatDateTime(h.changed_at||h.created_at)}</div>
        ${i===0?'<span class="badge badge-success" style="font-size:10px;margin-top:3px">Current</span>':''}
      </div>`).join('');
  } catch(e) {
    el.innerHTML = '<div class="text-muted text-xs">Failed to load history</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!QR_ID) { window.location.href = window.SITE_BASE + '/qr-codes'; return; }

  loadQrData();

  // URL change detection
  document.getElementById('destination-url')?.addEventListener('input', function() {
    const changed = this.value.trim() !== origUrl;
    document.getElementById('url-changed-badge').style.display = changed ? '' : 'none';
    if (changed) this.classList.add('error');
    else this.classList.remove('error');
  });

  // Save button
  document.getElementById('save-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('save-btn');
    btn.disabled = true; btn.textContent = 'Saving...';

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
      await API.put('/qr/' + QR_ID, body);
      origUrl = body.destination_url;
      document.getElementById('url-changed-badge').style.display = 'none';
      document.getElementById('destination-url').classList.remove('error');
      Toast.success('QR Code updated!');
      loadUrlHistory();
    } catch(e) {
      Toast.error('Save failed', e.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Changes';
    }
  });

  // Download QR
  document.getElementById('download-btn')?.addEventListener('click', () => {
    const canvas = document.getElementById('qr-display')?.querySelector('canvas');
    if (!canvas) return Toast.error('QR not ready');
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${QR_ID}.png`;
    a.click();
    Toast.success('Downloaded!');
  });

  // Copy URL
  document.getElementById('copy-url-btn')?.addEventListener('click', () => {
    copyToClipboard(getQrUrl(QR_ID), 'QR scan URL copied!');
  });
});
