// ============================================================
// QR REDIRECT ROUTE - /p/:qrId
// This is the most performance-critical route.
// When a QR code is scanned → fetch URL → redirect → track scan
// ============================================================
const express = require('express');
const router = express.Router();
const UAParser = require('ua-parser-js');
const { redirectLimiter } = require('../middleware/rateLimit');

// In-memory cache for redirect URLs (reduces DB calls)
const redirectCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

const getFromCache = (qrId) => {
  const cached = redirectCache.get(qrId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }
  redirectCache.delete(qrId);
  return null;
};

const setCache = (qrId, url) => {
  redirectCache.set(qrId, { url, timestamp: Date.now() });
  // Prevent memory leak - cap cache size
  if (redirectCache.size > 1000) {
    const firstKey = redirectCache.keys().next().value;
    redirectCache.delete(firstKey);
  }
};

// GET /p/:qrId - Main redirect handler
router.get('/:qrId', redirectLimiter, async (req, res) => {
  const { qrId } = req.params;
  const supabase = req.app.get('supabase');
  const startTime = Date.now();

  try {
    // Normalize QR ID (uppercase)
    const normalizedQrId = qrId.toUpperCase();

    // Check cache first
    let destinationUrl = getFromCache(normalizedQrId);

    if (!destinationUrl) {
      // Fetch from database
      const { data: qrCode, error } = await supabase
        .from('qr_codes')
        .select('id, destination_url, status, product_name')
        .eq('qr_id', normalizedQrId)
        .single();

      if (error || !qrCode) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>QR Code Not Found - Navkar Plywood</title>
            <style>
              body { font-family: Inter, sans-serif; display: flex; align-items: center; 
                     justify-content: center; min-height: 100vh; margin: 0; 
                     background: #FAFAFA; color: #111; }
              .box { text-align: center; padding: 2rem; }
              h1 { color: #C62828; font-size: 1.5rem; }
              p { color: #6B7280; }
              a { color: #C62828; }
            </style>
          </head>
          <body>
            <div class="box">
              <h1>QR Code Not Found</h1>
              <p>The QR code <strong>${normalizedQrId}</strong> does not exist.</p>
              <p>Visit <a href="https://navkarplywood.com">navkarplywood.com</a></p>
            </div>
          </body>
          </html>
        `);
      }

      if (qrCode.status !== 'active') {
        return res.status(410).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>QR Code Inactive - Navkar Plywood</title>
            <style>
              body { font-family: Inter, sans-serif; display: flex; align-items: center;
                     justify-content: center; min-height: 100vh; margin: 0; 
                     background: #FAFAFA; }
              .box { text-align: center; padding: 2rem; }
              h1 { color: #C62828; }
              p { color: #6B7280; }
            </style>
          </head>
          <body>
            <div class="box">
              <h1>This QR Code is Inactive</h1>
              <p>The product <strong>${qrCode.product_name}</strong> is currently unavailable.</p>
              <p>Visit <a href="https://navkarplywood.com">navkarplywood.com</a></p>
            </div>
          </body>
          </html>
        `);
      }

      destinationUrl = qrCode.destination_url;
      setCache(normalizedQrId, destinationUrl);

      // Track scan asynchronously (don't block redirect)
      trackScan(supabase, qrCode.id, normalizedQrId, destinationUrl, req).catch(console.error);

      // Also update scan_count and last_scanned_at
      supabase
        .from('qr_codes')
        .update({
          scan_count: supabase.rpc ? undefined : undefined,
          last_scanned_at: new Date().toISOString()
        })
        .eq('id', qrCode.id)
        .then(() => {
          supabase.rpc('increment_scan_count', { qr_id_param: qrCode.id })
            .catch(() => {
              // Fallback: direct update
              supabase.from('qr_codes')
                .update({ last_scanned_at: new Date().toISOString() })
                .eq('id', qrCode.id);
            });
        });
    }

    // Log performance
    console.log(`[REDIRECT] ${normalizedQrId} → ${destinationUrl} (${Date.now() - startTime}ms)`);

    // Redirect with 302 (temporary - so browsers don't cache it, important for dynamic QR)
    res.redirect(302, destinationUrl);

  } catch (error) {
    console.error('[REDIRECT ERROR]', error);
    // Fallback to main website on error
    res.redirect(302, 'https://navkarplywood.com');
  }
});

// ============================================================
// Track scan analytics (non-blocking)
// ============================================================
async function trackScan(supabase, qrCodeId, qrId, destinationUrl, req) {
  try {
    const ua = new UAParser(req.headers['user-agent']);
    const deviceResult = ua.getResult();

    const device_type = deviceResult.device.type === 'mobile' ? 'mobile'
      : deviceResult.device.type === 'tablet' ? 'tablet'
      : deviceResult.device.type ? deviceResult.device.type
      : 'desktop';

    // Get IP (consider proxies)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.socket?.remoteAddress
      || null;

    // Geo lookup (optional - don't fail if unavailable)
    let geo = {};
    if (ip && ip !== '127.0.0.1' && ip !== '::1' && process.env.GEO_API_URL) {
      try {
        const axios = require('axios');
        const geoRes = await axios.get(`${process.env.GEO_API_URL}/${ip}/json`, {
          timeout: 2000 // 2 second timeout - don't slow down tracking
        });
        geo = {
          country: geoRes.data.country_name,
          country_code: geoRes.data.country_code,
          city: geoRes.data.city,
          region: geoRes.data.region,
          latitude: geoRes.data.latitude,
          longitude: geoRes.data.longitude
        };
      } catch {
        // Geo lookup failed - continue without it
      }
    }

    await supabase.from('scans').insert({
      qr_code_id: qrCodeId,
      qr_id: qrId,
      destination_url: destinationUrl,
      device_type,
      browser: `${deviceResult.browser.name || ''} ${deviceResult.browser.version || ''}`.trim(),
      os: `${deviceResult.os.name || ''} ${deviceResult.os.version || ''}`.trim(),
      user_agent: req.headers['user-agent']?.substring(0, 500),
      ip_address: ip,
      referrer: req.headers.referer?.substring(0, 500) || null,
      ...geo
    });
  } catch (error) {
    console.error('[SCAN TRACKING ERROR]', error.message);
  }
}

module.exports = router;
