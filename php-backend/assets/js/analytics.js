/* analytics.js — Analytics page */
'use strict';

let trendChart = null, deviceChart = null;
let currentRange = 30;

async function loadSummary(days) {
  try {
    const data = await API.get('/analytics/summary', { days });
    animateCounter(document.getElementById('stat-period-scans'), data.period_scans || 0);
    animateCounter(document.getElementById('stat-unique-qr'), data.unique_qr || 0);
    document.getElementById('stat-mobile-pct').textContent = (data.mobile_pct || 0) + '%';
    animateCounter(document.getElementById('stat-countries'), data.countries || 0);
  } catch(e) { console.warn(e); }
}

async function loadTrend(days) {
  try {
    const data = await API.get('/analytics/trend', { days });
    renderTrendChart(data.labels || [], data.values || []);
  } catch(e) { console.warn(e); }
}

function renderTrendChart(labels, values) {
  const ctx = document.getElementById('trend-chart')?.getContext('2d');
  if (!ctx) return;
  if (trendChart) trendChart.destroy();

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
  const textColor = isDark ? '#94A3B8' : '#64748B';

  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Scans',
        data: values,
        backgroundColor: values.map((_, i) => `hsla(${220 + i * 2}, 80%, 60%, .7)`),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#fff',
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#64748b',
        borderColor: isDark ? '#334155' : '#e2e8f0', borderWidth: 1, padding: 10,
        callbacks: { label: ctx => ` ${ctx.raw.toLocaleString()} scans` }
      }},
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor, font:{size:11}, maxTicksLimit:14 } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, font:{size:11} }, beginAtZero: true }
      }
    }
  });
}

async function loadDevices(days) {
  try {
    const data = await API.get('/analytics/devices', { days });
    if (!data.length) return;

    const ctx = document.getElementById('device-chart')?.getContext('2d');
    if (!ctx) return;
    if (deviceChart) deviceChart.destroy();

    const colors = ['#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6'];
    deviceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.device_type || 'Unknown'),
        datasets: [{ data: data.map(d => d.count), backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw.toLocaleString()}` } }
        }
      }
    });

    const total = data.reduce((s, d) => s + d.count, 0);
    document.getElementById('device-legend').innerHTML = data.map((d, i) => `
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2">
          <div style="width:10px;height:10px;border-radius:2px;background:${colors[i%colors.length]};flex-shrink:0"></div>
          <span class="text-sm">${esc(d.device_type||'Unknown')}</span>
        </div>
        <span class="mono text-xs text-muted">${total ? Math.round(d.count/total*100) : 0}%</span>
      </div>`).join('');
  } catch(e) { console.warn(e); }
}

async function loadCountries(days) {
  const el = document.getElementById('countries-list');
  if (!el) return;
  try {
    const data = await API.get('/analytics/countries', { days });
    if (!data.length) { el.innerHTML = '<div class="text-muted text-sm">No country data</div>'; return; }

    const max = data[0]?.count || 1;
    el.innerHTML = data.slice(0, 10).map(c => `
      <div class="mb-3">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm font-bold">${esc(c.country_name||c.country_code||'Unknown')}</span>
          <span class="text-xs text-muted">${formatNum(c.count)}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${Math.round(c.count/max*100)}%;background:#2563EB"></div>
        </div>
      </div>`).join('');
  } catch(e) {
    el.innerHTML = '<div class="text-muted text-sm">Failed to load</div>';
  }
}

async function loadTopQR(days) {
  const el = document.getElementById('top-qr-body');
  if (!el) return;
  try {
    const data = await API.get('/analytics/top-qr', { days, limit: 10 });
    if (!data.length) { el.innerHTML = '<tr><td colspan="4" style="padding:16px;text-align:center" class="text-muted">No data</td></tr>'; return; }
    const total = data.reduce((s, q) => s + (q.scan_count || 0), 0);
    el.innerHTML = data.map(q => `<tr>
      <td><span class="mono text-xs text-primary-c font-bold">${esc(q.qr_id)}</span></td>
      <td class="truncate text-sm" style="max-width:160px">${esc(q.product_name)}</td>
      <td class="font-bold">${formatNum(q.scan_count||0)}</td>
      <td>
        <div class="progress-track" style="height:4px">
          <div class="progress-fill" style="width:${total?Math.round(q.scan_count/total*100):0}%"></div>
        </div>
        <span class="text-xs text-muted">${total?Math.round(q.scan_count/total*100):0}%</span>
      </td>
    </tr>`).join('');
  } catch(e) { el.innerHTML = '<tr><td colspan="4">Failed</td></tr>'; }
}

async function loadRecentScans() {
  const el = document.getElementById('recent-body');
  if (!el) return;
  try {
    const data = await API.get('/analytics/recent-scans', { limit: 20 });
    const scans = data.scans || data || [];
    if (!scans.length) { el.innerHTML = '<tr><td colspan="4" style="padding:16px;text-align:center" class="text-muted">No scans</td></tr>'; return; }
    el.innerHTML = scans.map(s => `<tr>
      <td><span class="mono text-xs text-primary-c font-bold">${esc(s.qr_id||'')}</span></td>
      <td><span class="badge badge-muted text-xs">${esc(s.device_type||'Unknown')}</span></td>
      <td class="text-sm">${esc(s.country_name||s.country_code||'—')}</td>
      <td class="text-muted text-xs">${formatDateTime(s.scanned_at)}</td>
    </tr>`).join('');
  } catch(e) { el.innerHTML = '<tr><td colspan="4">Failed</td></tr>'; }
}

function exportCSV() {
  const rows = [['Date','Device','Country','QR ID']];
  document.querySelectorAll('#recent-body tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    if (cells.length < 4) return;
    rows.push([cells[3].textContent, cells[1].textContent, cells[2].textContent, cells[0].textContent]);
  });
  const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a    = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `navkar-analytics-${currentRange}d-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  Toast.success('Exported to CSV');
}

async function loadAll(days) {
  await Promise.all([
    loadSummary(days),
    loadTrend(days),
    loadDevices(days),
    loadCountries(days),
    loadTopQR(days),
  ]);
  loadRecentScans();
}

document.addEventListener('DOMContentLoaded', () => {
  loadAll(currentRange);

  document.getElementById('range-select')?.addEventListener('change', function() {
    currentRange = parseInt(this.value);
    loadAll(currentRange);
  });

  document.getElementById('export-csv-btn')?.addEventListener('click', exportCSV);

  // Re-render charts on theme change
  const observer = new MutationObserver(() => {
    loadTrend(currentRange);
    loadDevices(currentRange);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});
