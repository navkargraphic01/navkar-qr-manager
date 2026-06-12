/* =============================================================
   NAVKAR QR MANAGER — Global Application JavaScript v2.0
   No external dependencies required
   ============================================================= */
'use strict';

/* ─── Auth ─────────────────────────────────────────────── */
const Auth = {
  COOKIE: 'navkar_auth',
  LS_KEY: 'navkar_token',

  getToken() {
    const m = document.cookie.match(new RegExp('(?:^|; )' + this.COOKIE + '=([^;]*)'));
    if (m) return decodeURIComponent(m[1]);
    return localStorage.getItem(this.LS_KEY) || '';
  },

  setToken(token, days = 1) {
    const exp = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${this.COOKIE}=${encodeURIComponent(token)}; path=/; expires=${exp}; SameSite=Lax`;
    localStorage.setItem(this.LS_KEY, token);
  },

  clearToken() {
    document.cookie = `${this.COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
    localStorage.removeItem(this.LS_KEY);
  },

  isLoggedIn() { return !!this.getToken(); },

  getUser() {
    try {
      const el = document.getElementById('current-user-data');
      if (el) return JSON.parse(el.textContent);
    } catch {}
    return null;
  }
};

const API = {
  BASE: (window.SITE_BASE || '') + '/api',

  async request(method, path, body, isFormData = false) {
    const token = Auth.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData && body) headers['Content-Type'] = 'application/json';

    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    let res;
    try {
      res = await fetch(this.BASE + path, opts);
    } catch {
      throw new Error('Network error — please check your connection');
    }

    if (res.status === 401) {
      Auth.clearToken();
      window.location.href = window.SITE_BASE + '/login';
      return;
    }

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); }
    catch { json = { error: text || `HTTP ${res.status}` }; }

    if (!res.ok) {
      const err = new Error(json?.error || `HTTP ${res.status}`);
      err.status  = res.status;
      err.details = json?.details;
      err.json    = json;
      throw err;
    }
    return json;
  },

  get   (path, params) {
    const qs = params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== ''))
    ) : '';
    return this.request('GET', path + qs);
  },
  post  (path, body)  { return this.request('POST',   path, body); },
  put   (path, body)  { return this.request('PUT',    path, body); },
  patch (path, body)  { return this.request('PATCH',  path, body); },
  del   (path)        { return this.request('DELETE', path); },
  upload(path, form)  { return this.request('POST',   path, form, true); }
};

/* ─── Toast ──────────────────────────────────────────────── */
const Toast = {
  stack: null,
  DURATION: 4500,

  init() {
    if (this.stack) return;
    this.stack = document.createElement('div');
    this.stack.className = 'toast-stack';
    document.body.appendChild(this.stack);
  },

  show(type, title, msg, dur) {
    this.init();
    const ICON = { s: '✓', e: '✕', i: 'ℹ', w: '⚠' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `
      <div class="toast-icon">${ICON[type] || ICON.i}</div>
      <div class="toast-body">
        <div class="toast-title">${esc(title)}</div>
        ${msg ? `<div class="toast-msg">${esc(msg)}</div>` : ''}
      </div>
      <button class="toast-x" onclick="this.closest('.toast').remove()">×</button>`;
    this.stack.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, dur || this.DURATION);
    return t;
  },

  success (t, m, d) { return this.show('s', t, m, d); },
  error   (t, m, d) { return this.show('e', t, m, d); },
  info    (t, m, d) { return this.show('i', t, m, d); },
  warning (t, m, d) { return this.show('w', t, m, d); }
};

