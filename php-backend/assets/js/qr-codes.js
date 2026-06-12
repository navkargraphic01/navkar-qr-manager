/* qr-codes.js — QR Code list page */
'use strict';

let currentPage = 1, totalPages = 1;
let searchTimer = null;
let deleteQrId = null;

function getFilters() {
  return {
    search:   document.getElementById('search-input')?.value.trim() || '',
    status:   document.getElementById('status-filter')?.value || '',
    sort:     document.getElementById('sort-filter')?.value || 'created_at',
    page:     currentPage,
    per_page: 15
  };
}

async function loadQR() {
  const tbody = document.getElementById('qr-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="padding:24px;text-align:center"><div class="skel skel-row mb-1"></div><div class="skel skel-row mb-1"></div><div class="skel skel-row"></div></td></tr>';

  try {
    const data = await API.get('/qr', getFilters());
    const qrs  = data.qr_codes || data.data || [];
    totalPages  = data.pages || 1;
    const total = data.total || qrs.length;

    const countEl = document.getElementById('total-count');
    if (countEl) countEl.textContent = total + ' QR codes';

    if (!qrs.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="padding:48px;text-align:center">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--muted);margin:0 auto 12px;display:block"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <div style="font-weight:700;color:var(--text)">No QR codes found</div>
        <div class="text-muted text-sm mt-1">Try adjusting your search filters</div>
        <a href="${window.SITE_BASE}/qr-codes/create" class="btn btn-primary btn-sm mt-3">Create Your First QR</a>
      </td></tr>`;
      document.getElementById('pagination-bar').style.display = 'none';
      return;
    }

    tbody.innerHTML = qrs.map(q => `<tr>
      <td><input type="checkbox" class="row-check" value="${esc(q.id)}" onclick="updateBulkBtn()"></td>
      <td>
        <a href="${window.SITE_BASE}/qr-codes/${esc(q.qr_id)}/edit"
          class="mono font-bold" style="font-size:12.5px;color:var(--primary)">${esc(q.qr_id)}</a>
      </td>
      <td>
        <div class="font-bold text-sm truncate" style="max-width:200px">${esc(q.product_name)}</div>
        ${q.product_code ? `<div class="text-muted text-xs">${esc(q.product_code)}</div>` : ''}
      </td>
      <td>
        <div class="truncate text-sm" style="max-width:220px;color:var(--text2)">${esc(q.destination_url||'')}</div>
      </td>
      <td>${statusBadge(q.status)}</td>
      <td><span class="font-bold">${formatNum(q.scan_count||0)}</span></td>
      <td class="text-muted text-xs">${formatDate(q.created_at)}</td>
      <td>
        <div class="flex gap-1 justify-end">
          <button class="btn btn-icon btn-sm" title="Copy URL" onclick="copyQrUrl('${esc(q.qr_id)}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <a href="${window.SITE_BASE}/qr-codes/${esc(q.qr_id)}/edit" class="btn btn-icon btn-sm" title="Edit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </a>
          <button class="btn btn-icon btn-sm btn-icon-danger" title="Delete" onclick="openDelete('${esc(q.qr_id)}','${esc(q.product_name)}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');

    renderPagination(total);
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="8" style="padding:32px;text-align:center">
      <div class="danger-box">Failed to load: ${esc(e.message)}</div>
    </td></tr>`;
    Toast.error('Failed to load QR codes', e.message);
  }
}

function renderPagination(total) {
  const bar = document.getElementById('pagination-bar');
  if (!bar) return;
  if (totalPages <= 1) { bar.style.display = 'none'; return; }
  bar.style.display = '';

  document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages} · ${total} total`;
  document.getElementById('prev-btn').disabled = currentPage === 1;
  document.getElementById('next-btn').disabled = currentPage === totalPages;

  const nums = document.getElementById('page-numbers');
  nums.innerHTML = '';
  const start = Math.max(1, currentPage - 2);
  const end   = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    const b = document.createElement('button');
    b.className = 'btn btn-sm ' + (i === currentPage ? 'btn-primary' : 'btn-outline');
    b.textContent = i;
    b.onclick = () => { currentPage = i; loadQR(); };
    nums.appendChild(b);
  }
}

function copyQrUrl(qrId) {
  copyToClipboard(getQrUrl(qrId), 'QR URL copied!');
}

function openDelete(qrId, name) {
  deleteQrId = qrId;
  document.getElementById('delete-qr-name').textContent = name;
  document.getElementById('delete-modal').style.display = '';
}

async function performDelete() {
  if (!deleteQrId) return;
  const btn = document.getElementById('confirm-delete-btn');
  btn.disabled = true; btn.textContent = 'Deleting...';
  try {
    await API.del('/qr/' + deleteQrId);
    Toast.success('QR code deleted');
    document.getElementById('delete-modal').style.display = 'none';
    loadQR();
  } catch(e) {
    Toast.error('Delete failed', e.message);
  } finally { btn.disabled = false; btn.textContent = 'Delete Permanently'; }
}

function updateBulkBtn() {
  const checks = document.querySelectorAll('.row-check:checked');
  const btn = document.getElementById('bulk-download-btn');
  if (btn) btn.style.display = checks.length > 0 ? '' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  loadQR();

  document.getElementById('search-input')?.addEventListener('input', function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { currentPage = 1; loadQR(); }, 350);
  });

  document.getElementById('status-filter')?.addEventListener('change', () => { currentPage = 1; loadQR(); });
  document.getElementById('sort-filter')?.addEventListener('change', () => { currentPage = 1; loadQR(); });
  document.getElementById('refresh-btn')?.addEventListener('click', loadQR);

  document.getElementById('prev-btn')?.addEventListener('click', () => { if(currentPage>1){ currentPage--; loadQR(); } });
  document.getElementById('next-btn')?.addEventListener('click', () => { if(currentPage<totalPages){ currentPage++; loadQR(); } });

  document.getElementById('confirm-delete-btn')?.addEventListener('click', performDelete);

  document.getElementById('select-all')?.addEventListener('change', function() {
    document.querySelectorAll('.row-check').forEach(c => c.checked = this.checked);
    updateBulkBtn();
  });
});
