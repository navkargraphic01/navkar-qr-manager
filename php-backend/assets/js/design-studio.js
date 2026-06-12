/* design-studio.js — Design Studio HTML5 Canvas logic */
'use strict';

let canvas, ctx;
let currentQrData = null;
let currentStyle = 'modern';
let tempQrCanvas = null;

// Design State
const state = {
  heading: 'Scan to View',
  subheading: 'Navkar Plywood Products',
  bgColor: '#ffffff',
  textColor: '#111827',
  qrUrl: 'https://navkarplywood.com',
};

async function loadQrList() {
  const sel = document.getElementById('ds-qr-select');
  if (!sel) return;
  try {
    const data = await API.get('/qr', { limit: 50 });
    const qrs = data.qr_codes || data.data || [];
    qrs.forEach(q => {
      const opt = document.createElement('option');
      opt.value = q.qr_id;
      opt.textContent = `${q.product_name} (${q.qr_id})`;
      opt.dataset.url = window.SITE_BASE + '/p/' + q.qr_id;
      sel.appendChild(opt);
    });
  } catch (e) {
    console.warn('Failed to load QR list', e);
  }
}

function generateTempQr() {
  const div = document.createElement('div');
  new QRCode(div, {
    text: state.qrUrl,
    width: 400, height: 400,
    colorDark: state.textColor,
    colorLight: state.bgColor,
    correctLevel: QRCode.CorrectLevel.M
  });
  tempQrCanvas = div.querySelector('canvas');
  // Wait a tiny bit for render
  setTimeout(renderCanvas, 50);
}

function renderCanvas() {
  if (!ctx) return;

  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = state.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (currentStyle === 'modern') {
    // Modern: Gradient Header
    const grad = ctx.createLinearGradient(0,0, canvas.width, 200);
    grad.addColorStop(0, '#2563EB');
    grad.addColorStop(1, '#1D4ED8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, 180);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Inter, sans-serif';
    ctx.fillText(state.heading, canvas.width/2, 50);
    
    ctx.font = '24px Inter, sans-serif';
    ctx.globalAlpha = 0.9;
    ctx.fillText(state.subheading, canvas.width/2, 110);
    ctx.globalAlpha = 1.0;

    // Draw QR
    if (tempQrCanvas) {
      // White box for QR
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      ctx.beginPath();
      ctx.roundRect(80, 240, 440, 440, 24);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.drawImage(tempQrCanvas, 100, 260, 400, 400);
    }

    // Footer brand
    ctx.fillStyle = state.textColor;
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('NAVKAR PLYWOOD', canvas.width/2, 730);

  } else {
    // Classic Style
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.fillText(state.heading, canvas.width/2, 60);

    if (tempQrCanvas) {
      ctx.drawImage(tempQrCanvas, 100, 150, 400, 400);
    }

    ctx.font = '24px Inter, sans-serif';
    ctx.fillText(state.subheading, canvas.width/2, 600);
    
    ctx.fillStyle = '#2563EB';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('navkarplywood.com', canvas.width/2, 720);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('ds-canvas');
  if (canvas) ctx = canvas.getContext('2d');

  loadQrList();
  generateTempQr();

  // Inputs
  const bindInput = (id, stateKey, requiresQrRegen = false) => {
    document.getElementById(id)?.addEventListener('input', function() {
      state[stateKey] = this.value || this.placeholder;
      if (requiresQrRegen) generateTempQr();
      else renderCanvas();
    });
  };

  bindInput('ds-heading', 'heading');
  bindInput('ds-subheading', 'subheading');
  bindInput('ds-bg-color', 'bgColor', true);
  bindInput('ds-text-color', 'textColor', true);

  document.getElementById('ds-qr-select')?.addEventListener('change', function() {
    const opt = this.options[this.selectedIndex];
    if (opt && opt.dataset.url) {
      state.qrUrl = opt.dataset.url;
      state.heading = opt.textContent.split('(')[0].trim() || 'Scan to View';
      document.getElementById('ds-heading').value = state.heading;
      generateTempQr();
    }
  });

  // Style buttons
  document.querySelectorAll('.ds-template-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ds-template-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentStyle = this.dataset.style;
      renderCanvas();
    });
  });

  // Download
  document.getElementById('download-canvas-btn')?.addEventListener('click', () => {
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `navkar-design-${Date.now()}.png`;
    a.click();
    Toast.success('Design Downloaded!');
  });
});
