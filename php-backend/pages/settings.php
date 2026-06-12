<?php
$pageTitle  = 'Settings';
$pageScript = 'settings.js';
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../includes/layout_header.php';
require_once __DIR__ . '/../includes/layout_sidebar.php';
$u = $currentUser;
?>

<header class="topbar">
  <button class="icon-btn" id="mob-menu" style="display:none">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>
  <div>
    <div class="topbar-title">Settings</div>
    <div class="topbar-sub">Manage your profile and application preferences</div>
  </div>
  <div class="topbar-actions">
    <button class="icon-btn" id="theme-toggle" title="Toggle theme"></button>
  </div>
</header>

<main class="page-body">
  <div style="max-width:700px">

    <!-- Profile Section -->
    <div class="card mb-4 anim">
      <div class="card-p" style="border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(37,99,235,.1);display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div>
          <div style="font-size:15px;font-weight:800;color:var(--text)">Your Profile</div>
          <div class="text-muted text-sm">Update your name and company</div>
        </div>
      </div>
      <form id="profile-form" class="card-p">
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input id="full-name" type="text" class="form-control" value="<?= htmlspecialchars($u['full_name'] ?? '') ?>">
          </div>
          <div class="form-group">
            <label class="form-label">Company</label>
            <input id="company" type="text" class="form-control" value="<?= htmlspecialchars($u['company'] ?? 'Navkar Plywood') ?>">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-control" value="<?= htmlspecialchars($u['email'] ?? '') ?>" disabled style="cursor:not-allowed;opacity:.65">
          <div class="form-hint">Email cannot be changed. Contact your administrator.</div>
        </div>
        <div class="flex justify-end">
          <button type="submit" id="save-profile-btn" class="btn btn-primary btn-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Profile
          </button>
        </div>
      </form>
    </div>

    <!-- Change Password -->
    <div class="card mb-4 anim anim-2">
      <div class="card-p" style="border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(16,185,129,.1);display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div>
          <div style="font-size:15px;font-weight:800;color:var(--text)">Change Password</div>
          <div class="text-muted text-sm">Use a strong password with 8+ characters</div>
        </div>
      </div>
      <form id="password-form" class="card-p">
        <div class="form-group">
          <label class="form-label">Current Password</label>
          <input id="current-password" type="password" class="form-control" placeholder="Your current password">
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input id="new-password" type="password" class="form-control" placeholder="Min 8 characters">
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input id="confirm-password" type="password" class="form-control" placeholder="Repeat new password">
          </div>
        </div>
        <div class="flex justify-end">
          <button type="submit" id="save-password-btn" class="btn btn-primary btn-sm">Update Password</button>
        </div>
      </form>
    </div>

    <!-- Appearance -->
    <div class="card mb-4 anim anim-3">
      <div class="card-p" style="border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(96,165,250,.1);display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
        </div>
        <div>
          <div style="font-size:15px;font-weight:800;color:var(--text)">Appearance</div>
          <div class="text-muted text-sm">Light and dark mode preference</div>
        </div>
      </div>
      <div class="card-p">
        <label class="form-label">Theme</label>
        <div class="flex gap-3">
          <button id="theme-light-btn" class="btn flex-1" style="border:2px solid var(--border);padding:12px;flex-direction:column;gap:6px;height:auto">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/></svg>
            ☀️ Light Mode
          </button>
          <button id="theme-dark-btn" class="btn flex-1" style="border:2px solid var(--border);padding:12px;flex-direction:column;gap:6px;height:auto">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            🌙 Dark Mode
          </button>
        </div>
      </div>
    </div>

    <!-- QR Settings -->
    <div class="card mb-4 anim anim-4">
      <div class="card-p" style="border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(245,158,11,.1);display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </div>
        <div>
          <div style="font-size:15px;font-weight:800;color:var(--text)">QR Code Settings</div>
          <div class="text-muted text-sm">Configure your QR redirect domain and ID format</div>
        </div>
      </div>
      <div class="card-p">
        <div class="form-group">
          <label class="form-label">QR Base URL</label>
          <div class="input-group">
            <input id="qr-base-url" type="url" class="form-control" placeholder="https://qr.navkarplywood.com">
            <button class="btn btn-outline" onclick="saveSetting('qr_base_url', document.getElementById('qr-base-url').value)">Save</button>
          </div>
          <div class="form-hint">The domain used in QR codes. Only change if you have a custom domain.</div>
        </div>
        <div class="form-group">
          <label class="form-label">QR ID Prefix</label>
          <div class="input-group">
            <input id="qr-prefix" type="text" class="form-control" placeholder="NP" maxlength="5" style="max-width:120px;text-transform:uppercase">
            <button class="btn btn-outline" onclick="saveSetting('qr_prefix', document.getElementById('qr-prefix').value.toUpperCase())">Save</button>
          </div>
          <div class="form-hint" id="prefix-hint">QR codes will be named: <strong>NP001</strong>, <strong>NP002</strong>, etc.</div>
        </div>
      </div>
    </div>

    <!-- System Info -->
    <div class="card anim anim-5">
      <div class="card-p" style="border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--bg2);display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <div style="font-size:15px;font-weight:800;color:var(--text)">System Info</div>
        </div>
      </div>
      <div class="card-p">
        <?php
        $info = [
            'User ID'       => substr($u['id'] ?? '', 0, 12) . '...',
            'Role'          => ucfirst($u['role'] ?? 'user'),
            'Auth Method'   => 'PHP 8.3 + MySQL + JWT',
            'App Version'   => 'v2.0.0 (Enterprise)',
            'PHP Version'   => PHP_VERSION,
            'Server'        => $_SERVER['SERVER_SOFTWARE'] ?? 'Apache',
        ];
        ?>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;font-size:13px">
          <?php foreach ($info as $k => $v): ?>
          <div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--border)">
            <span class="text-muted"><?= $k ?></span>
            <span class="mono font-bold" style="color:var(--text)"><?= htmlspecialchars($v) ?></span>
          </div>
          <?php endforeach; ?>
        </div>
      </div>
    </div>

  </div>
</main>

<?php require_once __DIR__ . '/../includes/layout_footer.php'; ?>