/* ─── Theme ──────────────────────────────────────────────── */
const Theme = {
  K: 'navkar_theme',

  get()  { return localStorage.getItem(this.K) || 'light'; },
  set(t) {
    localStorage.setItem(this.K, t);
    document.documentElement.setAttribute('data-theme', t);
    this.updateBtn(t);
  },
  toggle() { this.set(this.get() === 'dark' ? 'light' : 'dark'); },
  init()   { this.set(this.get()); },

  updateBtn(t) {
    const b = document.getElementById('theme-toggle');
    if (!b) return;
    b.innerHTML = t === 'dark'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
};

/* ─── Sidebar ────────────────────────────────────────────── */
const Sidebar = {
  K: 'navkar_sidebar',
  el: null,

  init() {
    this.el = document.getElementById('sidebar');
    if (!this.el) return;

    if (window.innerWidth > 768 && localStorage.getItem(this.K) === 'collapsed')
      this.el.classList.add('collapsed');

    document.getElementById('sidebar-toggle')?.addEventListener('click', () => this.toggle());
    document.getElementById('mob-menu')?.addEventListener('click', () => this.mobOpen());
    document.getElementById('sb-overlay')?.addEventListener('click', () => this.mobClose());
  },

  toggle() {
    if (window.innerWidth <= 768) { this.mobOpen(); return; }
    this.el.classList.toggle('collapsed');
    localStorage.setItem(this.K, this.el.classList.contains('collapsed') ? 'collapsed' : 'expanded');
  },

  mobOpen() {
    this.el.classList.add('mob-open');
    const ov = document.getElementById('sb-overlay');
    if (ov) ov.classList.add('active');
  },

  mobClose() {
    this.el.classList.remove('mob-open');
    const ov = document.getElementById('sb-overlay');
    if (ov) ov.classList.remove('active');
  }
};

/* ─── Utility Functions ──────────────────────────────────── */
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' });
}

function formatDateTime(s) {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-IN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

function formatNum(n) {
  n = Number(n) || 0;
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'k';
  return n.toLocaleString('en-IN');
}

function statusBadge(s) {
  const m = {
    active:   ['badge-success', '<span class="badge-dot"></span>Active'],
    inactive: ['badge-danger',  'Inactive'],
    draft:    ['badge-muted',   'Draft'],
  };
  const [cls, lbl] = m[s] || ['badge-muted', s];
  return `<span class="badge ${cls}">${lbl}</span>`;
}

function getQrUrl(qrId) {
  return `${window.location.origin}${window.SITE_BASE || ''}/p/${qrId}`;
}

async function copyToClipboard(text, msg = 'Copied to clipboard!') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = document.createElement('textarea');
    t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
  }
  Toast.success(msg);
}

function animateCounter(el, target, dur = 1400) {
  const t0 = performance.now();
  const fmt = n => target >= 1000 ? formatNum(n) : n.toLocaleString('en-IN');
  const tick = now => {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(target * e));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function showSkeleton(el, rows = 4, rowH = 44) {
  el.innerHTML = Array.from({length: rows}, () =>
    `<div class="skel" style="height:${rowH}px;margin-bottom:8px"></div>`
  ).join('');
}

function showConfirm(msg, title, cb) {
  const ov = document.createElement('div');
  ov.className = 'modal-bg';
  ov.innerHTML = `
    <div class="modal-box anim-scale" style="max-width:400px">
      <div class="modal-hd">
        <span class="modal-title">${esc(title || 'Confirm')}</span>
        <button class="modal-x" onclick="this.closest('.modal-bg').remove()">×</button>
      </div>
      <div class="modal-bd"><p style="color:var(--text2);margin:0">${esc(msg)}</p></div>
      <div class="modal-ft">
        <button class="btn btn-outline" onclick="this.closest('.modal-bg').remove()">Cancel</button>
        <button class="btn btn-danger" id="_confirm_yes">Confirm</button>
      </div>
    </div>`;
  ov.querySelector('#_confirm_yes').onclick = () => { ov.remove(); cb(); };
  document.body.appendChild(ov);
}

/* ─── DOM Ready ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Toast.init();
  Sidebar.init();

  document.getElementById('theme-toggle')?.addEventListener('click', () => Theme.toggle());

  // Expose globals for pages
  window.Auth    = Auth;
  window.API     = API;
  window.Toast   = Toast;
  window.Theme   = Theme;

  // Expose utilities
  window.esc            = esc;
  window.formatDate     = formatDate;
  window.formatDateTime = formatDateTime;
  window.formatNum      = formatNum;
  window.statusBadge    = statusBadge;
  window.getQrUrl       = getQrUrl;
  window.copyToClipboard = copyToClipboard;
  window.animateCounter = animateCounter;
  window.showSkeleton   = showSkeleton;
  window.showConfirm    = showConfirm;

  // Page enter animation
  document.body.classList.add('anim');
});
