/* settings.js — Settings page */
'use strict';

async function loadSettings() {
  try {
    const data = await API.get('/settings');
    if (data.qr_base_url) document.getElementById('qr-base-url').value = data.qr_base_url;
    if (data.qr_prefix) {
      document.getElementById('qr-prefix').value = data.qr_prefix;
      updatePrefixHint(data.qr_prefix);
    }
  } catch(e) {}
}

window.saveSetting = async function(key, value) {
  try {
    await API.post('/settings', { key, value });
    Toast.success('Setting saved');
    if (key === 'qr_prefix') updatePrefixHint(value);
  } catch(e) {
    Toast.error('Failed to save', e.message);
  }
};

function updatePrefixHint(prefix) {
  const el = document.getElementById('prefix-hint');
  if (!el) return;
  const p = (prefix || 'NP').toUpperCase();
  el.innerHTML = `QR codes will be named: <strong>${p}001</strong>, <strong>${p}002</strong>, etc.`;
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  // Profile form
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
      await API.patch('/auth/profile', {
        full_name: document.getElementById('full-name').value.trim(),
        company:   document.getElementById('company').value.trim(),
      });
      Toast.success('Profile updated!');
    } catch(err) {
      Toast.error('Failed to save', err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/></svg> Save Profile';
    }
  });

  // Password form
  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = document.getElementById('save-password-btn');
    const cur  = document.getElementById('current-password').value;
    const nw   = document.getElementById('new-password').value;
    const conf = document.getElementById('confirm-password').value;

    if (nw.length < 8) { Toast.warning('Password too short', 'Must be at least 8 characters'); return; }
    if (nw !== conf)   { Toast.error('Passwords do not match'); return; }

    btn.disabled = true; btn.textContent = 'Updating...';
    try {
      await API.post('/auth/change-password', {
        current_password: cur,
        new_password:     nw,
      });
      Toast.success('Password updated!');
      document.getElementById('password-form').reset();
    } catch(err) {
      Toast.error('Failed', err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Update Password';
    }
  });

  // Theme buttons
  document.getElementById('theme-light-btn')?.addEventListener('click', () => {
    Theme.set('light');
    updateThemeButtons('light');
    Toast.info('Light mode activated');
  });
  document.getElementById('theme-dark-btn')?.addEventListener('click', () => {
    Theme.set('dark');
    updateThemeButtons('dark');
    Toast.info('Dark mode activated');
  });

  // Prefix input
  document.getElementById('qr-prefix')?.addEventListener('input', function() {
    updatePrefixHint(this.value);
  });

  updateThemeButtons(Theme.get());
});

function updateThemeButtons(theme) {
  ['light','dark'].forEach(t => {
    const b = document.getElementById(`theme-${t}-btn`);
    if (!b) return;
    if (t === theme) {
      b.style.borderColor = 'var(--primary)';
      b.style.background  = 'rgba(37,99,235,.06)';
      b.style.color       = 'var(--primary)';
    } else {
      b.style.borderColor = 'var(--border)';
      b.style.background  = '';
      b.style.color       = '';
    }
  });
}
