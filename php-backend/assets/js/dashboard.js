/* dashboard.js — Dashboard page logic */
'use strict';

let scanChart = null;
let currentPeriod = 30;

async function loadStats() {
  try {
    const data = await API.get('/analytics/summary');
    // Animate the stat counters
    if (data.total_qr    !== undefined) animateCounter(document.getElementById('stat-total'),  data.total_qr);
    if (data.active_qr   !== undefined) animateCounter(document.getElementById('stat-active'), data.active_qr);
    if (data.total_scans !== undefined) animateCounter(document.getElementById('stat-scans'),  data.total_scans);
    if (data.today_scans !== undefined) animateCounter(document.getElementById('stat-today'),  data.today_scans);
  } catch (e) {
    console.warn('Stats load failed', e);
  }
}

async function loadTrend(days = 30) {
  try {
    const data = await API.get('/analytics/trend', { days });
    renderTrendChart(data.labels || [], data.values || []);
  } catch(e) { console.warn('Trend load failed', e); }
}

function renderTrendChart(labels, values) {
  const ctx = document.getElementById('scan-chart')?.getContext('2d');
  if (!ctx) return;
  if (scanChart) { scanChart.destroy(); }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
  const textColor = isDark ? '#94A3B8' : '#64748B';

  scanChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Scans',
        data: values,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37,99,235,.1)',
        borderWidth: 2.5,
        tension: .4,
        fill: true,
        pointBackgroundColor: '#2563EB',
        pointRadius: 3,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#fff',
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#64748b',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1, padding: 10,
        callbacks: { label: ctx => ` ${ctx.raw.toLocaleString()} scans` }
      }},
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 8, font: {size:11} } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, font: {size:11} }, beginAtZero: true }
      }
    }
  });
}

async function loadTopQR() {
  const el = document.getElementById('top-qr-list');
  if (!el) return;
  try {
    const data = await API.get('/analytics/top-qr', { limit: 5 });
    if (!data.length) { el.innerHTML = '<div class="text-muted text-sm text-center py-3">No data yet</div>'; return; }

    const max = data[0]?.scan_count || 1;
    el.innerHTML = data.map((qr, i) => `
      <div class="mb-3">
        <div class="flex justify-between items-center mb-1">
          <div class="truncate" style="max-width:65%;font-size:13px;font-weight:600;color:var(--text)">${esc(qr.product_name)}</div>
          <span style="font-size:12px;color:var(--muted);flex-shrink:0">${formatNum(qr.scan_count)} scans</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${Math.round((qr.scan_count/max)*100)}%;background:${['#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6'][i%5]}"></div>
        </div>
      </div>`).join('');
  } catch(e) {
    el.innerHTML = '<div class="text-muted text-sm text-center py-3">Failed to load</div>';
  }
}

async function loadRecentQR() {
  const el = document.getElementById('recent-qr-table');
  if (!el) return;
  try {
    const data = await API.get('/qr', { limit: 5 });
    const qrs  = data.qr_codes || data.data || [];
    if (!qrs.length) { el.innerHTML = '<div class="card-p text-muted text-sm">No QR codes yet.</div>'; return; }

    el.innerHTML = `<table class="dtable">
      <thead><tr><th>QR ID</th><th>Product</th><th>Status</th><th>Scans</th></tr></thead>
      <tbody>${qrs.map(q => `<tr>
        <td><a href="${window.SITE_BASE}/qr-codes/${q.qr_id}/edit" class="mono text-xs text-primary-c font-bold">${esc(q.qr_id)}</a></td>
        <td class="truncate" style="max-width:160px">${esc(q.product_name)}</td>
        <td>${statusBadge(q.status)}</td>
        <td class="font-bold">${formatNum(q.scan_count||0)}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  } catch(e) {
    el.innerHTML = '<div class="card-p text-muted text-sm">Failed to load</div>';
  }
}

async function loadRecentScans() {
  const el = document.getElementById('recent-scans-table');
  if (!el) return;
  try {
    const data = await API.get('/analytics/recent-scans', { limit: 5 });
    const scans = data.scans || data || [];
    if (!scans.length) { el.innerHTML = '<div class="card-p text-muted text-sm">No scans recorded yet.</div>'; return; }

    el.innerHTML = `<table class="dtable">
      <thead><tr><th>QR ID</th><th>Device</th><th>Country</th><th>Time</th></tr></thead>
      <tbody>${scans.map(s => `<tr>
        <td><span class="mono text-xs text-primary-c font-bold">${esc(s.qr_id||'')}</span></td>
        <td>
          <span class="badge badge-muted text-xs">${esc(s.device_type||'Unknown')}</span>
        </td>
        <td>${esc(s.country_name||s.country_code||'—')}</td>
        <td class="text-muted text-xs">${formatDateTime(s.scanned_at)}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  } catch(e) {
    el.innerHTML = '<div class="card-p text-muted text-sm">Failed to load</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadTrend(currentPeriod);
  loadTopQR();
  loadRecentQR();
  loadRecentScans();

  document.getElementById('trend-period')?.addEventListener('change', function() {
    currentPeriod = parseInt(this.value);
    loadTrend(currentPeriod);
  });

  // Rerender chart on theme change
  const observer = new MutationObserver(() => {
    if (scanChart) loadTrend(currentPeriod);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});
