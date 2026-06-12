<?php
// pages/login.php — Login page (no auth check needed)
if (session_status() === PHP_SESSION_NONE) session_start();

// If already logged in, redirect
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/JWT.php';

if (!defined('SITE_BASE')) {
    $docRoot    = rtrim(str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']), '/');
    $scriptFile = str_replace('\\', '/', $_SERVER['SCRIPT_FILENAME']);
    $scriptDir  = rtrim(dirname($scriptFile), '/');
    $webDir     = str_replace($docRoot, '', $scriptDir);
    $backendPath = dirname($webDir);
    define('SITE_BASE', ($backendPath === '/' || $backendPath === '') ? '' : $backendPath);
}

$token = $_COOKIE['navkar_auth'] ?? '';
if ($token) {
    try { JWT::decode($token); header('Location: ' . SITE_BASE . '/dashboard'); exit(); } catch (Exception $e) {}
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In — Navkar QR Manager</title>
  <script>(function(){var t=localStorage.getItem('navkar_theme')||'light';document.documentElement.setAttribute('data-theme',t);})()</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= SITE_BASE ?>/assets/css/app.css">
  <script>window.SITE_BASE='<?= SITE_BASE ?>';</script>
</head>
<body>

<div class="login-wrap">
  <div class="login-card">

    <!-- Header -->
    <div class="login-hd">
      <div class="login-logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
          <path d="M14 14h3v3m0-3h3M17 20h3"/>
        </svg>
      </div>
      <div class="login-app-name">Navkar QR Manager</div>
      <div class="login-app-sub">Dynamic QR Code Platform · Enterprise Edition</div>
    </div>

    <!-- Body -->
    <div class="login-body">
      <p id="login-subtitle" style="color:rgba(255,255,255,.55);font-size:13px;margin:0 0 22px">
        Sign in to manage your QR codes and analytics
      </p>

      <div id="error-box" class="danger-box" style="display:none;margin-bottom:16px;border-radius:10px;"></div>

      <form id="login-form" autocomplete="on">
        <!-- Full Name (signup only) -->
        <div id="fullname-row" style="display:none;margin-bottom:14px">
          <label class="login-label">Full Name</label>
          <input id="fullname" name="full_name" type="text" class="form-control login-input"
            placeholder="Your full name" autocomplete="name">
        </div>

        <!-- Email -->
        <div style="margin-bottom:14px">
          <label class="login-label">Email Address</label>
          <input id="email" name="email" type="email" class="form-control login-input"
            placeholder="admin@navkarplywood.com" autocomplete="email" required>
        </div>

        <!-- Password -->
        <div style="margin-bottom:6px">
          <label class="login-label">Password</label>
          <div class="pwd-wrap">
            <input id="password" name="password" type="password" class="form-control login-input"
              placeholder="••••••••" autocomplete="current-password" required
              style="padding-right:44px">
            <button type="button" class="pwd-eye" id="pwd-toggle" aria-label="Toggle password">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="eye-icon">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Remember me -->
        <div class="flex items-center justify-between" style="margin:10px 0 0">
          <label class="form-check" style="cursor:pointer">
            <input type="checkbox" id="remember" style="accent-color:var(--accent)">
            <span style="color:rgba(255,255,255,.5);font-size:12px">Remember me (30 days)</span>
          </label>
          <button type="button" id="mode-toggle"
            style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,.45);font-size:12px;text-decoration:underline">
            Create account
          </button>
        </div>

        <button type="submit" class="login-btn" id="submit-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Sign In
        </button>
      </form>

      <div class="login-foot">
        Navkar Plywood © <?= date('Y') ?> · Secured with PHP 8.3 + MySQL
      </div>
    </div>
  </div>
</div>

<div class="toast-stack" id="toast-stack"></div>
<script src="<?= SITE_BASE ?>/assets/js/app.js"></script>
<script>
(function () {
  'use strict';

  let isSignUp = false;

  // Mode toggle
  document.getElementById('mode-toggle').addEventListener('click', () => {
    isSignUp = !isSignUp;
    document.getElementById('fullname-row').style.display = isSignUp ? 'block' : 'none';
    document.getElementById('submit-btn').textContent = isSignUp ? 'Create Account' : 'Sign In';
    document.getElementById('login-subtitle').textContent = isSignUp
      ? 'Create your administrator account below'
      : 'Sign in to manage your QR codes and analytics';
    document.getElementById('mode-toggle').textContent = isSignUp ? 'Already have an account?' : 'Create account';
    document.getElementById('error-box').style.display = 'none';
  });

  // Password toggle
  document.getElementById('pwd-toggle').addEventListener('click', () => {
    const inp = document.getElementById('password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  // Form submit
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn    = document.getElementById('submit-btn');
    const errBox = document.getElementById('error-box');
    const email  = document.getElementById('email').value.trim();
    const pass   = document.getElementById('password').value;
    const name   = document.getElementById('fullname')?.value.trim() || '';
    const days   = document.getElementById('remember').checked ? 30 : 1;

    errBox.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg> Processing...';

    try {
      const endpoint = (window.SITE_BASE || '') + (isSignUp ? '/api/auth/register' : '/api/auth/login');
      const body = isSignUp
        ? { email, password: pass, full_name: name }
        : { email, password: pass };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      // Store token
      Auth.setToken(data.access_token, days);
      Toast.success(isSignUp ? 'Account created! Redirecting...' : 'Welcome back!');
      setTimeout(() => { window.location.href = window.SITE_BASE + '/dashboard'; }, 600);

    } catch (err) {
      errBox.textContent = err.message || 'Invalid credentials. Please try again.';
      errBox.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = isSignUp ? 'Create Account' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Sign In';
    }
  });
})();
</script>
<style>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
</body>
</html>
